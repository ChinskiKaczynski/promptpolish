-- SQL migration to add audit_mode column to prompt_analyses table.
alter table prompt_analyses add column if not exists audit_mode text null;
