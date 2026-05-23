-- Prompt History Metadata Enhancements SQL Migration

alter table prompt_analyses add column if not exists title text null;
alter table prompt_analyses add column if not exists is_favorite boolean not null default false;
alter table prompt_analyses add column if not exists deleted_at timestamptz null;

-- Optimize index queries for soft-deletes and favoriting
create index if not exists idx_prompt_analyses_deleted_at on prompt_analyses(deleted_at);
create index if not exists idx_prompt_analyses_is_favorite on prompt_analyses(is_favorite);
