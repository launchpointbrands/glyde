-- Phase 2 — multi-tenant branding: subentities, advisor↔subentity link,
-- tokenized advisor invites, a public "branding" storage bucket, and an
-- invite-aware signup trigger. All additive: new tables, one nullable
-- column, new policies. Reuses the existing RLS helpers
-- current_advisor_firm_id() / current_advisor_role().

-- ---------------------------------------------------------------
-- subentities — optional sub-brands ("1099s") under a firm (entity).
-- Mirrors the firm branding fields.
-- ---------------------------------------------------------------
create table if not exists public.subentities (
  id              uuid primary key default gen_random_uuid(),
  firm_id         uuid not null references public.firms(id) on delete cascade,
  name            text not null,
  slug            text not null,
  logo_url        text,
  primary_color   text,
  disclosure_text text,
  contact_email   text,
  contact_phone   text,
  status          firm_status not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz,
  unique (firm_id, slug)
);

alter table public.advisors
  add column if not exists subentity_id uuid
    references public.subentities(id) on delete set null;

alter table public.subentities enable row level security;

create policy subentities_select on public.subentities
  for select to authenticated
  using (firm_id = current_advisor_firm_id());

create policy subentities_insert on public.subentities
  for insert to authenticated
  with check (
    firm_id = current_advisor_firm_id()
    and current_advisor_role() = 'firm_admin'
  );

create policy subentities_update on public.subentities
  for update to authenticated
  using (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
  with check (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin');

create policy subentities_delete on public.subentities
  for delete to authenticated
  using (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin');

-- ---------------------------------------------------------------
-- advisor_invites — tokenized invites binding firm + (optional)
-- subentity + role. Redeemed at signup by the handle_new_user trigger.
-- ---------------------------------------------------------------
create table if not exists public.advisor_invites (
  id           uuid primary key default gen_random_uuid(),
  firm_id      uuid not null references public.firms(id) on delete cascade,
  subentity_id uuid references public.subentities(id) on delete set null,
  email        text,
  role         advisor_role not null default 'advisor',
  token        text not null unique,
  status       text not null default 'pending', -- pending | accepted | revoked
  invited_by   uuid references public.advisors(id) on delete set null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default (now() + interval '30 days'),
  accepted_at  timestamptz,
  accepted_by  uuid references public.advisors(id) on delete set null
);

alter table public.advisor_invites enable row level security;

-- Only a firm_admin manages invites for their firm. The signup trigger
-- reads invites as SECURITY DEFINER, so it bypasses these policies.
create policy advisor_invites_select on public.advisor_invites
  for select to authenticated
  using (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin');

create policy advisor_invites_insert on public.advisor_invites
  for insert to authenticated
  with check (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin');

create policy advisor_invites_update on public.advisor_invites
  for update to authenticated
  using (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
  with check (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin');

-- Pre-auth preview of an invite, so the signup page can show who invited
-- you without exposing the invites table. SECURITY DEFINER + anon grant.
create or replace function public.invite_preview(p_token text)
returns table (
  firm_name       text,
  subentity_name  text,
  invite_role     advisor_role,
  invite_email    text
)
language sql
security definer
stable
set search_path = public
as $$
  select f.name, s.name, i.role, i.email
  from advisor_invites i
  join firms f on f.id = i.firm_id
  left join subentities s on s.id = i.subentity_id
  where i.token = p_token
    and i.status = 'pending'
    and i.expires_at > now()
  limit 1;
$$;

grant execute on function public.invite_preview(text) to anon, authenticated;

-- ---------------------------------------------------------------
-- Storage — public "branding" bucket for firm/subentity logos.
-- Public read; authenticated write (uploads are mediated by a server
-- action that controls the object path + updates the owning row).
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

drop policy if exists "branding public read" on storage.objects;
create policy "branding public read" on storage.objects
  for select using (bucket_id = 'branding');

drop policy if exists "branding authenticated insert" on storage.objects;
create policy "branding authenticated insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding');

drop policy if exists "branding authenticated update" on storage.objects;
create policy "branding authenticated update" on storage.objects
  for update to authenticated
  using (bucket_id = 'branding') with check (bucket_id = 'branding');

drop policy if exists "branding authenticated delete" on storage.objects;
create policy "branding authenticated delete" on storage.objects
  for delete to authenticated using (bucket_id = 'branding');

-- ---------------------------------------------------------------
-- Signup trigger — honor an invite token if present, else fall back to
-- the seeded Demo Firm (the existing behavior). Replaces migration 0008's
-- handle_new_user.
-- ---------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token        text;
  v_invite       advisor_invites%rowtype;
  v_firm_id      uuid;
  v_subentity_id uuid;
  v_role         advisor_role;
begin
  v_token := nullif(new.raw_user_meta_data ->> 'invite_token', '');

  if v_token is not null then
    select * into v_invite
    from advisor_invites
    where token = v_token and status = 'pending' and expires_at > now()
    limit 1;
  end if;

  if v_invite.id is not null then
    v_firm_id      := v_invite.firm_id;
    v_subentity_id := v_invite.subentity_id;
    v_role         := v_invite.role;
  else
    select id into v_firm_id from firms where slug = 'demo-firm' limit 1;
    if v_firm_id is null then
      raise exception 'WMGR: Demo Firm not seeded — apply migration 0004 before sign-ups.';
    end if;
    v_subentity_id := null;
    v_role         := 'advisor';
  end if;

  insert into public.advisors (id, firm_id, subentity_id, email, full_name, role, status)
  values (
    new.id,
    v_firm_id,
    v_subentity_id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    v_role,
    'active'
  );

  if v_invite.id is not null then
    update advisor_invites
    set status = 'accepted', accepted_at = now(), accepted_by = new.id
    where id = v_invite.id;
  end if;

  begin
    perform public.seed_demo_case_for_advisor(new.id);
  exception when others then
    raise warning 'seed_demo_case_for_advisor failed for advisor %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;
