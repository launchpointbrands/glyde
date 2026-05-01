-- Glyde core schema: tenancy, cases, discovery, snapshots, readiness, exports.
-- Source of truth: "Data Model — Glyde MVP" Linear doc.

set check_function_bodies = off;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------

create type firm_status as enum ('active', 'paused', 'archived');
create type advisor_role as enum ('firm_admin', 'advisor');
create type advisor_status as enum ('active', 'invited', 'disabled');
create type client_business_created_via as enum ('advisor_manual', 'tier1_lookup', 'client_invite');
create type case_status as enum ('tier_1', 'tier_2', 'tier_3', 'archived');
create type discovery_input_type as enum ('enum_single', 'enum_multi', 'numeric', 'percentage', 'text');
create type discovery_module as enum ('business_profile', 'risk', 'wealth', 'succession');
create type discovery_asks_during as enum ('solo_prep', 'live_with_client', 'client_self_serve', 'any');
create type discovery_response_source as enum ('simulated', 'advisor', 'client', 'valuation_api');
create type valuation_source as enum ('simulated', 'valuation_api');
create type risk_level as enum ('low', 'moderate', 'high');
create type buy_sell_status as enum ('none', 'in_place', 'needs_review', 'outdated');
create type succession_path as enum ('family', 'internal', 'third_party', 'esop');
create type readiness_category as enum ('personal', 'business');
create type report_type as enum ('valuation', 'risk', 'wealth', 'succession');

-- ---------------------------------------------------------------
-- Generic updated_at trigger
-- ---------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------
-- firms — distribution unit. Doesn't pay; distributes Glyde.
-- ---------------------------------------------------------------

create table firms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  primary_color text,
  disclosure_text text,
  contact_email text,
  contact_phone text,
  status firm_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger firms_set_updated_at before update on firms
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- advisors — Supabase auth user attached to a firm. id == auth.users.id.
-- ---------------------------------------------------------------

create table advisors (
  id uuid primary key references auth.users(id) on delete cascade,
  firm_id uuid not null references firms(id),
  email text not null,
  full_name text,
  title text,
  role advisor_role not null default 'advisor',
  status advisor_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index advisors_firm_id_idx on advisors(firm_id);

create trigger advisors_set_updated_at before update on advisors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- client_businesses — the business an advisor is engaging with.
-- Not itself an auth user (yet).
-- ---------------------------------------------------------------

create table client_businesses (
  id uuid primary key default gen_random_uuid(),
  advisor_id uuid not null references advisors(id),
  firm_id uuid not null references firms(id),
  business_name text not null,
  domain text,
  primary_owner_name text,
  primary_owner_email text,
  created_via client_business_created_via not null default 'advisor_manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index client_businesses_advisor_id_idx on client_businesses(advisor_id);
create index client_businesses_firm_id_idx on client_businesses(firm_id);

create trigger client_businesses_set_updated_at before update on client_businesses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- cases — one engagement = one case = one client business.
-- Tier reflects how much real data has been captured (vs simulated).
-- ---------------------------------------------------------------

create table cases (
  id uuid primary key default gen_random_uuid(),
  client_business_id uuid not null references client_businesses(id),
  advisor_id uuid not null references advisors(id),
  firm_id uuid not null references firms(id),
  status case_status not null default 'tier_1',
  ownership_pct numeric(5, 2),
  owner_age integer,
  label text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index cases_client_business_id_idx on cases(client_business_id);
create index cases_advisor_id_idx on cases(advisor_id);
create index cases_firm_id_idx on cases(firm_id);

create trigger cases_set_updated_at before update on cases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- discovery_fields — reference table of every askable field.
-- ---------------------------------------------------------------

create table discovery_fields (
  key text primary key,
  label text not null,
  help_text text,
  input_type discovery_input_type not null,
  choices jsonb,
  module discovery_module not null,
  display_order integer not null,
  asks_during discovery_asks_during not null default 'any',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger discovery_fields_set_updated_at before update on discovery_fields
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- discovery_responses — per-case answers. Sparse: only filled fields.
-- ---------------------------------------------------------------

create table discovery_responses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  field_key text not null references discovery_fields(key),
  value jsonb,
  source discovery_response_source not null,
  answered_at timestamptz not null default now(),
  answered_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, field_key)
);

create index discovery_responses_case_id_idx on discovery_responses(case_id);
create index discovery_responses_field_key_idx on discovery_responses(field_key);

create trigger discovery_responses_set_updated_at before update on discovery_responses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- client_access_tokens — time-limited tokens for client self-serve.
-- ---------------------------------------------------------------

create table client_access_tokens (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index client_access_tokens_case_id_idx on client_access_tokens(case_id);

-- ---------------------------------------------------------------
-- valuation_snapshots — drives Business Valuation report. History, not current-only.
-- ---------------------------------------------------------------

create table valuation_snapshots (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  computed_at timestamptz not null default now(),
  source valuation_source not null,
  valuation_low numeric,
  valuation_estimate numeric,
  valuation_high numeric,
  equity_value_owned numeric,
  naics_code text,
  ebitda_multiple numeric,
  revenue_multiple numeric,
  revenue_ttm numeric,
  normalized_ebitda numeric,
  net_working_capital numeric,
  interest_bearing_debt numeric,
  balance_sheet_impact numeric,
  risk_score risk_level,
  risk_impact_pct_low numeric,
  risk_impact_pct_high numeric,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index valuation_snapshots_case_id_idx on valuation_snapshots(case_id);

-- ---------------------------------------------------------------
-- risk_assessments — drives Risk Report. Joined to a valuation snapshot
-- because the risk-impact-on-value is computed jointly.
-- ---------------------------------------------------------------

create table risk_assessments (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  valuation_snapshot_id uuid references valuation_snapshots(id),
  computed_at timestamptz not null default now(),
  overall_risk risk_level not null,
  factors jsonb not null,
  buy_sell_status buy_sell_status not null default 'none',
  equity_at_risk_value numeric,
  risk_to_equity risk_level,
  created_at timestamptz not null default now()
);

create index risk_assessments_case_id_idx on risk_assessments(case_id);
create index risk_assessments_valuation_snapshot_id_idx on risk_assessments(valuation_snapshot_id);

-- ---------------------------------------------------------------
-- wealth_plans — drives Business Wealth Blueprint.
-- ---------------------------------------------------------------

create table wealth_plans (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  computed_at timestamptz not null default now(),
  net_proceeds_target numeric,
  exit_year integer,
  target_age integer,
  goal_valuation numeric,
  goal_ebitda numeric,
  historic_avg_revenue_growth numeric,
  goal_revenue_growth numeric,
  current_risk risk_level,
  goal_risk risk_level,
  historic_ebitda_series jsonb,
  created_at timestamptz not null default now()
);

create index wealth_plans_case_id_idx on wealth_plans(case_id);

-- ---------------------------------------------------------------
-- succession_plans — drives Succession & Exit report.
-- ---------------------------------------------------------------

create table succession_plans (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  computed_at timestamptz not null default now(),
  selected_path succession_path,
  priorities jsonb,
  personal_score integer,
  business_score integer,
  overall_score integer,
  created_at timestamptz not null default now()
);

create index succession_plans_case_id_idx on succession_plans(case_id);

-- ---------------------------------------------------------------
-- readiness_item_reference — seeded list. Per the data-model spec,
-- readiness_items.item_key references this table for FK integrity.
-- ---------------------------------------------------------------

create table readiness_item_reference (
  key text primary key,
  category readiness_category not null,
  label text not null,
  display_order integer not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- readiness_items — per-case checklist state.
-- ---------------------------------------------------------------

create table readiness_items (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  item_key text not null references readiness_item_reference(key),
  category readiness_category not null,
  is_complete boolean not null default false,
  completed_at timestamptz,
  completed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (case_id, item_key)
);

create index readiness_items_case_id_idx on readiness_items(case_id);
create index readiness_items_item_key_idx on readiness_items(item_key);

create trigger readiness_items_set_updated_at before update on readiness_items
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------
-- report_exports — history of generated PDFs.
-- ---------------------------------------------------------------

create table report_exports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references cases(id) on delete cascade,
  report_type report_type not null,
  valuation_snapshot_id uuid references valuation_snapshots(id),
  risk_assessment_id uuid references risk_assessments(id),
  wealth_plan_id uuid references wealth_plans(id),
  succession_plan_id uuid references succession_plans(id),
  pdf_url text,
  generated_by uuid,
  generated_at timestamptz not null default now()
);

create index report_exports_case_id_idx on report_exports(case_id);
