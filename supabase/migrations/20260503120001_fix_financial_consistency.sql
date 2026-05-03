-- Heal existing wealth_plans / risk_assessments / valuation_snapshots rows
-- that violate the consistency rules introduced this session.
--
-- Rules enforced (applied to every non-demo case):
--   1. Wealth: goal_ebitda > current normalized_ebitda; goal_valuation
--      >= 1.2x current valuation_estimate; net_proceeds_target > 0.
--   2. Risk: when factors are empty (no discovery), overall_risk and
--      risk_to_equity default to 'moderate' — never derived from
--      EBITDA multiple as the prior code did.
--   3. Valuation impact: when factors are empty, risk_impact_pct
--      defaults to 3-6 (conservative band for unknown discovery state).
--   4. Valuation invariants: clamp valuation_high <= valuation_low and
--      equity_value_owned > valuation_estimate.
--
-- Demo cases (label='demo') are skipped — those numbers are hand-curated
-- to match the RISR teardown and must not drift.

-- 1. Wealth guardrails — recompute goal_valuation / goal_ebitda /
-- net_proceeds_target from the most recent valuation_snapshot for each
-- non-demo case where the existing values violate the rules.
with case_valuations as (
  select distinct on (case_id)
    case_id, valuation_estimate, normalized_ebitda
  from valuation_snapshots
  order by case_id, computed_at desc
),
fixes as (
  select
    wp.id            as wp_id,
    cv.valuation_estimate,
    cv.normalized_ebitda,
    greatest(
      coalesce(wp.goal_valuation, 0),
      round(coalesce(cv.valuation_estimate, 0) * 1.3)
    ) as new_goal_valuation,
    greatest(
      coalesce(wp.goal_ebitda, 0),
      round(coalesce(cv.normalized_ebitda, 0) * 1.5)
    ) as new_goal_ebitda
  from wealth_plans wp
  join cases c on c.id = wp.case_id
  join case_valuations cv on cv.case_id = wp.case_id
  where c.label is distinct from 'demo'
)
update wealth_plans wp
set
  goal_valuation = f.new_goal_valuation,
  goal_ebitda = f.new_goal_ebitda,
  net_proceeds_target = round(f.new_goal_valuation * 0.7)
from fixes f
where wp.id = f.wp_id
  and (
    coalesce(wp.goal_valuation, 0) < round(coalesce(f.valuation_estimate, 0) * 1.2)
    or coalesce(wp.goal_ebitda, 0) <= coalesce(f.normalized_ebitda, 0)
    or coalesce(wp.net_proceeds_target, 0) <= 0
  );

-- 2. Risk consistency — when factors are empty, overall_risk and
-- risk_to_equity must default to 'moderate'. Risk should be evaluated
-- from discovery, not from EBITDA-multiple-derived noise.
update risk_assessments ra
set
  overall_risk = 'moderate',
  risk_to_equity = 'moderate'
from cases c
where c.id = ra.case_id
  and c.label is distinct from 'demo'
  and jsonb_array_length(ra.factors) = 0
  and (ra.overall_risk is distinct from 'moderate'
       or ra.risk_to_equity is distinct from 'moderate');

-- 3. Valuation impact — empty-factor cases should show a conservative
-- 3-6% band rather than a level inferred from EBITDA multiple.
update valuation_snapshots vs
set
  risk_impact_pct_low = 3,
  risk_impact_pct_high = 6
from cases c
join risk_assessments ra on ra.case_id = c.id
where c.id = vs.case_id
  and c.label is distinct from 'demo'
  and jsonb_array_length(ra.factors) = 0
  and (
    coalesce(vs.risk_impact_pct_low, -1) <> 3
    or coalesce(vs.risk_impact_pct_high, -1) <> 6
  );

-- 4. Valuation invariants — clamp any rows where high <= low.
update valuation_snapshots
set
  valuation_high = round(valuation_estimate * 1.15),
  valuation_low = round(valuation_estimate * 0.85)
where valuation_estimate is not null
  and valuation_high is not null
  and valuation_low is not null
  and valuation_high <= valuation_low;

-- 5. Valuation invariants — clamp equity_value_owned > valuation_estimate.
update valuation_snapshots
set equity_value_owned = valuation_estimate
where valuation_estimate is not null
  and equity_value_owned is not null
  and equity_value_owned > valuation_estimate;
