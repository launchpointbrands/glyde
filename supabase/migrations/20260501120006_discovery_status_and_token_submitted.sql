-- Discovery: answer status, plus client-token submission timestamp.
--
-- Two small additions to support step 7 (discovery / intake flow):
--
-- 1) discovery_responses.status — distinguish "answered" (has a real value)
--    from "skipped" (advisor moved past it for now) and "unknown" (genuinely
--    flagged for follow-up). A row with status != 'answered' carries no
--    usable value; downstream consumers (risk model etc.) must ignore them.
--    "Blank" remains the absence of a row.
--
-- 2) client_access_tokens.submitted_at — set when the client finishes the
--    self-serve flow and hits "Send to my advisor." Distinguishes "still
--    in progress" from "client said they're done." Self-serve UI itself is
--    deferred until after the four module dashboards ship; the column is
--    added now so the schema stays coherent and the data model is forward-
--    compatible.

create type discovery_response_status as enum ('answered', 'skipped', 'unknown');

alter table discovery_responses
  add column status discovery_response_status not null default 'answered';

alter table client_access_tokens
  add column submitted_at timestamptz;
