-- Add contact_email to client_businesses for the clients-list table.
-- Backfill the Peter Smith demo row so the EMAIL column has copy in
-- the canonical demo case.

alter table client_businesses
  add column if not exists contact_email text;

update client_businesses
  set contact_email = 'peter@precisionauto.com'
  where business_name = 'Precision Auto Services'
    and domain = 'precisionauto.com'
    and contact_email is null;
