-- Add an AI-generated business description column on client_businesses.
-- Backfill the canonical Peter Smith demo row so the existing demo case
-- shows a description without requiring an API call.

alter table client_businesses
  add column if not exists business_description text;

update client_businesses
  set business_description = 'Precision Auto Services is a partnership-structured automotive parts manufacturer serving commercial and industrial clients. The business generates approximately $5.8M in annual revenue with strong recurring customer relationships. Peter Smith serves as the primary owner and operator.'
  where business_name = 'Precision Auto Services'
    and domain = 'precisionauto.com'
    and business_description is null;
