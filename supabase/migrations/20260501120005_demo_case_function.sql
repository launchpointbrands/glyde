-- seed_demo_case_for_current_advisor()
--
-- Idempotently creates the canonical Peter Smith / Precision Auto Services
-- demo case for the calling advisor. This is the same fictional case shown
-- across the four RISR sample reports — useful as a stable fixture for
-- dashboard development.
--
-- Returns the new case_id, or null if the calling advisor already has a
-- demo case (cases.label = 'demo'). The server-side action treats null as
-- "find the existing one and redirect there."
--
-- Runs SECURITY INVOKER (default) so RLS still applies to every insert.
-- Tenancy is scoped via auth.uid() and current_advisor_firm_id(). The
-- whole function body is one transaction — partial failure rolls back.

create or replace function public.seed_demo_case_for_current_advisor()
returns uuid
language plpgsql
as $$
declare
  v_advisor_id uuid := auth.uid();
  v_firm_id uuid := current_advisor_firm_id();
  v_existing_case_id uuid;
  v_client_business_id uuid;
  v_case_id uuid;
  v_valuation_id uuid;
begin
  if v_advisor_id is null or v_firm_id is null then
    raise exception 'No authenticated advisor.';
  end if;

  -- Idempotency: short-circuit if a demo case already exists.
  select id into v_existing_case_id
  from cases
  where label = 'demo' and advisor_id = v_advisor_id
  limit 1;
  if v_existing_case_id is not null then
    return null;
  end if;

  -- 1) client_business
  insert into client_businesses (
    advisor_id, firm_id, business_name, domain, primary_owner_name, created_via
  ) values (
    v_advisor_id, v_firm_id, 'Precision Auto Services', 'precisionauto.com',
    'Peter Smith', 'advisor_manual'
  ) returning id into v_client_business_id;

  -- 2) case
  insert into cases (
    client_business_id, advisor_id, firm_id, status,
    ownership_pct, owner_age, label
  ) values (
    v_client_business_id, v_advisor_id, v_firm_id, 'tier_3',
    80, 55, 'demo'
  ) returning id into v_case_id;

  -- 3) valuation_snapshot — RISR-canonical numbers (page 1 of the sample)
  insert into valuation_snapshots (
    case_id, source,
    valuation_low, valuation_estimate, valuation_high,
    equity_value_owned, naics_code,
    ebitda_multiple, revenue_multiple,
    revenue_ttm, normalized_ebitda,
    net_working_capital, interest_bearing_debt, balance_sheet_impact,
    risk_score, risk_impact_pct_low, risk_impact_pct_high
  ) values (
    v_case_id, 'simulated',
    8900000, 10009027, 10200000,
    8007221, '332710',
    10.00, 1.75,
    5796069, 1056701,
    1037261, 918922, 118339,
    'moderate', 4, 6
  ) returning id into v_valuation_id;

  -- 4) risk_assessment — 8 factors lifted from the RISR teardown.
  insert into risk_assessments (
    case_id, valuation_snapshot_id, overall_risk, factors,
    buy_sell_status, equity_at_risk_value, risk_to_equity
  ) values (
    v_case_id, v_valuation_id, 'moderate',
    jsonb_build_array(
      jsonb_build_object(
        'key', 'owner_dependency',
        'label', 'Owner dependency risk',
        'severity', 'high',
        'headline', 'Delegate strategically, build process, and empower your team.',
        'explanation', 'If revenue and operations would be materially disrupted by your departure, it limits the buyer pool and the price they''ll pay. Buyers want a business that runs without its founder.',
        'source_field', 'owner_departure_impact',
        'source_value', 'very_likely',
        'computed_value', null
      ),
      jsonb_build_object(
        'key', 'key_employee_dependency',
        'label', 'Key employee dependency risk',
        'severity', 'high',
        'headline', 'Take steps to retain key employees and reduce dependency on them.',
        'explanation', 'When the business depends heavily on specific people, their departure creates an existential risk. Retention plans, equity, and cross-training all reduce this.',
        'source_field', 'key_employee_departure_impact',
        'source_value', 'very_likely',
        'computed_value', null
      ),
      jsonb_build_object(
        'key', 'customer_concentration',
        'label', 'Customer concentration risk',
        'severity', 'high',
        'headline', 'Expand and diversify your customer base.',
        'explanation', 'When a small number of customers drive most of the revenue, losing one creates a material hit. Diversification builds resilience and improves the multiple.',
        'source_field', 'top_2_customer_revenue_pct',
        'source_value', '51_75',
        'computed_value', null
      ),
      jsonb_build_object(
        'key', 'supplier_diversity',
        'label', 'Supplier diversity risk',
        'severity', 'moderate',
        'headline', 'Review your supplier relationships routinely.',
        'explanation', 'When one vendor accounts for a significant share of spend, an outage or price hike from them is a real disruption. Plans for backup sourcing reduce that.',
        'source_field', 'top_vendor_revenue_pct',
        'source_value', 25,
        'computed_value', null
      ),
      jsonb_build_object(
        'key', 'liquidity',
        'label', 'Liquidity risk',
        'severity', 'low',
        'headline', 'Your short-term liquidity is strong.',
        'explanation', 'Adequate working capital and cash reserves let the business absorb shocks without resorting to expensive emergency financing.',
        'source_field', null,
        'source_value', null,
        'computed_value', null
      ),
      jsonb_build_object(
        'key', 'financial_practice',
        'label', 'Financial practice risks',
        'severity', 'low',
        'headline', 'Partner with a bookkeeper and CPA to maintain your financial records.',
        'explanation', 'Clean books reduce diligence friction and signal operational rigor to buyers. The combination of a bookkeeper handling day-to-day with a CPA reviewing periodically is the standard.',
        'source_field', 'financial_record_manager',
        'source_value', 'bookkeeper_and_cpa',
        'computed_value', null
      ),
      jsonb_build_object(
        'key', 'revenue_quality',
        'label', 'Revenue quality risk',
        'severity', 'low',
        'headline', 'Maintain and expand recurring revenue streams.',
        'explanation', 'Recurring revenue commands a higher multiple than one-time. Shifting toward more renewing/recurring revenue is one of the highest-leverage moves toward valuation.',
        'source_field', 'revenue_recurring_pct',
        'source_value', 40,
        'computed_value', null
      ),
      jsonb_build_object(
        'key', 'leverage',
        'label', 'Leverage risk',
        'severity', 'low',
        'headline', 'Your debt to estimated equity valuation is 0.15.',
        'explanation', 'Modest leverage relative to equity gives the business flexibility while still capturing some of the tax benefit of debt financing.',
        'source_field', null,
        'source_value', null,
        'computed_value', '0.15'
      )
    ),
    'needs_review', 8007221, 'moderate'
  );

  -- 5) wealth_plan — RISR Wealth Blueprint numbers
  insert into wealth_plans (
    case_id, net_proceeds_target, exit_year, target_age,
    goal_valuation, goal_ebitda,
    historic_avg_revenue_growth, goal_revenue_growth,
    current_risk, goal_risk, historic_ebitda_series
  ) values (
    v_case_id, 10200000, 2030, 60,
    18100000, 1915428,
    0.16, 0.11,
    'moderate', 'low',
    jsonb_build_array(
      jsonb_build_object('year', 2022, 'value', 882000),
      jsonb_build_object('year', 2023, 'value', 1000000),
      jsonb_build_object('year', 2024, 'value', 1056701)
    )
  );

  -- 6) succession_plan — family-transition path per the RISR sample.
  -- TODO: the priority keys below are placeholders. Build a
  -- succession_priorities_reference seed table and switch these to
  -- FK-backed values before beta. Don't let these silently outlive the
  -- demo phase.
  insert into succession_plans (
    case_id, selected_path, priorities,
    personal_score, business_score, overall_score
  ) values (
    v_case_id, 'family',
    jsonb_build_array(
      'maintain_family_ownership',
      'preserve_operating_culture',
      'optimize_tax_for_transition'
    ),
    50, 43, 46
  );

  -- 7) readiness_items — 15 rows. Per the RISR teardown sample,
  -- 4 personal + 3 business are complete.
  insert into readiness_items (
    case_id, item_key, category, is_complete, completed_at, completed_by
  )
  select
    v_case_id,
    rir.key,
    rir.category,
    rir.key in (
      'clearly_define_transition_priorities',
      'identify_net_proceeds_needed',
      'identify_exit_timeline',
      'confirm_buy_sell_and_insurance',
      'organize_financial_records',
      'identify_exit_path',
      'strengthen_sops'
    ) as is_complete,
    case when rir.key in (
      'clearly_define_transition_priorities',
      'identify_net_proceeds_needed',
      'identify_exit_timeline',
      'confirm_buy_sell_and_insurance',
      'organize_financial_records',
      'identify_exit_path',
      'strengthen_sops'
    ) then now() else null end as completed_at,
    case when rir.key in (
      'clearly_define_transition_priorities',
      'identify_net_proceeds_needed',
      'identify_exit_timeline',
      'confirm_buy_sell_and_insurance',
      'organize_financial_records',
      'identify_exit_path',
      'strengthen_sops'
    ) then v_advisor_id else null end as completed_by
  from readiness_item_reference rir;

  -- 8) discovery_responses — the 11 source-answer values that drive the
  -- risk factors (and a few business-profile inputs).
  insert into discovery_responses (case_id, field_key, value, source) values
    (v_case_id, 'business_tax_structure',        to_jsonb('partnership'::text),       'simulated'),
    (v_case_id, 'industry_naics',                to_jsonb('332710'::text),            'simulated'),
    (v_case_id, 'customer_count',                to_jsonb('0_20'::text),              'simulated'),
    (v_case_id, 'top_2_customer_revenue_pct',    to_jsonb('51_75'::text),             'simulated'),
    (v_case_id, 'revenue_recurring_pct',         to_jsonb(40),                        'simulated'),
    (v_case_id, 'top_vendor_revenue_pct',        to_jsonb(25),                        'simulated'),
    (v_case_id, 'financial_record_manager',      to_jsonb('bookkeeper_and_cpa'::text),'simulated'),
    (v_case_id, 'owner_departure_impact',        to_jsonb('very_likely'::text),       'simulated'),
    (v_case_id, 'key_employee_departure_impact', to_jsonb('very_likely'::text),       'simulated'),
    (v_case_id, 'buy_sell_status',               to_jsonb('in_place'::text),          'simulated'),
    (v_case_id, 'buy_sell_last_reviewed',        to_jsonb('1_to_3_years'::text),      'simulated');

  return v_case_id;
end;
$$;

grant execute on function public.seed_demo_case_for_current_advisor() to authenticated;
