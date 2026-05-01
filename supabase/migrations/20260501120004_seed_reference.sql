-- Seed reference data: Demo Firm, discovery_fields, readiness_item_reference.
-- All idempotent via ON CONFLICT — safe to re-apply.
--
-- Wealth and succession discovery_fields are deferred until those modules
-- are built. The 11 fields here cover business_profile + risk and are
-- lifted from the RISR sample-report teardown.

-- ---------------------------------------------------------------
-- Demo Firm — every new sign-up attaches here for now (see signup trigger).
-- ---------------------------------------------------------------

insert into firms (id, name, slug, status)
values (
  '00000000-0000-0000-0000-000000000001',
  'Demo Firm',
  'demo-firm',
  'active'
)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------
-- discovery_fields
-- ---------------------------------------------------------------

insert into discovery_fields (key, label, help_text, input_type, choices, module, display_order, asks_during) values
  ('business_tax_structure',
   'Business tax structure',
   'How the business is taxed for federal purposes.',
   'enum_single',
   '[{"value":"sole_proprietorship","label":"Sole Proprietorship"},{"value":"partnership","label":"Partnership"},{"value":"s_corp","label":"S-Corp"},{"value":"c_corp","label":"C-Corp"},{"value":"llc","label":"LLC"}]',
   'business_profile', 10, 'any'),

  ('industry_naics',
   'Industry (NAICS)',
   '6-digit NAICS code that best describes the business.',
   'text',
   null,
   'business_profile', 20, 'any'),

  ('customer_count',
   'How many customers does the business have?',
   'Approximate number of distinct paying customers in the last 12 months.',
   'enum_single',
   '[{"value":"0_20","label":"0–20"},{"value":"21_100","label":"21–100"},{"value":"101_500","label":"101–500"},{"value":"501_2000","label":"501–2,000"},{"value":"2000_plus","label":"2,000+"}]',
   'risk', 110, 'any'),

  ('top_2_customer_revenue_pct',
   'Revenue from top 2 customers',
   'What share of revenue comes from the two largest customers.',
   'enum_single',
   '[{"value":"0_10","label":"0–10%"},{"value":"11_25","label":"11–25%"},{"value":"26_50","label":"26–50%"},{"value":"51_75","label":"51–75%"},{"value":"76_100","label":"76–100%"}]',
   'risk', 120, 'any'),

  ('revenue_recurring_pct',
   'Recurring revenue (% of total)',
   'Share of total revenue that is contractually recurring.',
   'percentage',
   null,
   'risk', 130, 'any'),

  ('top_vendor_revenue_pct',
   '% of expenses from top vendor',
   'Approximate share of total spend going to the single largest vendor.',
   'percentage',
   null,
   'risk', 140, 'any'),

  ('financial_record_manager',
   'Who manages the financial records?',
   'Best description of who keeps the books.',
   'enum_single',
   '[{"value":"self","label":"Owner / self"},{"value":"bookkeeper","label":"Bookkeeper"},{"value":"cpa","label":"CPA"},{"value":"bookkeeper_and_cpa","label":"Bookkeeper & CPA"},{"value":"fractional_cfo","label":"Fractional CFO"}]',
   'risk', 150, 'any'),

  ('owner_departure_impact',
   'Impact if the owner stepped away tomorrow',
   'How likely is it that revenue or operations would be materially disrupted.',
   'enum_single',
   '[{"value":"very_unlikely","label":"Very unlikely"},{"value":"unlikely","label":"Unlikely"},{"value":"neutral","label":"Neutral"},{"value":"likely","label":"Likely"},{"value":"very_likely","label":"Very likely"}]',
   'risk', 160, 'any'),

  ('key_employee_departure_impact',
   'Impact if a key employee left',
   'How likely is it that revenue or operations would be materially disrupted.',
   'enum_single',
   '[{"value":"very_unlikely","label":"Very unlikely"},{"value":"unlikely","label":"Unlikely"},{"value":"neutral","label":"Neutral"},{"value":"likely","label":"Likely"},{"value":"very_likely","label":"Very likely"}]',
   'risk', 170, 'any'),

  ('buy_sell_status',
   'Buy-sell agreement status',
   'Whether a buy-sell agreement is in place and current.',
   'enum_single',
   '[{"value":"none","label":"None"},{"value":"in_place","label":"In place"},{"value":"needs_review","label":"Needs review"},{"value":"outdated","label":"Outdated"}]',
   'risk', 180, 'any'),

  ('buy_sell_last_reviewed',
   'Buy-sell last reviewed',
   'How recently the buy-sell agreement was reviewed.',
   'enum_single',
   '[{"value":"never","label":"Never"},{"value":"more_than_3_years","label":"More than 3 years ago"},{"value":"1_to_3_years","label":"1–3 years ago"},{"value":"less_than_1_year","label":"Less than 1 year ago"}]',
   'risk', 190, 'any')
on conflict (key) do nothing;

-- ---------------------------------------------------------------
-- readiness_item_reference — 8 personal + 7 business, lifted from
-- the RISR Succession sample report.
-- ---------------------------------------------------------------

insert into readiness_item_reference (key, category, label, display_order) values
  -- Personal
  ('clearly_define_transition_priorities', 'personal', 'Clearly define transition priorities', 10),
  ('identify_net_proceeds_needed',         'personal', 'Identify net proceeds from exit needed to fund goals', 20),
  ('review_plan_with_family',              'personal', 'Review succession & exit plan with family', 30),
  ('plan_post_transition_time_use',        'personal', 'Identify how you will spend your time after transition', 40),
  ('identify_exit_timeline',               'personal', 'Identify ideal exit timeline', 50),
  ('identify_tax_optimization_strategies', 'personal', 'Identify tax optimization strategies', 60),
  ('build_team_of_professionals',          'personal', 'Build team of professionals', 70),
  ('confirm_buy_sell_and_insurance',       'personal', 'Confirm up-to-date buy-sell agreement and insurance policy is in place', 80),
  -- Business
  ('retain_key_employees',          'business', 'Help insure strength and retention of key employees', 110),
  ('organize_financial_records',    'business', 'Organize financial records with accountant', 120),
  ('prepare_for_diligence',         'business', 'Prepare for legal, financial, and operational diligence', 130),
  ('identify_successors_or_buyers', 'business', 'Identify successors / buyers', 140),
  ('identify_exit_path',            'business', 'Identify ideal succession & exit path', 150),
  ('mitigate_key_business_risks',   'business', 'Mitigate key business risks', 160),
  ('strengthen_sops',               'business', 'Strengthen standard operating practices (SOPs)', 170)
on conflict (key) do nothing;
