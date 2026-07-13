begin;
create table if not exists public.ai_runtime_config (
    id text primary key constraint ai_runtime_config_singleton_check check (id = 'active'),
    provider text not null constraint ai_runtime_config_provider_check check (provider in ('google', 'openrouter')),
    model_id text not null constraint ai_runtime_config_model_id_check check (
        char_length(trim(model_id)) between 1 and 200
    ),
    fallback_provider text null constraint ai_runtime_config_fallback_provider_check check (
        fallback_provider is null
        or fallback_provider in ('google', 'openrouter')
    ),
    fallback_model_id text null constraint ai_runtime_config_fallback_model_id_check check (
        fallback_model_id is null
        or char_length(trim(fallback_model_id)) between 1 and 200
    ),
    temperature double precision not null default 0.1 constraint ai_runtime_config_temperature_check check (
        temperature >= 0
        and temperature <= 2
    ),
    max_output_tokens integer not null default 6000 constraint ai_runtime_config_max_output_tokens_check check (
        max_output_tokens between 512 and 32768
    ),
    timeout_ms integer not null default 55000 constraint ai_runtime_config_timeout_check check (
        timeout_ms between 5000 and 120000
    ),
    thinking_budget integer not null default 0 constraint ai_runtime_config_thinking_budget_check check (
        thinking_budget between 0 and 32768
    ),
    constraint ai_runtime_config_fallback_pair_check check (
        (
            fallback_provider is null
            and fallback_model_id is null
        )
        or (
            fallback_provider is not null
            and fallback_model_id is not null
        )
    )
);
insert into public.ai_runtime_config (
        id,
        provider,
        model_id,
        fallback_provider,
        fallback_model_id,
        temperature,
        max_output_tokens,
        timeout_ms,
        thinking_budget
    )
values (
        'active',
        'google',
        'gemini-2.5-flash',
        null,
        null,
        0.1,
        6000,
        55000,
        0
    ) on conflict (id) do nothing;
alter table public.ai_runtime_config enable row level security;
revoke all on table public.ai_runtime_config
from public;
revoke all on table public.ai_runtime_config
from anon;
revoke all on table public.ai_runtime_config
from authenticated;
grant select on table public.ai_runtime_config to service_role;
commit;