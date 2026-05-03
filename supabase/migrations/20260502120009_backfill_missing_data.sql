-- Retroactive backfill for two classes of broken state in production:
--
--   1) Cases created during the empty-dashboards bug window — missing
--      one or more of valuation_snapshots / risk_assessments /
--      wealth_plans / succession_plans, leaving Risk/Wealth/Succession
--      tabs empty for non-demo cases.
--
--   2) Advisors who signed up before the auto-seed trigger landed
--      and never got the Peter Smith demo case in their book.
--
-- Both are repaired by this migration. The backfill function is left
-- in place (granted to authenticated) for future ad-hoc use, but the
-- migration runs it once at apply time so production heals on deploy.
--
-- Backfilled placeholder values are deterministic-from-domain and
-- guaranteed to render — they won't match what the AI would produce
-- for a fresh case, but they unbreak the dashboards. Future cases go
-- through ensureFinancials → AI as designed.

create or replace function public.backfill_missing_snapshots()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  v_domain text;
  v_md5_bytes bytea;
  v_seed_norm numeric;
  v_revenue numeric;
  v_ebitda numeric;
  v_ebitda_multiple numeric;
  v_revenue_multiple numeric;
  v_valuation_low numeric;
  v_valuation_estimate numeric;
  v_valuation_high numeric;
  v_equity_value_owned numeric;
  v_working_capital numeric;
  v_total_debt numeric;
  v_balance_sheet_impact numeric;
  v_risk_score risk_level;
  v_risk_impact_low int;
  v_risk_impact_high int;
  v_valuation_id uuid;
  v_year int := extract(year from now())::int;
begin
  for c in
    select
      cs.id          as case_id,
      cs.ownership_pct,
      cb.domain,
      cb.business_name
    from cases cs
    join client_businesses cb on cb.id = cs.client_business_id
    where cs.label is distinct from 'demo'
  loop
    v_domain := coalesce(c.domain, c.business_name, 'unknown');

    -- Deterministic 0..1 seed derived from md5(domain). Uses bytea +
    -- get_byte to sidestep signed-int sign-bit issues from bit-casts.
    v_md5_bytes := decode(md5(v_domain), 'hex');
    v_seed_norm := (
      get_byte(v_md5_bytes, 0)::bigint * 16777216 +
      get_byte(v_md5_bytes, 1)::bigint * 65536 +
      get_byte(v_md5_bytes, 2)::bigint * 256 +
      get_byte(v_md5_bytes, 3)::bigint
    )::numeric / 4294967295::numeric;

    -- Realistic SMB ranges, same shape the simulator uses in JS.
    v_revenue := round(500000 + v_seed_norm * 9500000);     -- 500K..10M
    v_ebitda := round(v_revenue * 0.12);                     -- 12% margin
    v_ebitda_multiple := round((4 + v_seed_norm * 6)::numeric, 2);     -- 4..10x
    v_revenue_multiple := round((0.5 + v_seed_norm * 1.5)::numeric, 2); -- 0.5..2.0x

    v_valuation_estimate := round(
      (v_ebitda * v_ebitda_multiple + v_revenue * v_revenue_multiple) / 2
    );
    v_valuation_low := round(v_valuation_estimate * 0.85);
    v_valuation_high := round(v_valuation_estimate * 1.15);
    v_equity_value_owned := round(
      v_valuation_estimate * coalesce(c.ownership_pct, 100) / 100
    );

    v_working_capital := round(v_revenue * 0.10);
    v_total_debt := round(v_ebitda * 0.30);
    v_balance_sheet_impact := v_working_capital - v_total_debt;

    if v_ebitda_multiple >= 8 then
      v_risk_score := 'low';
      v_risk_impact_low := 0;
      v_risk_impact_high := 2;
    elsif v_ebitda_multiple <= 4.5 then
      v_risk_score := 'high';
      v_risk_impact_low := 10;
      v_risk_impact_high := 15;
    else
      v_risk_score := 'moderate';
      v_risk_impact_low := 4;
      v_risk_impact_high := 6;
    end if;

    -- 1) valuation_snapshots
    select id into v_valuation_id
    from valuation_snapshots
    where case_id = c.case_id
    limit 1;

    if v_valuation_id is null then
      insert into valuation_snapshots (
        case_id, source,
        valuation_low, valuation_estimate, valuation_high,
        equity_value_owned,
        ebitda_multiple, revenue_multiple,
        revenue_ttm, normalized_ebitda,
        net_working_capital, interest_bearing_debt, balance_sheet_impact,
        risk_score, risk_impact_pct_low, risk_impact_pct_high
      ) values (
        c.case_id, 'simulated',
        v_valuation_low, v_valuation_estimate, v_valuation_high,
        v_equity_value_owned,
        v_ebitda_multiple, v_revenue_multiple,
        v_revenue, v_ebitda,
        v_working_capital, v_total_debt, v_balance_sheet_impact,
        v_risk_score, v_risk_impact_low, v_risk_impact_high
      ) returning id into v_valuation_id;
    end if;

    -- 2) risk_assessments
    if not exists (select 1 from risk_assessments where case_id = c.case_id) then
      insert into risk_assessments (
        case_id, valuation_snapshot_id, overall_risk, factors,
        buy_sell_status, equity_at_risk_value, risk_to_equity
      ) values (
        c.case_id, v_valuation_id, v_risk_score, '[]'::jsonb,
        'none', v_equity_value_owned, v_risk_score
      );
    end if;

    -- 3) wealth_plans
    if not exists (select 1 from wealth_plans where case_id = c.case_id) then
      insert into wealth_plans (
        case_id, net_proceeds_target, exit_year, target_age,
        goal_valuation, goal_ebitda,
        historic_avg_revenue_growth, goal_revenue_growth,
        current_risk, goal_risk, historic_ebitda_series
      ) values (
        c.case_id,
        round(v_valuation_estimate * 1.3 * 0.7),
        v_year + 7,
        65,
        round(v_valuation_estimate * 1.3),
        round(v_ebitda * 1.5),
        0.05,
        0.10,
        v_risk_score, 'low',
        jsonb_build_array(
          jsonb_build_object('year', v_year - 2, 'value', round(v_ebitda * 0.85)),
          jsonb_build_object('year', v_year - 1, 'value', round(v_ebitda * 0.92)),
          jsonb_build_object('year', v_year,     'value', v_ebitda)
        )
      );
    end if;

    -- 4) succession_plans
    if not exists (select 1 from succession_plans where case_id = c.case_id) then
      insert into succession_plans (
        case_id, selected_path, priorities
      ) values (
        c.case_id, 'third_party',
        jsonb_build_array(
          'maintain_family_ownership',
          'preserve_operating_culture'
        )
      );
    end if;
  end loop;
end;
$$;

grant execute on function public.backfill_missing_snapshots() to authenticated;

-- Repair (1): fill missing module rows for every existing non-demo case.
select public.backfill_missing_snapshots();

-- Repair (2): seed the Peter Smith demo case for any advisors who
-- signed up before the auto-seed trigger landed and never got one.
-- The seed function is idempotent (short-circuits if a demo case
-- already exists for the advisor).
do $$
declare
  a record;
begin
  for a in
    select id from advisors
    where not exists (
      select 1 from cases where advisor_id = advisors.id and label = 'demo'
    )
  loop
    perform public.seed_demo_case_for_advisor(a.id);
  end loop;
end $$;
