-- Discovery fields for the three data domains that were previously
-- fabricated (hardcoded in ensureFinancials) instead of collected:
--   1. Revenue quality split — renewing + one-time alongside recurring
--      so the revenue_quality risk factor reflects the real mix.
--   2. Wealth goals — net proceeds needed, exit timeframe, target age,
--      and goal business risk. recomputeWealthPlan() reads these.
--   3. Succession — chosen transition path + exit priorities (multi).
--      recomputeSuccessionPlan() reads these.
--
-- All idempotent via ON CONFLICT — safe to re-apply. Field keys are
-- referenced by discovery-walkthrough.ts (STEPS), risk.ts, and plans.ts.

insert into discovery_fields (key, label, help_text, input_type, choices, module, display_order, asks_during) values
  -- 1. Revenue quality split (risk module, next to revenue_recurring_pct)
  ('revenue_renewing_pct',
   'Renewing revenue (% of total)',
   'Share of revenue that renews on a cadence but is not contractually locked (re-orders, repeat customers).',
   'percentage',
   null,
   'risk', 132, 'any'),

  ('revenue_one_time_pct',
   'One-time revenue (% of total)',
   'Share of revenue from one-off projects or transactions that will not repeat.',
   'percentage',
   null,
   'risk', 134, 'any'),

  -- 2. Wealth goals (wealth module)
  ('wealth_net_proceeds_target',
   'Net proceeds needed to fund goals',
   'After-tax cash the owner needs from a future sale to fund their personal goals (in dollars).',
   'numeric',
   null,
   'wealth', 210, 'any'),

  ('wealth_exit_timeframe_years',
   'Desired exit timeframe (years)',
   'How many years from now the owner ideally wants to exit.',
   'numeric',
   null,
   'wealth', 220, 'any'),

  ('wealth_target_age',
   'Target age at exit',
   'The age the owner wants to be when they exit the business.',
   'numeric',
   null,
   'wealth', 230, 'any'),

  ('wealth_goal_risk',
   'Target business risk at exit',
   'The business risk level the owner wants to reach before exiting.',
   'enum_single',
   '[{"value":"low","label":"Low"},{"value":"moderate","label":"Moderate"},{"value":"high","label":"High"}]',
   'wealth', 240, 'any'),

  -- 3. Succession (succession module)
  ('succession_path',
   'Preferred transition path',
   'How the owner envisions transitioning the business.',
   'enum_single',
   '[{"value":"family","label":"Transition to family"},{"value":"internal","label":"Internal transition (management / employees)"},{"value":"third_party","label":"Third-party sale"},{"value":"esop","label":"ESOP (employee stock ownership)"}]',
   'succession', 310, 'any'),

  ('succession_priorities',
   'What matters most during an exit',
   'Select every priority that matters to the owner during a future exit.',
   'enum_multi',
   '[{"value":"control_timing_terms","label":"Maintain control over the timing and terms of the exit"},{"value":"preserve_mission_culture","label":"Preserve the business mission, values, and culture"},{"value":"maximize_financial_value","label":"Maximize the financial value of the exit"},{"value":"take_care_of_employees","label":"Take care of employees and key staff"},{"value":"keep_in_family","label":"Keep the business in the family"},{"value":"minimize_taxes","label":"Minimize taxes on the transition"}]',
   'succession', 320, 'any')
on conflict (key) do nothing;
