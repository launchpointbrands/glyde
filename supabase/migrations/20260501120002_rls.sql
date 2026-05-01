-- Row-level security for Glyde.
-- Tenancy enforced at the database level. Source: "Data Model — Glyde MVP".

-- ---------------------------------------------------------------
-- Helpers — SECURITY DEFINER to break recursive RLS lookups
-- ---------------------------------------------------------------

create or replace function public.current_advisor_firm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select firm_id from advisors where id = auth.uid()
$$;

create or replace function public.current_advisor_role()
returns advisor_role
language sql
stable
security definer
set search_path = public
as $$
  select role from advisors where id = auth.uid()
$$;

create or replace function public.case_belongs_to_current_advisor(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from cases c
    where c.id = p_case_id
      and (
        c.advisor_id = auth.uid()
        or (c.firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
      )
  )
$$;

create or replace function public.case_owned_by_current_advisor(p_case_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1 from cases where id = p_case_id and advisor_id = auth.uid()
  )
$$;

-- ---------------------------------------------------------------
-- Reference tables — readable by any authenticated user.
-- ---------------------------------------------------------------

alter table discovery_fields enable row level security;
create policy discovery_fields_select on discovery_fields
  for select to authenticated using (true);

alter table readiness_item_reference enable row level security;
create policy readiness_item_reference_select on readiness_item_reference
  for select to authenticated using (true);

-- ---------------------------------------------------------------
-- firms
-- ---------------------------------------------------------------

alter table firms enable row level security;

create policy firms_select on firms
  for select to authenticated
  using (id = current_advisor_firm_id());

create policy firms_update on firms
  for update to authenticated
  using (id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
  with check (id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin');

-- ---------------------------------------------------------------
-- advisors
-- ---------------------------------------------------------------

alter table advisors enable row level security;

create policy advisors_select on advisors
  for select to authenticated
  using (firm_id = current_advisor_firm_id());

create policy advisors_update on advisors
  for update to authenticated
  using (
    id = auth.uid()
    or (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
  )
  with check (
    id = auth.uid()
    or (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
  );

-- ---------------------------------------------------------------
-- client_businesses
-- ---------------------------------------------------------------

alter table client_businesses enable row level security;

create policy client_businesses_select on client_businesses
  for select to authenticated
  using (
    advisor_id = auth.uid()
    or (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
  );

create policy client_businesses_insert on client_businesses
  for insert to authenticated
  with check (advisor_id = auth.uid() and firm_id = current_advisor_firm_id());

create policy client_businesses_update on client_businesses
  for update to authenticated
  using (advisor_id = auth.uid())
  with check (advisor_id = auth.uid());

create policy client_businesses_delete on client_businesses
  for delete to authenticated
  using (advisor_id = auth.uid());

-- ---------------------------------------------------------------
-- cases
-- ---------------------------------------------------------------

alter table cases enable row level security;

create policy cases_select on cases
  for select to authenticated
  using (
    advisor_id = auth.uid()
    or (firm_id = current_advisor_firm_id() and current_advisor_role() = 'firm_admin')
  );

create policy cases_insert on cases
  for insert to authenticated
  with check (advisor_id = auth.uid() and firm_id = current_advisor_firm_id());

create policy cases_update on cases
  for update to authenticated
  using (advisor_id = auth.uid())
  with check (advisor_id = auth.uid());

create policy cases_delete on cases
  for delete to authenticated
  using (advisor_id = auth.uid());

-- ---------------------------------------------------------------
-- Case-scoped child tables
-- READ: belongs (incl. firm_admin) — case_belongs_to_current_advisor
-- WRITE: owns — case_owned_by_current_advisor
-- ---------------------------------------------------------------

-- discovery_responses
alter table discovery_responses enable row level security;
create policy discovery_responses_select on discovery_responses
  for select to authenticated using (case_belongs_to_current_advisor(case_id));
create policy discovery_responses_insert on discovery_responses
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy discovery_responses_update on discovery_responses
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy discovery_responses_delete on discovery_responses
  for delete to authenticated using (case_owned_by_current_advisor(case_id));

-- client_access_tokens — only the case owner manages tokens.
-- (Client-facing self-serve uses a separate token-bearing context that
-- bypasses these advisor policies — implemented later, not in MVP.)
alter table client_access_tokens enable row level security;
create policy client_access_tokens_select on client_access_tokens
  for select to authenticated using (case_owned_by_current_advisor(case_id));
create policy client_access_tokens_insert on client_access_tokens
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy client_access_tokens_update on client_access_tokens
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy client_access_tokens_delete on client_access_tokens
  for delete to authenticated using (case_owned_by_current_advisor(case_id));

-- valuation_snapshots
alter table valuation_snapshots enable row level security;
create policy valuation_snapshots_select on valuation_snapshots
  for select to authenticated using (case_belongs_to_current_advisor(case_id));
create policy valuation_snapshots_insert on valuation_snapshots
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy valuation_snapshots_update on valuation_snapshots
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy valuation_snapshots_delete on valuation_snapshots
  for delete to authenticated using (case_owned_by_current_advisor(case_id));

-- risk_assessments
alter table risk_assessments enable row level security;
create policy risk_assessments_select on risk_assessments
  for select to authenticated using (case_belongs_to_current_advisor(case_id));
create policy risk_assessments_insert on risk_assessments
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy risk_assessments_update on risk_assessments
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy risk_assessments_delete on risk_assessments
  for delete to authenticated using (case_owned_by_current_advisor(case_id));

-- wealth_plans
alter table wealth_plans enable row level security;
create policy wealth_plans_select on wealth_plans
  for select to authenticated using (case_belongs_to_current_advisor(case_id));
create policy wealth_plans_insert on wealth_plans
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy wealth_plans_update on wealth_plans
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy wealth_plans_delete on wealth_plans
  for delete to authenticated using (case_owned_by_current_advisor(case_id));

-- succession_plans
alter table succession_plans enable row level security;
create policy succession_plans_select on succession_plans
  for select to authenticated using (case_belongs_to_current_advisor(case_id));
create policy succession_plans_insert on succession_plans
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy succession_plans_update on succession_plans
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy succession_plans_delete on succession_plans
  for delete to authenticated using (case_owned_by_current_advisor(case_id));

-- readiness_items
alter table readiness_items enable row level security;
create policy readiness_items_select on readiness_items
  for select to authenticated using (case_belongs_to_current_advisor(case_id));
create policy readiness_items_insert on readiness_items
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy readiness_items_update on readiness_items
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy readiness_items_delete on readiness_items
  for delete to authenticated using (case_owned_by_current_advisor(case_id));

-- report_exports
alter table report_exports enable row level security;
create policy report_exports_select on report_exports
  for select to authenticated using (case_belongs_to_current_advisor(case_id));
create policy report_exports_insert on report_exports
  for insert to authenticated with check (case_owned_by_current_advisor(case_id));
create policy report_exports_update on report_exports
  for update to authenticated
  using (case_owned_by_current_advisor(case_id))
  with check (case_owned_by_current_advisor(case_id));
create policy report_exports_delete on report_exports
  for delete to authenticated using (case_owned_by_current_advisor(case_id));
