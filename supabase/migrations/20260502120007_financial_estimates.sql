-- Cache the AI-generated financial estimate JSON on the case row so
-- subsequent dashboard loads don't re-call the model. Populated by
-- ensureFinancials in src/lib/financials.ts after a successful
-- Anthropic call (or by the simulator-fallback path).

alter table cases
  add column if not exists financial_estimates jsonb;
