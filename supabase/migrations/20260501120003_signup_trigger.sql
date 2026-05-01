-- Auto-provision an advisors row whenever a new auth.users row is inserted.
--
-- TODO (deferred): replace this with a real firm-admin invite flow before
-- beta. The proper flow uses invite tokens that pre-assign firm_id and
-- role; this trigger should branch on whether an invite is being redeemed.
-- For now, every sign-up is attached to the seeded "Demo Firm".

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_demo_firm_id uuid;
begin
  select id into v_demo_firm_id from firms where slug = 'demo-firm' limit 1;

  if v_demo_firm_id is null then
    raise exception 'Glyde: Demo Firm not seeded — apply migration 0004 before sign-ups.';
  end if;

  insert into public.advisors (id, firm_id, email, full_name, role, status)
  values (
    new.id,
    v_demo_firm_id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'advisor',
    'active'
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
