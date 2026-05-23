# Human-in-the-Loop Review Policy — PromptPolish

PromptPolish enforces a strict code review policy. AI agents and developers must obtain explicit manual approval before executing changes in high-risk categories. This policy acts as our primary defense against data leaks, cost explosions, and plan drift.

---

## 1. High-Risk Operational Categories

You **must** stop, present an implementation plan, and wait for human confirmation before writing code or running terminal scripts in any of the following zones:

| Risk Category | High-Risk Operations | Rationale |
| :--- | :--- | :--- |
| **Database & Schema** | Postgres migrations, SQL schemas, modifying table attributes. | Prevents data loss, deployment locks, and synchronization failures. |
| **API Handlers** | Creating/modifying handlers under `app/api/**`. | Protects endpoint security, validates request boundaries, and prevents leaks. |
| **Environment Variables**| Adding keys, editing `.env.example`, altering runtime configurations. | Prevents secret leaks, credential collisions, and build failures. |
| **AI Providers** | Swapping model IDs, changing system prompts, editing temperature. | Guards against scoring drift, hallucinated outcomes, and cost increases. |
| **Session & Cookies** | Modifying `owner_anonymous_id` cookie setting or verification logic. | Secures private `/result/[id]` links and prevents unauthorized access. |
| **Opt-in Sharing** | Changing token generation entropy, altering token routing visibility. | Ensures shared links remain random and private results aren't exposed. |
| **Data Retention** | Purging queries, data lifespans, cron purge loops. | Ensures compliance with privacy bounds and prevents accidental deletions. |
| **Safety Preflights** | Editing credential detection regex, changing blocking thresholds. | Guarantees secrets are properly caught and never saved. |

---

## 2. Plan Review Artifacts Checklist

When proposing a plan for a high-risk operation, the implementation plan **must** include:

1.  **Context & Rationale**: Why the change is required and what design choices were made.
2.  **Access Control Assessment**: A review of RLS rules and server-side checks affected by the change.
3.  **Provider Compliance Check**: A verification that any changed API calls match the latest official guidelines fetched via Context7.
4.  **Verification Plan**: Exact testing commands (`pnpm lint`, `pnpm build`, `pnpm test`) that will be executed to guarantee correctness.

---

## 3. Strict Non-Planning Exceptions (Simple Tweaks)

You do **not** need to create a plan or halt execution for trivially simple, low-risk operations:
*   Formatting raw texts, updating landing page copy, or tweaking layout styling (CSS/Tailwind).
*   Correcting type annotations or minor syntax issues identified by linter errors.
*   Adding comments or documenting code logic.
*   Fixing minor visual alignment bugs.
