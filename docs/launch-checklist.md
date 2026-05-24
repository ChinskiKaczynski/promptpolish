# Launch Readiness Checklist — PromptPolish

This checklist establishes the final quality gates required before the PromptPolish MVP is officially deployed to production on Vercel. All boxes must be checked and verified by tests or manual walkthroughs.

---

## 1. Visual & Layout Quality Gates
*   - [ ] **Aesthetics Wow Factor**: Harmonic, premium color palettes (e.g., tailored dark-mode HSL gradients) are integrated. Browser defaults are overridden with modern typography (e.g., Google Fonts Outfit/Inter).
*   - [ ] **Fully Responsive**: Verified layouts across standard desktop, tablet, and mobile screens.
*   - [ ] **Localization Toggle**: Quick translation toggle between Polish (PL) and English (EN) functions seamlessly across all pages.
*   - [ ] **Footer Documentation**: Links to Privacy and Terms of Service drafts are fully functional.

---

## 2. Functional & Pipeline Calibration
*   - [ ] **Form Submission**: Paste form properly binds input prompt, target language, and target model profile.
*   - [ ] **Zod Schema Sanitization**: Input validation strictly enforces the 4,000-character prompt ceiling.
*   - [ ] **AI SDK Structured Engine**: Prompts successfully invoke `@openrouter/ai-sdk-provider` using `Output.object` with full Zod types.
*   - [ ] **Backend Weighted Formula**: The final audit score is calculated mathematically by the server, not solely relying on LLM estimations.
*   - [ ] **Private Results (/result/[id])**: Page successfully displays criteria tables, weaknesses, explanations, and copy-ready cards.
*   - [ ] **Opt-In Shared Results (/share/[token])**: Sharing is off by default. Generating a link activates opt-in, rendering the result accessible via high-entropy token. Disabling sharing instantly revokes public access (returns 404).

---

## 3. Performance & Compilation Gates
*   - [ ] **Turbopack Build Pass**: Production compilation (`pnpm build`) completes successfully in under 10 seconds.
*   - [ ] **Zero Linter Warnings**: Linter (`pnpm lint`) passes with `--max-warnings=0`.
*   - [ ] **Fast Response Latency**: OpenRouter AI audits complete and load the result screen in under 2.5 seconds.
*   - [ ] **Optimized Static Bundles**: Landing, privacy, and terms pages are fully pre-rendered statically.

---

## 4. Security & Safety Gates
*   - [ ] **Zero API Keys in Client Bundles**: Checked compile output to confirm `OPENROUTER_API_KEY` and `SUPABASE_SECRET_KEY` are not in bundles.
*   - [ ] **No NEXT_PUBLIC Secrets**: Enforced that no administrative credentials contain the `NEXT_PUBLIC_` prefix.
*   - [ ] **Sensitive Data Block**: Mock credentials (API keys, Pem blocks, passwords) are caught at backend preflights. The prompt is dropped from memory, never saved to disk, and the pipeline halts with a 400.
*   - [ ] **Cookie Access Validation**: `/result/[id]` correctly verifies that the user's `owner_anonymous_id` cookie matches the DB record, returning `403 Forbidden` for non-owners.
*   - [ ] **Hashed IP Rate Limiting**: daily quota limit (5 analyses per day) successfully limits IP hashes and cookie tokens. IP addresses are salted and hashed on ingestion.
*   - [ ] **Error Normalization**: API errors (from Supabase or OpenRouter) are caught, logged internally, and served as user-friendly messages.

---

## 5. Deployment & Telemetry Verification
*   - [ ] **Vitest Unit Test Pass**: All 8 local unit tests pass cleanly.
*   - [ ] **Telemetry Track**: Copy events and upvote/downvote clicks successfully write database event entries.
*   - [ ] **Vercel Preview Build**: Environment variables are mapped correctly in the Vercel dashboard. Preview links build without compilation warnings.
