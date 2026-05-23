// TODO: Implement typed Supabase data access in the dedicated DAL mission.
// Rules:
// - private prompt_analyses reads are server-only,
// - owner_anonymous_id is resolved server-side from secure cookie,
// - client does not send trusted owner_anonymous_id,
// - shared reads require share_token and is_share_enabled = true.

export {}
