# Launch Readiness Checklist — PromptPolish

This checklist establishes the final quality gates required before PromptPolish is officially deployed to production.

---

## 1. Visual & Layout Quality Gates
- [ ] **Aesthetics Wow Factor**: Harmonic, premium color palettes (e.g., tailored dark-mode HSL gradients) are integrated. Browser defaults are overridden with modern typography.
- [ ] **Fully Responsive**: Verified layouts across standard desktop, tablet, and mobile screens.
- [ ] **Localization Toggle**: Quick translation toggle between Polish (PL) and English (EN) functions seamlessly across all pages.
- [ ] **Footer Documentation**: Links to Privacy and Terms of Service drafts are fully functional.

---

## 2. Functional & Pipeline Calibration
- [ ] **Form Submission**: Paste form properly binds input prompt, target language, and target model profile.
- [ ] **Zod Schema Sanitization**: Input validation strictly enforces character ceilings (12,000 or 24,000 based on plan).
- [ ] **AI SDK Structured Engine**: Prompts successfully invoke Gemini using `generateObject` with Zod types.
- [ ] **Backend Weighted Formula**: The final audit score is calculated mathematically by the server, not solely relying on LLM estimations.
- [ ] **Private Results (/result/[id])**: Page successfully displays criteria tables, weaknesses, explanations, and copy-ready cards.
- [ ] **Opt-In Shared Results (/share/[token])**: Sharing is off by default. Generating a link activates opt-in, rendering the result accessible via high-entropy token. Disabling sharing instantly revokes public access (returns 404).

---

## 3. Performance & Compilation Gates
- [ ] **Turbopack Build Pass**: Production compilation (`pnpm build`) completes successfully.
- [ ] **Zero Linter Warnings**: Linter (`pnpm lint`) passes with `--max-warnings=0`.
- [ ] **Fast Response Latency**: AI audits complete and load the result screen efficiently.
- [ ] **Optimized Static Bundles**: Landing, privacy, and terms pages are pre-rendered statically.

---

## 4. Security & Safety Gates
- [ ] **Zero API Keys in Client Bundles**: Checked compile output to confirm `GOOGLE_GENERATIVE_AI_API_KEY` and `SUPABASE_SECRET_KEY` are not in bundles.
- [ ] **No NEXT_PUBLIC Secrets**: Enforced that no administrative credentials contain the `NEXT_PUBLIC_` prefix.
- [ ] **Sensitive Data Block**: Mock credentials (API keys, Pem blocks, passwords) are caught at backend preflights. The prompt is dropped from memory, never saved to disk, and the pipeline halts with a 422.
- [ ] **Cookie Access Validation**: `/result/[id]` correctly verifies that the user's cookie matches the DB record, returning `404` or redirecting for non-owners.
- [ ] **Hashed IP Rate Limiting**: Daily quota limits successfully restrict IP hashes and cookie tokens. IP addresses are salted and hashed on ingestion.
- [ ] **Error Normalization**: API errors (from Supabase or Gemini) are caught, logged internally, and served as user-friendly messages.

---

## 5. Deployment & Telemetry Verification
- [ ] **Vitest Unit Test Pass**: All local unit tests pass cleanly.
- [ ] **Telemetry Track**: Copy events and upvote/downvote clicks successfully write database event entries.
- [ ] **Vercel Preview Build**: Environment variables are mapped correctly in the Vercel dashboard. Preview links build without compilation warnings.
