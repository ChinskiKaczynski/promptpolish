# Antigravity Project Rules — PromptPolish

These rules are strict, actionable guardrails that govern all code generation, planning, and validation steps in the PromptPolish repository. You must review and adhere to these guidelines during every pair programming turn.

---

## 1. Plan Verification Gate (Plan-First Rule)

*   **Propose a Plan**: You must write and present an `implementation_plan.md` before adding or modifying any codebase files.
*   **Approval Required**: If the plan changes database schemas, API routes, environment variables, AI provider calibrations, access controls, or rate limit rules, you must **stop and wait** for the user's explicit approval.

---

## 2. Dynamic Documentation Integration (Context7 Rule)

To prevent code degradation, deprecated API calls, or configuration errors:
*   You **MUST** query the **Context7 MCP** whenever writing or editing code that integrates with:
    *   **Next.js App Router** (routes, route handlers, server actions)
    *   **Vercel AI SDK** & **@ai-sdk/google** (structured output, generation parameters)
    *   **Supabase** (client syntax, RLS configurations)
    *   **Zod** (validation rules)
*   Do not rely on training cutoff memory for these fast-evolving libraries. Context7 outputs take absolute precedence.

---

## 3. Strict Coding Conventions

*   **Small, Readable Diffs**: Make the smallest possible modification that accomplishes the task. Avoid large refactors or modifying unrelated files.
*   **Strict TypeScript Enforcements**:
    *   `any` types are strictly prohibited.
    *   Enforce exact interfaces and typing for external API responses.
    *   Handle nullable database rows with safe optional chaining.
*   **Explicit Calculations**: The backend owns final prompt scoring calculations and credential scans. Never delegate scoring formulas or credentials evaluation to client bundles or purely to unchecked LLM outputs.
*   **Verification Verification**: After making a change, always execute `pnpm lint`, `pnpm build`, and `pnpm test` where applicable. Never declare a task complete unless these commands pass with zero errors.

---

## 4. Absolute Security Constraints

*   **Zero Leakage**: Server secrets (`GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`) must never be placed in client components or prefixed with `NEXT_PUBLIC_`.
*   **Zero Raw Logging**: Never write raw sensitive prompts, passwords, or mock API keys into database log fields.
*   **RLS is King**: Enforce that client components cannot fetch data directly from databases. All database select operations are routed through Next.js server layers that strictly validate anonymous session ownership.
*   **Private by Default**: Sharing results publicly `/share/[token]` is disabled by default. It can only be enabled by explicit user opt-in.
