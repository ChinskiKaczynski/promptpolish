insert into public.model_profiles (
        slug,
        display_name,
        provider,
        model_family,
        profile_type,
        source_type,
        verification_status,
        confidence_level,
        source_notes,
        profile_version
    )
values (
        'openrouter-deepseek-v4-flash',
        'DeepSeek v4 Flash Profile',
        'openrouter',
        'deepseek',
        'provider_model',
        'pending_verification',
        'unverified',
        'low',
        'OpenRouter profile slug. Capabilities and pricing are not verified.',
        '1.0.0'
    ) on conflict (slug) do
update
set display_name = excluded.display_name,
    provider = excluded.provider,
    model_family = excluded.model_family,
    profile_type = excluded.profile_type,
    source_type = excluded.source_type,
    verification_status = excluded.verification_status,
    confidence_level = excluded.confidence_level,
    source_notes = excluded.source_notes,
    profile_version = excluded.profile_version,
    updated_at = now();