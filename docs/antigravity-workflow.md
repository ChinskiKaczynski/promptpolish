# Antigravity Workflow & Collaboration Policy

This document establishes the collaboration rules and step-by-step development pipeline between the Human Developer and the Antigravity Agent. These rules exist to maximize code quality, prevent plan drift, and enforce strict gates on high-risk operations.

---

## 1. The Five-Phase Development Lifecycle

All non-trivial tasks must proceed through this sequential workflow:

```text
[1. Research & Plan] ──> [2. Human Review] ──> [3. Plan Execution] ──> [4. Verify & Test] ──> [5. Walkthrough]
```

### Phase 1: Research & Planning
*   Investigate the workspace files, dependencies, and rules.
*   Check libraries or SDK patterns using **Context7** queries.
*   **Do not make any source code modifications during this phase.**
*   Create or update `implementation_plan.md` detailing exact proposed changes, and set `request_feedback: true`.

### Phase 2: Human Approval
*   Present the plan to the user.
*   **Stop and wait** for the user's explicit approval before proceeding.

### Phase 3: Plan Execution
*   Create `task.md` to track implementation tasks.
*   Keep edits small, contiguous, and isolated. Proactively fix compiler/lint issues.
*   Update `task.md` as items are completed (`[x]`).

### Phase 4: Verification & Testing
*   Validate the code by running `pnpm lint`, `pnpm build`, and relevant test suites.
*   Run unit/integration tests to ensure no regressions.

### Phase 5: Walkthrough
*   Create `walkthrough.md` summarizing the changes, testing commands run, and validation outcomes.
*   Provide a clear and humble summary to the user.

---

## 2. Mandatory Context7 Rules

Whenever the agent is queried about or plans to touch external frameworks, libraries, cloud providers, or APIs, it **MUST** resolve the library ID via `resolve-library-id` and fetch latest guidelines via `query-docs`. This rule applies to:
*   **Next.js App Router** (routes, server actions, config)
*   **Vercel AI SDK** & **@openrouter/ai-sdk-provider** (structured outputs, streaming APIs)
*   **Supabase** (client, query options, schemas)
*   **Zod** (object schema structures)

*Reasoning: The AI training cutoff may not reflect recent breaking changes in fast-moving libraries. Documentation fetched via Context7 is treated as the primary source of truth.*

---

## 3. Human-in-the-Loop Approval Gates

The agent is blocked from writing code or running modifying commands and **must request explicit approval** before touching the following high-risk areas:

> [!CAUTION]
> **Human Review Gates**:
> 1.  **Database & Schema Changes**: Any SQL scripts, migrations, or database connection structure updates.
> 2.  **API Routing & Request Handlers**: Creating or modifying Next.js API endpoints (`app/api/**`).
> 3.  **Environment Variables**: Editing `.env.example`, adding keys, or modifying runtime configurations.
> 4.  **AI Provider Calibrations**: Swapping models, changing system instructions, or altering provider client setups.
> 5.  **Result Ownership & Cookies**: Security code regulating `/result/[id]` cookie validation or owner mapping.
> 6.  **Opt-in Sharing Logic**: The encryption, token generation, or visibility logic of `/share/[token]`.
> 7.  **Retention & Cleanup Crons**: Database purging intervals, cron scheduling, or deletion sequences.
> 8.  **Sensitive Data Detection Filters**: Regex sets, entropy thresholds, and logic that blocks prompts containing secrets.
