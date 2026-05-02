-- Per-(advisor, case, item) status for the Advisor path on the overview
-- dashboard. Path items themselves are derived at render-time from
-- discovery + module data; only their lifecycle state lives here.
--
-- Status cycles todo → inprogress → done → todo on click. Done items
-- fold below the active list on the overview.

create table path_item_states (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  advisor_id uuid not null references advisors(id) on delete cascade,
  item_key text not null,
  status text not null default 'todo'
    check (status in ('todo', 'inprogress', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, advisor_id, item_key)
);

create index path_item_states_case_id_idx on path_item_states(case_id);

create trigger path_item_states_set_updated_at before update on path_item_states
  for each row execute function public.set_updated_at();

alter table path_item_states enable row level security;

create policy path_item_states_select on path_item_states
  for select to authenticated using (advisor_id = auth.uid());
create policy path_item_states_insert on path_item_states
  for insert to authenticated with check (advisor_id = auth.uid());
create policy path_item_states_update on path_item_states
  for update to authenticated
  using (advisor_id = auth.uid())
  with check (advisor_id = auth.uid());
create policy path_item_states_delete on path_item_states
  for delete to authenticated using (advisor_id = auth.uid());
