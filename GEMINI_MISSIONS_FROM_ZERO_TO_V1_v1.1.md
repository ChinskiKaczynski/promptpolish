# GEMINI_MISSIONS_FROM_ZERO_TO_V1.md

**Projekt:** PromptPolish  
**Cel dokumentu:** gotowe prompty do wklejania w Gemini / Google Antigravity od pustego repo do wersji 1.0  
**Tryb pracy:** małe misje → plan → implementacja → walidacja → review → commit/checkpoint  
**Zasada nadrzędna:** najpierw MVP anonymous-first, z poprawkami krytycznymi v1.2, potem dopiero paid SaaS po walidacji danych

---

## 0. Jak używać tego dokumentu

Wklejaj do Gemini / Antigravity **jedną misję naraz**.

Nie używaj promptu:

```text
Build the whole app.
```

Każda misja ma wymusić:

```text
- mały zakres,
- plan przed kodem,
- brak scope creepu,
- walidację lint/test/build,
- listę zmienionych plików,
- checkpoint Git po review.
```

### Zasady dla Ciebie jako operatora

Po każdej misji:

```text
1. Przeczytaj plan Gemini.
2. Zatwierdź albo skoryguj zakres.
3. Pozwól zaimplementować tylko tę jedną misję.
4. Wymagaj wyników walidacji.
5. Sprawdź diff.
6. Dopiero potem commit/checkpoint.
7. Przejdź do następnej misji.
```

### Czego nie wolno robić bez osobnej zgody

```text
- deploy production,
- podmiana env vars na produkcji,
- zmiana modelu AI/providerów,
- migracje DB na produkcji,
- usuwanie danych,
- dodanie Stripe,
- zmiana pricingu,
- publiczny launch,
- refaktor poza zakresem misji.
```

---

## 1. Kamienie milowe wersji

| Wersja | Znaczenie | Cel |
|---|---|---|
| `v0.0` | Repo + dokumenty | Projekt kontrolowany przez reguły |
| `v0.1` | UI mock | Działa flow bez AI/DB |
| `v0.2` | Core deterministic | Scoring + sensitive-data detector |
| `v0.3` | DB + AI foundation | Supabase + schema + Gemini smoke |
| `v0.4` | MVP feature-complete | Realne analyze/result/share/feedback + mandatory share disable + retention cleanup |
| `v0.5` | Production-ready MVP | Testy, privacy, eval, bundle audit, full-schema Gemini smoke, Vercel preview |
| `v0.6` | Public/private beta | Metryki i walidacja wartości |
| `v0.7` | Accounts + history | Auth bez billing |
| `v0.8` | Pro value layer | Entitlements + exports + pricing copy |
| `v0.9` | Billing beta | Stripe + legal + ops |
| `v1.0` | Paid SaaS launch | Płatny Pro działa kontrolowanie |

---

# PHASE A — v0.0: repo, dokumenty, zasady

## Mission 00 — Environment smoke test

### Cel

Sprawdzić lokalne środowisko przed pracą w repo.

### Prompt do Gemini / Antigravity

```text
Act as a senior full-stack engineer preparing a local development environment.

Task:
Run a minimal environment smoke test for this project.

Check:
- node version
- pnpm version
- git version
- whether pnpm can run
- whether a Next.js app can build in this environment

Rules:
- Do not modify project files unless a temporary smoke-test folder is needed.
- Do not install global tools without asking.
- Do not create application code.
- If something fails, explain the exact failure and the smallest fix.

Validation commands:
- node -v
- pnpm -v
- git --version
- pnpm create next-app@latest agy-smoke --yes
- cd agy-smoke
- pnpm build

Output:
- environment status
- detected versions
- blocking issues
- recommended setup variant: native Windows, WSL, macOS or Linux
```

### Akceptacja

```text
[ ] Wiadomo, że Node/pnpm/git działają.
[ ] Wiadomo, czy Antigravity działa na właściwym folderze.
[ ] Nie powstał właściwy kod aplikacji.
```

---

## Mission 01 — Create clean Next.js project

### Cel

Utworzyć czysty projekt Next.js.

### Prompt do Gemini / Antigravity

```text
Act as a senior Next.js engineer.

Task:
Create the initial Next.js project for PromptPolish.

Stack:
- Next.js App Router
- TypeScript
- Tailwind CSS
- pnpm
- no auth
- no billing
- no AI integration yet
- no Supabase integration yet

Rules:
- Keep the project minimal.
- Do not add features outside the initial scaffold.
- Do not add Stripe.
- Do not add login.
- Do not add dashboard.
- Do not add model claims.
- Do not add secrets.
- Do not commit automatically unless I approve.

Validation:
- pnpm lint if available
- pnpm build
- pnpm dev smoke if practical

Output:
- changed files summary
- validation results
- next recommended mission
```

### Akceptacja

```text
[ ] `pnpm build` przechodzi.
[ ] Repo ma czysty szkielet.
[ ] Brak sekretów i zbędnych funkcji.
```

---

## Mission 02 — Add project control docs

### Cel

Dodać dokumenty sterujące, które ograniczą scope creep.

### Prompt do Gemini / Antigravity

```text
Read the existing source plan and paid SaaS roadmap if they exist in the repository.

Act as a senior product-minded full-stack engineer.

Task:
Create the initial project documentation and agent control files only.

Files:
- AGENTS.md
- docs/product-mvp.md
- docs/architecture.md
- docs/model-profile-policy.md
- docs/ai-safety.md
- docs/retention-policy.md
- docs/antigravity-workflow.md
- docs/decision-log.md
- docs/evaluation-fixtures.md
- docs/gemini-integration-decision.md
- docs/supabase-access-policy.md
- docs/launch-checklist.md
- .antigravity/rules/project-rules.md
- .antigravity/rules/review-policy.md
- .antigravity/rules/mvp-scope.md

Rules:
- Do not write application code.
- Keep MVP anonymous-first.
- Default profiles: general-llm and google-gemini-3-5-flash only.
- No auth, billing, pricing page, prompt library, marketplace or multi-model execution in MVP.
- Keep opt-in public /share/[token] in MVP.
- Include privacy, retention, result access, share access, rate limiting, sensitive-data detection and model hallucination controls.
- Include AI SDK structured output rule using generateText/streamText with Output.object unless docs prove a newer pattern is required.
- Include Gemini changelog check before provider implementation.
- Mark paid SaaS features as post-MVP only.

Validation:
- Return changed files summary.
- Return open decisions.
- Do not run unnecessary installs.
```

### Akceptacja

```text
[ ] Dokumenty istnieją.
[ ] Zakres MVP nie zawiera auth/billing/pricing.
[ ] Paid SaaS jest jasno oznaczony jako etap po walidacji.
```

---

## Mission 03 — Review docs before code

### Cel

Wymusić review planu zanim Gemini zacznie kodować.

### Prompt do Gemini / Antigravity

```text
Read:
- AGENTS.md
- docs/product-mvp.md
- docs/architecture.md
- docs/model-profile-policy.md
- docs/ai-safety.md
- docs/gemini-integration-decision.md
- docs/supabase-access-policy.md
- docs/retention-policy.md
- .antigravity/rules/project-rules.md
- .antigravity/rules/review-policy.md

Act as a senior full-stack engineer building a small production MVP.

Task:
Review the current project plan before implementation.

Rules:
- Do not write code.
- Do not modify files.
- Identify missing decisions.
- Identify outdated technical assumptions.
- Identify security and privacy risks.
- Identify scope creep.
- Return a numbered implementation sequence.

Acceptance criteria:
- No features outside MVP.
- Each step has a clear output.
- Each step has validation commands.
- Each risky change requires human review.
- AI SDK integration must use current structured output pattern unless explicitly pinned otherwise.
- Gemini API changelog must be checked before provider implementation.
- Private Supabase reads must be server-only.
- Sensitive-data detection must be included before sending prompts to provider.
- Treat POST /api/share/disable, retention cleanup, full-schema Gemini smoke test and bundle secret exposure audit as required additions before public beta.
```

### Akceptacja

```text
[ ] Gemini nie zmienił plików.
[ ] Masz listę ryzyk i kolejność implementacji.
[ ] Zakres jest nadal mały.
```

---

# PHASE B — v0.1: UI mock bez AI i DB

## Mission 04 — Landing page and basic layout

### Cel

Zbudować landing bez AI/DB.

### Prompt do Gemini / Antigravity

```text
Act as a senior frontend engineer.

Task:
Implement the first landing page slice for PromptPolish.

Scope:
- route /
- responsive layout
- hero section
- CTA to /analyze
- 3 benefits: score, diagnosis, improved prompt
- target users section
- simple explanation of flow
- privacy warning: do not paste secrets or sensitive data
- footer links to /privacy and /terms placeholders

Rules:
- No real API calls.
- No Supabase.
- No Gemini.
- No auth.
- No billing.
- No pricing page.
- No fake statistics.
- No unsupported model claims.
- Keep copy concise and practical.
- Keep UI minimal and readable.

Validation:
- pnpm lint
- pnpm build
- browser walkthrough for desktop and mobile width

Output:
- changed files summary
- screenshots or textual walkthrough
- validation results
```

### Akceptacja

```text
[ ] `/` działa.
[ ] Jest CTA do `/analyze`.
[ ] Brak fałszywych claimów.
```

---

## Mission 05 — Analyze page UI mock

### Cel

Zbudować formularz analizy promptu bez API.

### Prompt do Gemini / Antigravity

```text
Act as a senior frontend engineer.

Task:
Implement /analyze as a UI-only mock.

Fields:
- input_prompt: required textarea
- working_language: pl | en
- selected_profile_slug: general-llm | google-gemini-3-5-flash
- task_goal: optional
- task_type: optional
- expected_output_format: optional
- constraints: optional

Requirements:
- disabled submit if prompt is shorter than configured minimum
- character counter
- warning when prompt is long
- privacy warning
- local sensitive-data warning placeholder
- daily limit information placeholder
- submit navigates to /result/mock or shows mocked loading state
- responsive layout

Rules:
- No real API call.
- No Supabase write.
- No Gemini call.
- No auth.
- No billing.
- No pricing page.
- Do not add extra model profiles.
- Do not store prompt in localStorage unless explicitly justified.

Validation:
- pnpm lint
- pnpm build
- browser walkthrough
```

### Akceptacja

```text
[ ] `/analyze` działa.
[ ] Submit jest zablokowany dla zbyt krótkiego promptu.
[ ] Są tylko dwa profile.
```

---

## Mission 06 — Result page UI mock

### Cel

Zbudować widok wyniku na danych mock.

### Prompt do Gemini / Antigravity

```text
Act as a senior frontend engineer.

Task:
Implement mocked result UI.

Routes:
- /result/mock

Requirements:
- overall score 0-100
- score level
- summary
- top weaknesses
- criteria breakdown
- improvement plan
- improved prompt block
- change explanations
- model fit notes
- uncertainty warnings
- safety notes
- copy button UI
- feedback placeholder
- create share link placeholder
- profile warning area

Rules:
- Use mocked data only.
- No database.
- No AI call.
- No share API yet.
- No feedback API yet.
- No billing.
- No auth.
- No public sharing by default.
- Keep UI readable on mobile.

Validation:
- pnpm lint
- pnpm build
- browser walkthrough
```

### Akceptacja

```text
[ ] `/result/mock` działa.
[ ] UI pokazuje cały zakres wyniku MVP.
[ ] Brak prawdziwego share/API.
```

---

## Mission 07 — Privacy and terms drafts

### Cel

Dodać minimalne strony zaufania.

### Prompt do Gemini / Antigravity

```text
Act as a product engineer writing minimal legal-style product drafts.

Task:
Add /privacy and /terms draft pages for the MVP.

Requirements:
- Mark both pages as drafts.
- Explain that users should not paste passwords, API keys, client data or sensitive data.
- Explain prompts may be processed by the selected AI provider to generate analysis.
- Explain anonymous usage limits and basic event logging.
- Explain public share links are opt-in only.
- Explain deletion/retention as described in docs/retention-policy.md.
- Do not make unsupported GDPR/compliance claims.
- Do not mention paid plans as live.
- Add or update a docs/legal-readiness.md draft covering GDPR/cookies/vendor processing questions for review before public EU traffic.

Rules:
- This is not legal advice.
- Keep language clear.
- Do not add cookie banner.
- Do not add auth or billing.

Validation:
- pnpm build
- links from footer work
```

### Akceptacja

```text
[ ] `/privacy` działa.
[ ] `/terms` działa.
[ ] Treść nie robi niepotwierdzonych claimów prawnych.
```

---

# PHASE C — v0.2: scoring i sensitive-data detector

## Mission 08 — Deterministic scoring

### Cel

Dodać backendowy scoring niezależny od AI.

### Prompt do Gemini / Antigravity

```text
Act as a senior TypeScript engineer.

Task:
Implement deterministic backend scoring utilities.

Files:
- lib/scoring/scoring-config.ts
- lib/scoring/calculate-score.ts
- lib/scoring/score-level.ts
- tests/scoring/calculate-score.test.ts

Criteria weights:
- goal_clarity: 15
- context_completeness: 12
- structure: 10
- constraints: 10
- output_format: 12
- model_profile_fit: 10
- resistance_to_misinterpretation: 10
- cost_efficiency: 6
- safety: 8
- testability: 7

Requirements:
- weights must sum to 100
- raw criterion scores are 0-10
- clamp invalid raw scores to 0-10
- final score is 0-100
- return score level:
  - 0-39 weak
  - 40-59 needs_work
  - 60-74 decent
  - 75-89 strong
  - 90-100 excellent
- include scoring_version
- do not let AI provide final overall_score directly

Rules:
- No AI integration.
- No database changes.
- No UI changes unless needed for type usage.
- Keep code small and typed.

Validation:
- tests for low, medium, high quality cases
- test weights sum to 100
- test clamping
- test missing criterion behavior
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Finalny score liczy backend.
[ ] Testy obejmują skrajne przypadki.
```

---

## Mission 09 — Sensitive-data detector

### Cel

Dodać detekcję sekretów przed AI.

### Prompt do Gemini / Antigravity

```text
Act as a senior security-minded TypeScript engineer.

Task:
Implement local/server-compatible sensitive-data detection utilities.

Files:
- lib/privacy/sensitive-data-rules.ts
- lib/privacy/sensitive-data-detector.ts
- tests/privacy/sensitive-data-detector.test.ts

Requirements:
- Detect common API keys, .env secrets, JWT-like strings, Bearer tokens, private key blocks and password assignments.
- Return risk level: none | low | medium | high.
- Return redacted findings only.
- Never return full secret values.
- Provide finding type, risk, short message and redacted preview.
- High-risk secrets must be blockable by config later.
- Avoid obvious false positives.

High-risk examples:
- GOOGLE_GENERATIVE_AI_API_KEY=...
- SUPABASE_SECRET_KEY=...
- AWS_SECRET_ACCESS_KEY=...
- Bearer tokens
- private key blocks
- JWT-like tokens
- password=...

Rules:
- No AI call.
- No DB write.
- Do not log secrets.
- Do not store raw secret findings.
- Keep implementation deterministic.

Validation:
- detects high-risk examples
- does not leak full secret value in findings
- avoids obvious false positives
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Sekrety są redagowane.
[ ] High-risk można zablokować.
```

---

## Mission 10 — Wire local sensitive warning into UI

### Cel

Podpiąć detektor do formularza po stronie UI jako preflight.

### Prompt do Gemini / Antigravity

```text
Act as a senior frontend engineer with security awareness.

Task:
Use the sensitive-data detector in /analyze for local preflight warnings.

Requirements:
- Run detection on prompt textarea changes or before submit.
- Show warning if potential sensitive data is found.
- Show finding types, not full secret values.
- For high-risk findings, block mocked submit and tell user to remove the secret.
- Keep the warning clear and non-alarming.
- Do not send anything to an API in this mission.

Rules:
- Do not log prompt content.
- Do not show full secret values.
- Do not store findings in localStorage.
- No AI call.
- No DB write.

Validation:
- high-risk sample blocks submit
- normal prompt does not block
- pnpm test if relevant
- pnpm build
- browser walkthrough
```

### Akceptacja

```text
[ ] UI ostrzega przed sekretami.
[ ] High-risk nie przechodzi dalej nawet w mocku.
```

---

# PHASE D — v0.3: Supabase, AI schema, Gemini smoke

## Mission 11 — Supabase migration and seed

### Cel

Dodać schemat DB dla MVP.

### Prompt do Gemini / Antigravity

```text
Act as a senior backend engineer using Supabase Postgres.

Task:
Create Supabase migrations and seed data for the anonymous MVP.

Tables:
- model_profiles
- prompt_analyses
- usage_events
- feedback_events

Requirements:
- Use UUID primary keys.
- Add created_at.
- Add analysis_schema_version, scoring_version, model_profile_version and prompt_template_version.
- Add owner_anonymous_id.
- Add sensitive_data_risk_level and redacted sensitive_data_findings_json.
- Add share_token nullable.
- Add is_share_enabled boolean default false.
- Add expires_at nullable.
- Add indexes for owner_anonymous_id, selected_profile_slug, share_token, sensitive_data_risk_level and created_at.
- Seed only:
  - general-llm
  - google-gemini-3-5-flash
- Do not include unverified prices, benchmarks, context windows, rate limits or model capability claims.
- Include verification_status, confidence_level, source_url, source_checked_at where applicable.
- If source is not verified, mark it unverified/stale.

Security:
- No public write access to private tables.
- Private result reads must go through server route or server component.
- Secret/service keys must never be exposed to client code.

Rules:
- Do not apply migration to production.
- Do not add auth.
- Do not add billing.
- Do not add users/team/workspace tables.
- Return SQL clearly.

Validation:
- migration applies cleanly locally or in Supabase branch
- seed is idempotent
- changed files summary
```

### Akceptacja

```text
[ ] Tabele są zgodne z MVP.
[ ] Seed zawiera tylko 2 profile.
[ ] Brak cen/benchmarków bez źródła.
```

---

## Mission 12 — Server-only Supabase data access layer

### Cel

Dodać typed queries bez client-side czytania prywatnych analiz.

### Prompt do Gemini / Antigravity

```text
Act as a senior backend TypeScript engineer.

Task:
Implement the Supabase data access layer for the MVP.

Files:
- lib/supabase/client.ts
- lib/supabase/server.ts
- lib/supabase/admin.ts
- lib/supabase/queries.ts
- lib/supabase/types.ts

Functions:
- getModelProfileBySlug
- createPromptAnalysis
- getPromptAnalysisForOwner
- getSharedPromptAnalysis
- createUsageEvent
- createFeedbackEvent
- createCopyEvent
- createShareLink
- disableShareLink

Rules:
- Server-only where needed.
- No secrets in client components.
- No direct client reads for private prompt_analyses.
- Do not trust owner_anonymous_id from client body.
- Keep functions small and typed.
- Do not add auth.
- Do not add billing.
- Do not expose SUPABASE_SECRET_KEY client-side.

Validation:
- unit tests or mocked integration tests where practical
- pnpm build
- summarize server-only boundaries
```

### Akceptacja

```text
[ ] Prywatne wyniki idą przez server-only access.
[ ] Klient nie używa secret key.
```

---

## Mission 13 — Anonymous identity cookie

### Cel

Dodać anonimowe owner ID rozwiązywane server-side.

### Prompt do Gemini / Antigravity

```text
Act as a senior Next.js backend engineer.

Task:
Implement anonymous owner identity for the MVP.

Requirements:
- owner_anonymous_id is resolved server-side from a secure cookie.
- If cookie is missing, create a new random ID.
- Do not accept anonymous_id from request body as trusted.
- Use this identity for private result access, usage limits and events.
- Cookie settings should be appropriate for local/dev and production.
- Do not store personal data unnecessarily.

Rules:
- No auth.
- No billing.
- No localStorage identity as source of truth.
- Do not expose sensitive cookie signing secrets to client.
- If signing/encryption is used, validate env safely.

Validation:
- missing cookie creates anonymous owner
- existing cookie is reused
- request body anonymous_id is ignored
- pnpm test if practical
- pnpm build
```

### Akceptacja

```text
[ ] `owner_anonymous_id` pochodzi z cookie.
[ ] Body requestu nie jest źródłem prawdy.
```

---

## Mission 14 — AI analysis Zod schema

### Cel

Dodać typowany schemat wyniku AI.

### Prompt do Gemini / Antigravity

```text
Act as a senior TypeScript engineer designing structured AI output.

Task:
Implement the AI analysis schema.

Files:
- lib/ai/schemas.ts
- lib/ai/semantic-validation.ts
- tests/ai/analysis-schema.test.ts

Schema must include:
- overall_summary
- detected_task_type
- criteria_scores[]
  - criterion
  - raw_score_0_10
  - rationale
  - improvement_suggestion
- top_weaknesses[]
- improvement_plan[]
- improved_prompt
- change_explanations[]
- model_fit_notes[]
- uncertainty_warnings[]
- safety_notes[]

Requirements:
- Use Zod.
- Include all scoring criteria exactly.
- Make schema strict enough for production use.
- Keep it compatible with Gemini structured output limitations.
- Add analysis_schema_version.
- Do not include final overall_score from AI as source of truth.
- Add semantic validation that rejects missing criteria and invalid empty improved_prompt.

Rules:
- No Gemini call yet.
- No DB write.
- No UI changes.

Validation:
- valid fixture passes
- invalid fixture fails
- missing criterion fails
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Schemat wymusza kryteria scoringu.
[ ] AI nie dostaje kontroli nad finalnym score.
```

---

## Mission 15 — Gemini docs check and structured output smoke test

### Cel

Zweryfikować aktualną integrację Gemini przed kodem produkcyjnym.

### Prompt do Gemini / Antigravity

```text
Act as a senior AI integration engineer.

Task:
Before implementing the full Gemini client, verify current Gemini and AI SDK documentation and run a minimal structured output smoke test.

Requirements:
- Check current Gemini model docs.
- Check Gemini API changelog.
- Check structured output docs.
- Check current AI SDK structured output pattern.
- Confirm whether using generateContent-compatible flow through @ai-sdk/google is still correct.
- Do not use Gemini Interactions API unless explicitly decided and documented.
- Record the decision in docs/gemini-integration-decision.md and docs/decision-log.md.
- Run a minimal structured output smoke test if GOOGLE_GENERATIVE_AI_API_KEY is available.
- Document that full production-like analysisSchema smoke test is required later in Mission 26A.
- If the key is missing, create a documented manual smoke-test script but do not fake success.

Rules:
- Do not implement full /api/analyze.
- Do not add app feature code beyond smoke test.
- Do not commit API keys.
- Do not log API keys.
- Do not invent model capabilities, prices, limits, benchmarks or context windows.

Validation:
- minimal structured output returns valid object, or missing-key status is clearly documented
- invalid output path is handled where practical
- decision doc updated
- pnpm build
```

### Akceptacja

```text
[ ] Decyzja Gemini jest zapisana.
[ ] Smoke test jest wykonany albo jawnie oznaczony jako niewykonany z powodu braku klucza.
```

---

## Mission 16 — Gemini client

### Cel

Dodać klienta AI do analizy promptów.

### Prompt do Gemini / Antigravity

```text
Act as a senior AI integration engineer.

Task:
Implement the Gemini analysis client.

Files:
- lib/ai/gemini-client.ts
- lib/ai/analyze-prompt.ts
- lib/ai/prompts.ts
- lib/ai/model-profiles.ts
- lib/ai/provider-errors.ts
- tests/ai/gemini-client.test.ts

Requirements:
- Use @ai-sdk/google and the current AI SDK structured output pattern confirmed in docs.
- Prefer generateText with output: Output.object({ schema }) if still current.
- Use the Zod analysis schema.
- Model id must come from env with a safe development fallback.
- API key must be server-only.
- Use GOOGLE_GENERATIVE_AI_API_KEY.
- Normalize provider errors.
- Support mocked responses for tests.
- Use only model profile data passed into the analysis instruction.
- Do not invent model capabilities, pricing, limits or benchmark claims.
- Include anti-hallucination instructions in the system/user prompt.
- Preserve user intent.
- Do not make improved prompt unnecessarily long.
- Do not repeat detected secret values.

Rules:
- No API route yet unless needed for tests.
- No Supabase write in this mission.
- No streaming unless explicitly justified.
- One AI request per analysis.

Validation:
- unit test with mocked response
- invalid AI output is rejected
- provider error is normalized
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Klient AI działa przez server-only path.
[ ] Testy mockują providera.
[ ] Błędy providera są normalizowane.
```

---

# PHASE E — v0.4: realne API i MVP feature-complete

## Mission 17 — /api/analyze

### Cel

Dodać główny flow analizy.

### Prompt do Gemini / Antigravity

```text
Act as a senior Next.js backend engineer.

Task:
Implement POST /api/analyze for the anonymous MVP.

Request:
- input_prompt: string
- working_language: pl | en
- selected_profile_slug: general-llm | google-gemini-3-5-flash
- task_goal?: string
- task_type?: string
- expected_output_format?: string
- constraints?: string

Backend flow:
1. Validate request with Zod.
2. Resolve owner_anonymous_id server-side from cookie.
3. Run sensitive-data detection server-side.
4. If high-risk secret is detected, block and do not save raw prompt.
5. Check anonymous usage limit.
6. Load selected model profile.
7. Validate prompt min/max length.
8. Build analysis instruction.
9. Call Gemini with structured output.
10. Validate AI response with Zod.
11. Run semantic validation.
12. Calculate weighted score in backend.
13. Save prompt_analyses.
14. Save usage_event.
15. Return result id and payload.

Error states:
- 400 invalid input
- 413 prompt too long
- 422 high-risk sensitive data detected
- 429 limit reached
- 404 model profile unavailable
- 502 provider error
- 503 provider unavailable
- 500 internal error

Rules:
- Do not trust anonymous_id from body.
- Do not expose keys.
- Do not implement auth or billing.
- Do not add model families outside MVP.
- Do not save high-risk raw prompt if blocked.
- Do not log full prompt if it contains sensitive data.
- Keep error responses safe and readable.

Validation:
- invalid input returns 400
- high-risk sensitive data returns 422
- prompt too long returns 413
- unknown model profile returns 404
- limit reached returns 429
- provider failure returns 502/503
- successful request returns analysis id, score breakdown, improved prompt and explanations
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] `/api/analyze` działa na mockach/testach.
[ ] High-risk nie jest wysyłany do Gemini.
[ ] Wynik zapisuje się w Supabase.
```

---

## Mission 18 — Connect /analyze UI to real API

### Cel

Podpiąć formularz do prawdziwego `/api/analyze`.

### Prompt do Gemini / Antigravity

```text
Act as a senior frontend engineer.

Task:
Connect /analyze UI to POST /api/analyze.

Requirements:
- Submit form to /api/analyze.
- Show loading state.
- Show readable error states:
  - invalid input
  - prompt too long
  - high-risk sensitive data
  - limit reached
  - provider error
  - internal error
- On success, navigate to /result/[id].
- Preserve local sensitive-data preflight.
- Do not send high-risk prompt if local preflight blocks it.
- Keep mobile layout clean.

Rules:
- Do not add auth.
- Do not add billing.
- Do not add pricing page.
- Do not expose env secrets.
- Do not store raw prompt in localStorage.

Validation:
- pnpm lint
- pnpm build
- browser walkthrough with success and error states
```

### Akceptacja

```text
[ ] Formularz wykonuje realną analizę.
[ ] Błędy są czytelne.
```

---

## Mission 19 — Private result access

### Cel

Dodać prywatny `/result/[id]`.

### Prompt do Gemini / Antigravity

```text
Act as a senior Next.js security-minded engineer.

Task:
Implement private result access for /result/[id].

Requirements:
- /result/[id] reads the result server-side.
- Access requires matching owner_anonymous_id from secure cookie.
- User cannot read another anonymous user's result.
- Missing result returns 404.
- Non-owner returns 403 or safe not-found according to documented decision.
- Client must not directly read private prompt_analyses from Supabase.
- Show the full result UI using real data.
- Do not expose internal metadata in UI.

Rules:
- No auth.
- No billing.
- No public access by UUID.
- No client-side Supabase secret.
- No direct client reads for private prompt_analyses.

Validation:
- owner can read private result
- non-owner cannot read private result
- missing result handled
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] UUID nie jest publicznym linkiem.
[ ] Wynik prywatny działa tylko dla ownera.
```

---

## Mission 20 — Opt-in share link

### Cel

Dodać publiczny link tylko po świadomej akcji.

### Prompt do Gemini / Antigravity

```text
Act as a senior backend/frontend engineer.

Task:
Implement opt-in public share links.

Scope:
- POST /api/share
- POST /api/share/disable
- /share/[token]
- UI action on /result/[id] to create share link
- clear public-link warning

Requirements:
- share_token is random, long and non-predictable.
- is_share_enabled is false by default.
- /share/[token] reads only if is_share_enabled = true.
- POST /api/share verifies ownership.
- Never expose private result by UUID alone.
- Log share_link_created event.
- Shared page must not expose owner_anonymous_id, user_id, internal IDs or technical metadata.
- Add disable share link in this phase or leave only exact implementation details to Mission 22A; public share cannot launch without disable.

Rules:
- Public sharing must never be enabled by default.
- No auth.
- No billing.
- Do not add social features.
- Do not allow editing shared results.

Validation:
- private result is not public by default
- generated share link works
- disabled share link returns 404 or 403
- random token lookup works
- non-owner cannot create share link
- share disable implementation is present or explicitly handed to Mission 22A before beta
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Share działa tylko po opt-in.
[ ] Token jest nieprzewidywalny.
```

---

## Mission 21 — Anonymous usage limits

### Cel

Ograniczyć koszty i abuse.

### Prompt do Gemini / Antigravity

```text
Act as a senior backend engineer.

Task:
Implement anonymous usage limits.

Requirements:
- simple daily limit based on owner_anonymous_id
- default limit from ANONYMOUS_DAILY_LIMIT
- no account required
- clear limit reached message
- save usage_events
- save limit_reached event
- avoid unnecessary personal data collection
- hash IP/user agent only if needed and documented

Rules:
- Do not add auth.
- Do not add billing.
- Do not trust client-provided owner id.
- Do not block legitimate errors as usage.

Validation:
- below limit passes
- over limit returns 429
- limit_reached event is saved
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Limit działa.
[ ] 429 jest czytelny.
```

---

## Mission 22 — Feedback and copy events

### Cel

Dodać metryki wartości: copy i feedback.

### Prompt do Gemini / Antigravity

```text
Act as a senior product engineer.

Task:
Implement feedback buttons and copy event tracking.

Scope:
- POST /api/feedback
- POST /api/events
- copy_improved_prompt event
- thumbs up/down feedback
- optional short comment
- UI on /result/[id]

Requirements:
- Verify ownership for private result feedback.
- Save feedback_events.
- Save usage_events for copy_improved_prompt.
- Do not require auth.
- Non-owner cannot submit feedback for private result.
- For /share/[token], either disable feedback or mark it explicitly as public/shared feedback in the data model decision.
- Keep metadata minimal.

Rules:
- Do not collect unnecessary personal data.
- Do not add analytics vendor.
- Do not add billing.
- Do not expose prompt contents in event metadata.

Validation:
- feedback saves
- copy event saves
- non-owner cannot submit private feedback
- shared result behavior is documented
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] `copy_improved_prompt` zapisuje się.
[ ] Feedback działa tylko zgodnie z access control.
```

---


## Mission 22A — Mandatory share disable and privacy tests

### Cel

Uczynić wyłączanie publicznego linku obowiązkowym i sprawdzić, że share nie ujawnia danych wewnętrznych.

### Prompt do Gemini / Antigravity

```text
Act as a senior security-minded full-stack engineer.

Task:
Implement mandatory share link disabling and public share privacy tests.

Requirements:
- POST /api/share/disable is required, not optional.
- Owner can disable a previously generated share link.
- Disabled share returns 404 or safe 403.
- Public share page never exposes owner_anonymous_id, user_id, internal UUID, debug fields, provider metadata or sensitive findings.
- Log share_link_disabled event.

Rules:
- Do not enable public sharing by default.
- Do not expose private result by UUID.
- Do not allow non-owner to disable a private result share link.
- Do not expose sensitive findings on shared pages.
- Do not add auth or billing.

Validation:
- owner can disable share.
- non-owner cannot disable share.
- disabled token does not work.
- public share snapshot contains no internal metadata.
- pnpm test.
- pnpm build.
```

### Akceptacja

```text
[ ] Owner może wyłączyć share link.
[ ] Disabled share nie działa publicznie.
[ ] Publiczny share nie pokazuje metadanych wewnętrznych.
```

---

## Mission 22B — Retention cleanup

### Cel

Dodać realny mechanizm wykonawczy retencji danych.

### Prompt do Gemini / Antigravity

```text
Act as a senior backend engineer focused on privacy and data lifecycle.

Task:
Implement retention cleanup for MVP data.

Requirements:
- anonymous analyses expire after configured retention period.
- usage_events expire after configured retention period.
- feedback_events expire after configured retention period.
- high-risk blocked prompts are never stored raw.
- cleanup can be run manually and scheduled.
- dry-run mode exists if practical.
- shared active records follow the explicit retention policy decision.

Rules:
- Do not delete production data unless explicitly approved.
- Do not store high-risk blocked raw prompts.
- Do not change retention periods without updating docs/retention-policy.md and docs/decision-log.md.
- Do not add auth or billing.

Validation:
- old records are deleted/anonymized according to policy.
- fresh records are untouched.
- cleanup does not delete shared active records unless policy says so.
- pnpm test.
- migration/check script documented.
```

### Akceptacja

```text
[ ] Retencja ma mechanizm wykonawczy.
[ ] Testy potwierdzają, że świeże dane nie są usuwane.
[ ] Polityka dla aktywnych share links jest jawna.
```

---

# PHASE F — v0.5: production-ready MVP

## Mission 23 — Production readiness basics

### Cel

Dodać minimalną twardość produkcyjną.

### Prompt do Gemini / Antigravity

```text
Act as a senior production readiness engineer.

Task:
Add production readiness basics for the MVP.

Scope:
- env validation
- safe server env access
- client env access only for NEXT_PUBLIC values
- loading states
- empty states
- error boundaries where useful
- 404 page
- basic metadata
- robots.txt
- no pricing page yet

Requirements:
- GOOGLE_GENERATIVE_AI_API_KEY must be server-only.
- SUPABASE_SECRET_KEY must be server-only.
- No secret can be prefixed NEXT_PUBLIC.
- In production, missing critical env should fail safely.
- Errors shown to users must not leak internal details.

Rules:
- Do not add auth.
- Do not add billing.
- Do not deploy production.
- Do not change AI provider.

Validation:
- pnpm lint
- pnpm test
- pnpm build
- manual check that secrets are not referenced in client components
```

### Akceptacja

```text
[ ] Env validation istnieje.
[ ] Sekrety nie trafiają do klienta.
```

---


## Mission 23A — Secret and bundle exposure audit

### Cel

Sprawdzić, czy sekrety nie wyciekają do klienta, builda, logów ani odpowiedzi API.

### Prompt do Gemini / Antigravity

```text
Act as a senior application security engineer.

Task:
Check that server secrets are not exposed.

Requirements:
- scan source files.
- scan built output where practical.
- verify GOOGLE_GENERATIVE_AI_API_KEY, SUPABASE_SECRET_KEY and future Stripe secrets are server-only.
- verify error responses do not include env values.
- verify logs redact sensitive values.
- verify private prompt_analyses are not read client-side.
- check sourcemaps if they are generated.

Rules:
- Do not print any discovered real secret values.
- Redact values in output.
- If a real secret is found in source or Git history, mark as incident requiring key rotation.
- Do not add features.
- Do not deploy.

Validation:
- pnpm build.
- grep/scanner result documented.
- no secrets in client bundle, sourcemaps, response body or logs.
```

### Akceptacja

```text
[ ] Sekrety nie występują w client bundle.
[ ] Admin/server clients nie są importowane w client components.
[ ] Ewentualne znaleziska są zredagowane.
```

---

## Mission 24 — Test suite hardening

### Cel

Rozszerzyć testy przed betą.

### Prompt do Gemini / Antigravity

```text
Act as a senior test engineer.

Task:
Add or improve the MVP test suite.

Required tests:
- scoring unit tests
- Zod validation tests
- sensitive-data detector tests
- mocked /api/analyze route tests
- result access tests
- share token tests
- anonymous limit tests
- feedback endpoint tests
- copy event tests
- share disable tests
- share privacy snapshot tests
- retention cleanup tests
- bundle/static secret exposure checks where practical
- static/code review check that private prompt_analyses are not read client-side
- Playwright smoke test for / → /analyze → mocked or test /result flow

Rules:
- Mock external AI provider unless explicitly running live smoke test.
- Do not require real production credentials.
- Do not store test secrets.
- Do not test against production DB.
- Keep tests deterministic.

Validation:
- pnpm test
- pnpm build
- Playwright smoke if configured
```

### Akceptacja

```text
[ ] Kluczowe API i access control są testowane.
[ ] Testy nie wymagają produkcyjnych sekretów.
```

---

## Mission 25 — AI eval fixtures

### Cel

Dodać fixtures do oceny jakości AI.

### Prompt do Gemini / Antigravity

```text
Act as an AI evaluation engineer.

Task:
Create AI quality evaluation fixtures for PromptPolish.

Files:
- tests/ai-fixtures/weak-pl.json
- tests/ai-fixtures/strong-pl.json
- tests/ai-fixtures/weak-en.json
- tests/ai-fixtures/strong-en.json
- tests/ai-fixtures/sensitive-data.json
- tests/ai-fixtures/uncertain-facts.json
- docs/evaluation-fixtures.md

Minimum:
- 10 weak PL prompts
- 10 strong PL prompts
- 10 weak EN prompts
- 10 strong EN prompts
- 5 prompts with sensitive data
- 5 prompts asking for facts without sources
- optional: coding, marketing/e-commerce and format-specific prompts

Each fixture should include:
- input_prompt
- working_language
- profile_slug
- expected_strengths
- expected_weaknesses
- expected_score_range
- should_warn_sensitive_data
- should_warn_uncertain_facts
- notes_for_manual_review

Rules:
- Do not include real secrets.
- Use fake/redacted secrets only.
- Do not run live AI evaluation in this mission unless explicitly approved.
- Do not change production prompt templates in this mission.

Validation:
- fixture JSON parses
- schema check passes if available
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Fixtures istnieją.
[ ] Nie zawierają prawdziwych danych wrażliwych.
```

---

## Mission 26 — AI quality eval pass

### Cel

Sprawdzić jakość Gemini na fixtures.

### Prompt do Gemini / Antigravity

```text
Act as an AI evaluation engineer.

Task:
Run the required AI quality evaluation pass.

Use:
- tests/ai-fixtures

Requirements:
- Evaluate weak PL, strong PL, weak EN, strong EN, sensitive-data and uncertain-facts fixtures.
- Record observed score ranges.
- Record bad outputs.
- Identify whether improved prompts are too long.
- Identify whether the model invents unsupported capabilities.
- Identify whether uncertainty warnings are present when needed.
- Identify whether safety notes avoid repeating secret values.
- Produce docs/evaluation-results.md.

Rules:
- Do not change production code in this mission unless separately approved.
- Do not hide failed cases.
- Do not treat valid JSON as sufficient quality.
- If live Gemini key is missing, document that live eval was not run and provide manual instructions.

Validation:
- docs/evaluation-results.md exists
- failures are listed
- recommended prompt/schema changes are listed separately
- pnpm build
```

### Akceptacja

```text
[ ] Jest raport eval.
[ ] Wiadomo, co poprawić przed publicznym MVP.
```

---


## Mission 26A — Full-schema Gemini smoke test

### Cel

Sprawdzić structured output Gemini na schemacie zbliżonym do produkcyjnego `analysisSchema`.

### Prompt do Gemini / Antigravity

```text
Act as a senior AI integration and evaluation engineer.

Task:
Run Gemini structured output smoke test using the production-like analysisSchema.

Requirements:
- use same schema shape as /api/analyze.
- test PL and EN prompt.
- test weak prompt and strong prompt.
- record invalid output rate.
- record model_id_used.
- record token usage where available.
- record provider errors.
- record retry count.
- record invalid schema count.
- estimate cost per analysis only if usage metadata is reliable.
- do not fake success if API key is missing.

Rules:
- Do not change production code in this mission unless separately approved.
- Do not log API keys.
- Do not log real sensitive prompt data.
- Do not treat valid JSON as sufficient quality.
- If live Gemini key is missing, document that live smoke test was not run and provide manual instructions.

Validation:
- docs/gemini-integration-decision.md updated.
- docs/evaluation-results.md updated.
- cost benchmark notes exist.
- invalid output cases are documented if they occur.
```

### Akceptacja

```text
[ ] Smoke test używa pełnego schema shape.
[ ] Jest zapis model_id_used, invalid schema count i provider errors.
[ ] Brak klucza API nie jest udawany jako sukces.
```

---

## Mission 27 — Launch checklist and security review

### Cel

Review przed preview/produkcją.

### Prompt do Gemini / Antigravity

```text
Act as a senior security and production readiness reviewer.

Task:
Perform MVP launch readiness review.

Check:
- security
- API key exposure
- scope creep
- model hallucination risk
- cost controls
- database writes
- result access control
- share token access control
- sensitive-data handling
- retention policy
- error handling
- UX clarity
- Gemini provider failure states
- mobile layout
- privacy and terms drafts
- AI eval results
- mandatory share disable
- retention cleanup
- bundle leak test
- full-schema Gemini smoke test
- cost benchmark
- share privacy tests
- GDPR/cookies/vendor processing draft

Rules:
- Do not modify files.
- Do not deploy.
- Do not add features.
- Return findings first.
- Mark blocking vs non-blocking issues.

Output:
- docs/mvp-launch-readiness-review.md
- go/no-go recommendation
- blocking issues
- non-blocking issues
- exact next actions
```

### Akceptacja

```text
[ ] Jest go/no-go.
[ ] Blokery są jawne.
```

---

## Mission 28 — Vercel preview deploy checklist

### Cel

Przygotować preview bez produkcyjnego launchu.

### Prompt do Gemini / Antigravity

```text
Act as a Vercel/Supabase deployment engineer.

Task:
Prepare Vercel preview deployment checklist for the MVP.

Scope:
- document required env vars
- document Supabase project setup
- document migration/seed commands
- document preview smoke tests
- document rollback steps
- do not deploy production

Required smoke tests:
- /
- /analyze
- /result/[id]
- /share/[token]
- API error states
- limits
- sensitive-data blocking
- feedback
- copy event
- mobile layout
- no secret exposure in client bundle
- no secret exposure in sourcemaps, response body or logs
- share disable
- share privacy
- retention cleanup dry-run
- full-schema Gemini smoke/cost benchmark status

Rules:
- Do not modify production.
- Do not paste secrets into files.
- Do not run production migration.
- Do not claim deploy success unless actually verified.

Output:
- docs/vercel-preview-checklist.md
- exact env var list
- exact manual test list
- known risks
```

### Akceptacja

```text
[ ] Preview checklist jest kompletna.
[ ] Brak produkcyjnych działań bez zgody.
```

---

# PHASE G — v0.6: beta i walidacja

## Mission 29 — Beta instrumentation report

### Cel

Po pierwszym użyciu zebrać dane.

### Prompt do Gemini / Antigravity

```text
Act as a product analytics engineer.

Task:
Prepare a beta instrumentation and reporting plan for the MVP.

Metrics:
- number of analyses
- form completion rate
- copy_improved_prompt rate
- feedback up/down
- feedback comments themes
- task types
- average cost per analysis if usage data exists
- token usage
- retry count
- invalid schema count
- API errors
- Gemini/provider errors
- invalid structured output rate
- limit_reached
- share_link_created
- sensitive_data_warning_shown
- sensitive_data_blocked

Rules:
- Do not add third-party analytics unless approved.
- Use existing usage_events where possible.
- Do not collect unnecessary personal data.
- Do not log raw sensitive prompt data.
- Do not add billing.

Output:
- docs/beta-metrics-plan.md
- list of missing events
- recommended dashboard queries
```

### Akceptacja

```text
[ ] Wiadomo, co mierzyć w becie.
[ ] Brak nadmiernego trackingu.
```

---

## Mission 30 — Paid readiness report gate

### Cel

Decyzja: iść w paid roadmap czy poprawiać MVP.

### Prompt do Gemini / Antigravity

```text
Read:
- docs/product-mvp.md
- docs/architecture.md
- docs/decision-log.md
- docs/launch-checklist.md
- docs/evaluation-results.md
- docs/paid-saas-roadmap.md
- current usage/event data if available

Act as a senior SaaS product engineer.

Task:
Prepare a paid SaaS readiness report before any billing implementation.

Rules:
- Do not write code.
- Do not add auth, billing, pricing or Stripe.
- Evaluate whether the product is ready for paid roadmap.
- Use actual usage data where available.
- Mark missing data as unknown.
- Identify whether users have shown enough value signals.
- Recommend one of:
  - continue MVP
  - improve product quality
  - add auth/history
  - start billing foundation later

Acceptance criteria:
- Report includes copy rate, feedback, returning users, share usage, limit reached events, estimated analysis cost, token usage, provider errors, retry count and invalid schema count.
- Report confirms share disable, retention cleanup, bundle leak test, share privacy tests and full-schema Gemini smoke test are complete.
- Report identifies the most likely Pro value proposition.
- Report lists blocking risks before Stripe.
- Report updates docs/decision-log.md with the decision.

Output:
- docs/paid-readiness-report.md
- decision-log entry
- go/no-go for paid roadmap
```

### Akceptacja

```text
[ ] Stripe nadal nie jest dodany.
[ ] Decyzja bazuje na danych albo jasno oznaczonych brakach danych.
```

---

# PHASE H — v0.7: konta i historia bez billing

## Mission 31 — Supabase Auth foundation

### Cel

Dodać konta bez psucia anonymous-first flow.

### Prompt do Gemini / Antigravity

```text
Act as a senior full-stack engineer.

Task:
Add Supabase Auth and user profile foundation without billing.

Scope:
- Supabase Auth integration
- user_profiles table
- logged-in ownership for prompt_analyses
- preserve anonymous-first flow
- account page with basic user info
- sign in / sign out
- migration path from anonymous owner id to user_id after login

Product rules:
- Anonymous user can still run the first analysis.
- Account is needed for history and paid features later.
- Login must not block first value.
- Existing anonymous analyses can be attached to user_id after login.

Security:
- private reads remain server-only
- ownership check becomes user_id OR owner_anonymous_id according to documented logic
- no Supabase secret keys in client
- no billing logic

Rules:
- Do not add Stripe.
- Do not add pricing page.
- Do not force login before first analysis.
- Do not add teams/workspaces.

Validation:
- anonymous analysis still works
- login works
- logged-in user can access own result
- non-owner cannot access another result
- anonymous-to-user linking is tested
- migration applies cleanly
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Anonymous-first nadal działa.
[ ] Auth nie wprowadza billing.
```

---

## Mission 32 — Analysis history

### Cel

Dać powód do założenia konta.

### Prompt do Gemini / Antigravity

```text
Act as a senior product engineer.

Task:
Implement logged-in analysis history.

Scope:
- /history page for authenticated users
- list prompt analyses owned by user_id
- filter by language/profile/task type
- simple search by title or prompt snippet if safe
- favorite flag
- soft delete
- empty/loading/error states

Data changes:
- prompt_analyses.title nullable if needed
- prompt_analyses.is_favorite default false if needed
- prompt_analyses.deleted_at nullable if needed

Rules:
- No billing.
- No pricing.
- No team/workspace features.
- No prompt library beyond simple history.
- Private reads must remain server-side.
- Soft-deleted results should not appear in history.
- Decide and document how soft delete affects share links.

Validation:
- user sees only own history
- anonymous users see sign-in CTA or safe redirect
- soft-deleted results do not appear
- non-owner cannot access history data
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Historia działa tylko dla ownera.
[ ] Soft delete jest bezpieczny.
```

---

# PHASE I — v0.8: Pro value layer bez Stripe / z minimalnym pricing copy

## Mission 33 — Plan entitlement layer without Stripe

### Cel

Dodać uprawnienia planów przed billingiem.

### Prompt do Gemini / Antigravity

```text
Act as a senior SaaS backend engineer.

Task:
Implement plan entitlement layer without Stripe.

Scope:
- static plan config
- free/pro feature flags
- monthly usage limit
- daily abuse limit
- canAnalyzePrompt()
- canExportMarkdown()
- canExportPdf()
- canUseBatchAudit()
- limit reached UX
- upgrade CTA placeholder
- tests for free/pro limits

Rules:
- Do not integrate Stripe yet.
- Do not trust plan data from the client.
- Keep all enforcement server-side.
- User plan must come from backend user profile or safe default.
- Client UI is informational only.
- Do not add real paid checkout.

Validation:
- free user limit works
- pro user limit works using seeded/manual plan
- analyze route enforces plan limits
- client cannot bypass limits by editing request payload
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Backend decyduje o dostępie.
[ ] Stripe nadal nie istnieje.
```

---

## Mission 34 — Markdown and PDF export

### Cel

Dodać pierwszą wartość premium.

### Prompt do Gemini / Antigravity

```text
Act as a senior full-stack engineer.

Task:
Add Markdown and PDF export for analysis results.

Scope:
- export Markdown from result page
- export PDF from result page
- enforce plan entitlements server-side
- log export_markdown and export_pdf events

Rules:
- Do not leak internal metadata.
- Do not allow public shared links to bypass Pro export limits.
- Do not include owner_anonymous_id, user_id, internal IDs or technical metadata in exports.
- Do not include secrets or server-side env data.
- Respect sensitive-data safety notes.
- Do not integrate Stripe.

Validation:
- free user cannot export premium PDF
- pro user can export Markdown/PDF using manual plan assignment
- non-owner cannot export private result
- exported file is readable and clean
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Eksport działa zgodnie z planem.
[ ] Publiczny share nie omija Pro.
```

---

## Mission 35 — Pricing page without payments

### Cel

Przetestować komunikację wartości Pro bez Stripe.

### Prompt do Gemini / Antigravity

```text
Act as a SaaS product/frontend engineer.

Task:
Add pricing page and upgrade UX without enabling payments.

Scope:
- /pricing
- Free and Pro plan comparison
- upgrade CTA placeholders
- limit reached upgrade CTA
- FAQ

Rules:
- Do not integrate Stripe in this task.
- Do not claim unavailable features as live.
- Do not invent model capabilities or guarantees.
- Do not publish final prices unless docs/pricing-decision.md exists.
- Mark pricing as beta/waitlist if payment is not live.
- Copy must be consistent with plan config.

Validation:
- /pricing renders
- copy is consistent with plan config
- no billing code added
- pnpm build
```

### Akceptacja

```text
[ ] Pricing nie udaje płatności, jeśli ich nie ma.
[ ] Copy jest spójne z funkcjami.
```

---

# PHASE J — v0.9: Stripe, legal, monitoring

## Mission 36 — Stripe decision and docs check

### Cel

Przed Stripe wymusić decyzje i aktualną dokumentację.

### Prompt do Gemini / Antigravity

```text
Act as a senior billing integration engineer.

Task:
Prepare Stripe implementation decision before writing billing code.

Requirements:
- Check current Stripe docs for Checkout, Customer Portal and webhooks.
- Check current Supabase Auth integration constraints.
- Check current Vercel deployment constraints for webhooks.
- Decide:
  - subscription vs credits
  - monthly vs annual
  - trial vs no trial
  - one Pro plan vs multiple plans
  - currency
  - refund/cancellation policy draft
  - VAT/invoice questions to verify
- Write docs/billing-decision.md.
- Update docs/decision-log.md.

Rules:
- Do not write billing code.
- Do not create Stripe products/prices from code.
- Do not change production Stripe.
- Do not add secrets to files.
- Mark legal/tax items as requiring review.

Validation:
- billing decision doc exists
- blocking unknowns are listed
- no code changed except docs
```

### Akceptacja

```text
[ ] Decyzje billingowe są zapisane.
[ ] Nie ma kodu Stripe.
```

---

## Mission 37 — Stripe billing foundation

### Cel

Dodać techniczną warstwę billingową w test mode.

### Prompt do Gemini / Antigravity

```text
Act as a senior SaaS billing engineer.

Task:
Implement Stripe billing foundation.

Scope:
- Stripe env validation
- stripe_customers table
- subscriptions table
- checkout session endpoint
- customer portal endpoint
- webhook endpoint
- sync subscription status to server-side entitlements

Requirements:
- Checkout session only for authenticated users.
- Webhook updates subscription status.
- Customer portal opens for existing customer.
- plan_slug updates only server-side.
- Webhook handling must be idempotent.
- Failed/canceled subscription must remove or downgrade Pro entitlement according to documented policy.
- Use allowlisted server-side price IDs from env/config.
- Do not trust client-provided plan or price IDs.

Rules:
- Use current Stripe docs.
- Do not expose Stripe secret key client-side.
- Do not use production Stripe keys in local files.
- Do not deploy production.
- Do not change Stripe products/prices without explicit approval.
- Update docs/decision-log.md with billing decisions.

Validation:
- checkout works in Stripe test mode
- webhook updates subscription
- customer portal opens for subscribed user
- canceled subscription removes Pro entitlement according to policy
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Stripe działa w test mode.
[ ] Webhook jest idempotentny.
[ ] Klient nie wybiera sobie planu dowolnie.
```

---

## Mission 38 — Paid plan enforcement

### Cel

Połączyć Stripe status z realnymi limitami.

### Prompt do Gemini / Antigravity

```text
Act as a senior SaaS backend engineer.

Task:
Connect Stripe subscription status to product entitlements.

Scope:
- map subscription status to plan access
- enforce Pro features server-side
- add billing status UI
- add plan badge
- add tests for active, canceled, past_due and unpaid states

Requirements:
- active Pro gets Pro features.
- canceled but active until period end follows documented policy.
- past_due follows documented policy.
- unpaid/canceled does not keep Pro after allowed period.
- Backend is source of truth.
- Client UI is only informational.

Rules:
- Do not allow plan bypass by changing request payloads.
- Do not expose subscription internals unnecessarily.
- Do not add enterprise/team features.
- Do not deploy production.

Validation:
- active Pro gets Pro limits
- canceled subscription keeps/removes access according to policy
- failed payment state is handled
- free user cannot access Pro-only routes
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Pro access zależy od backendu.
[ ] Free nie omija limitów.
```

---

## Mission 39 — Legal and billing readiness drafts

### Cel

Przygotować płatny produkt formalnie jako draft.

### Prompt do Gemini / Antigravity

```text
Act as a product/legal readiness assistant for a SaaS.

Task:
Prepare legal and billing readiness drafts.

Scope:
- update docs/legal-readiness.md
- update privacy draft
- update terms draft
- add refund/cancellation policy draft
- add vendor/data processor inventory draft
- add data deletion request flow draft

Rules:
- Mark legal content as draft and requiring professional review.
- Do not make unsupported compliance claims.
- Do not claim GDPR compliance as guaranteed.
- Do not deploy paid production until review is complete.
- Keep pricing, terms and privacy consistent.
- Mention Stripe, Supabase, Vercel and AI provider roles at a high level.

Validation:
- documents exist
- pricing, terms and privacy are consistent
- unresolved legal/tax/GDPR questions are listed
```

### Akceptacja

```text
[ ] Dokumenty są draftami.
[ ] Brak niezweryfikowanych claimów compliance.
```

---

## Mission 40 — Paid SaaS monitoring and operations

### Cel

Dodać widoczność kosztów, błędów i billing events.

### Prompt do Gemini / Antigravity

```text
Act as a SaaS operations engineer.

Task:
Add paid SaaS monitoring and operational readiness.

Scope:
- billing-related usage events
- cost tracking fields where provider usage data is available
- provider error monitoring hooks
- Stripe webhook failure observability
- operations runbook
- support process documentation
- rollback plan draft

Events:
- signup_started
- signup_completed
- checkout_started
- checkout_completed
- checkout_failed
- subscription_activated
- subscription_canceled
- subscription_past_due
- customer_portal_opened
- upgrade_cta_clicked
- limit_reached
- export_markdown
- export_pdf
- analysis_completed
- copy_improved_prompt
- feedback_submitted

Rules:
- Do not build a full admin panel unless explicitly approved.
- Do not expose private prompts in diagnostics.
- Do not log secrets or payment data.
- Do not log full card/payment details.
- Do not claim exact AI cost unless reliable usage metadata exists.

Validation:
- key paid events are recorded
- provider errors are observable
- Stripe webhook failures are observable
- docs/operations-runbook.md exists
- pnpm test
- pnpm build
```

### Akceptacja

```text
[ ] Billing i provider errors są obserwowalne.
[ ] Logi nie łamią prywatności.
```

---

# PHASE K — v1.0: paid SaaS launch readiness

## Mission 41 — v1.0 product freeze review

### Cel

Zamrozić zakres przed launch.

### Prompt do Gemini / Antigravity

```text
Act as a senior product and engineering reviewer.

Task:
Perform v1.0 product freeze review.

Review:
- MVP core flow
- auth
- history
- entitlements
- exports
- pricing page
- Stripe checkout
- customer portal
- webhook handling
- Pro enforcement
- privacy/terms/refund drafts
- monitoring
- support flow
- mobile UX
- error states
- AI quality
- cost controls
- security boundaries

Rules:
- Do not modify files.
- Do not deploy.
- Do not add features.
- Identify scope creep.
- Identify features that should be postponed until v1.1.
- Return go/no-go.

Output:
- docs/v1-product-freeze-review.md
- blocking issues
- non-blocking issues
- postponed items
- final v1.0 scope
```

### Akceptacja

```text
[ ] Zakres v1.0 jest zamrożony.
[ ] Blokery są jawne.
```

---

## Mission 42 — v1.0 launch checklist

### Cel

Przygotować pełną checklistę produkcyjną.

### Prompt do Gemini / Antigravity

```text
Act as a senior production launch engineer.

Task:
Create the v1.0 launch checklist.

Checklist must include:
- Auth works.
- Anonymous flow still works.
- History works only for owner.
- Free limits work.
- Pro limits work.
- Checkout test mode works.
- Production checkout controlled test is planned.
- Production webhook is configured.
- Customer portal works.
- Cancel subscription works.
- Failed payment state is handled.
- Pro entitlement cannot be bypassed client-side.
- Stripe secrets are not in client bundle.
- Supabase secret key is not in client bundle.
- Gemini key is not in client bundle.
- Pricing, terms and privacy are consistent.
- Refund/cancel policy is described.
- Support contact works.
- Error monitoring works.
- Cost monitoring works.
- Rollback plan is documented.
- Paid beta is limited to a small group.
- Legal/tax/GDPR open questions are listed.
- Manual smoke test list exists.

Rules:
- Do not deploy.
- Do not change production env.
- Do not change Stripe products/prices.
- Do not make unsupported compliance claims.

Output:
- docs/v1-launch-checklist.md
- launch blockers
- manual smoke test script
- rollback checklist
```

### Akceptacja

```text
[ ] Jest launch checklist.
[ ] Są warunki rollbacku.
```

---

## Mission 43 — Controlled production smoke test plan

### Cel

Opisać, jak testować produkcję bez szerokiego launchu.

### Prompt do Gemini / Antigravity

```text
Act as a senior QA engineer for SaaS launch.

Task:
Prepare a controlled production smoke test plan for v1.0.

Scope:
- production env verification
- Supabase production policies
- Stripe production webhook test
- one controlled checkout test
- one cancellation test
- one failed payment scenario if practical
- Gemini live analysis test
- sensitive-data blocked prompt test
- private result access test
- public share test
- Pro export test
- Free limit test
- mobile test
- secret exposure check

Rules:
- Do not run the tests unless explicitly approved.
- Do not deploy.
- Do not use real customer data.
- Do not paste real secrets as test prompts.
- Use fake/redacted secrets for sensitive-data tests.
- If payment test requires a real card/account, document manual owner-only procedure.

Output:
- docs/v1-production-smoke-test-plan.md
- exact test cases
- expected results
- rollback triggers
```

### Akceptacja

```text
[ ] Test plan nie wykonuje działań sam.
[ ] Nie używa prawdziwych danych klientów.
```

---

## Mission 44 — Paid beta launch readiness review

### Cel

Ostatni go/no-go przed płatną betą.

### Prompt do Gemini / Antigravity

```text
Act as a senior SaaS launch reviewer.

Task:
Perform paid beta launch readiness review.

Rules:
- Do not deploy or modify production without explicit approval.
- Do not change Stripe products/prices without explicit approval.
- Do not bypass legal/security checklist.
- Do not hide blockers.
- Return go/no-go.

Review:
- auth
- anonymous flow
- billing
- checkout
- customer portal
- webhook handling
- entitlement enforcement
- pricing consistency
- privacy
- terms
- refund/cancel policy
- data retention
- support flow
- monitoring
- rollback plan
- secret exposure
- cost controls
- Gemini failure states
- Supabase access policies
- share token access
- export permissions

Output:
- docs/paid-beta-launch-review.md
- go/no-go recommendation
- blocking issues
- non-blocking issues
- launch decision entry for docs/decision-log.md
```

### Akceptacja

```text
[ ] Jest finalny go/no-go.
[ ] Produkcja nie została zmieniona bez zgody.
```

---

## Mission 45 — v1.0 release notes and operator runbook

### Cel

Zamknąć wersję 1.0 dokumentacyjnie.

### Prompt do Gemini / Antigravity

```text
Act as a product release engineer.

Task:
Prepare v1.0 release notes and operator runbook.

Files:
- docs/v1-release-notes.md
- docs/operator-runbook.md
- docs/support-playbook.md

Release notes should include:
- what is included in v1.0
- what is not included
- known limitations
- privacy/safety limitations
- paid beta scope
- support contact
- rollback note

Operator runbook should include:
- common incidents
- Gemini provider failure
- Supabase outage
- Stripe webhook failure
- failed checkout
- wrong entitlement
- high cost spike
- suspected secret leakage
- user deletion request
- refund/cancellation support
- rollback procedure

Rules:
- Do not claim perfect reliability.
- Do not claim legal/compliance guarantees.
- Do not include secrets.
- Do not expose internal credentials.
- Keep content practical.

Validation:
- docs exist
- runbook covers critical incidents
- no secrets included
```

### Akceptacja

```text
[ ] Operator ma instrukcje na awarie.
[ ] Release notes jasno opisują zakres.
```

---

# 2. Checkpointy Git

Po każdej zaakceptowanej misji zrób commit według schematu:

```bash
git status
git add .
git commit -m "Mission XX: short description"
```

Rekomendowane tagi:

```bash
git tag v0.0-docs
git tag v0.1-ui-mock
git tag v0.2-core-deterministic
git tag v0.3-db-ai-foundation
git tag v0.4-mvp-feature-complete
git tag v0.5-production-ready-mvp
git tag v0.6-beta-validation
git tag v0.7-auth-history
git tag v0.8-pro-value-layer
git tag v0.9-billing-beta
git tag v1.0-paid-saas
```

Nie taguj wersji, jeśli:

```text
- testy nie przechodzą,
- build nie przechodzi,
- access control nie działa,
- share disable nie działa,
- retention cleanup nie działa,
- high-risk secrets są wysyłane do AI,
- klient widzi server secrets,
- full-schema Gemini smoke test nie jest wykonany przed betą,
- billing działa tylko częściowo,
- webhooki Stripe nie są zweryfikowane,
- launch review ma blokery.
```

---

# 3. Minimalna definicja “v1.0 gotowe”

`v1.0` można uznać za gotowe dopiero, gdy:

```text
[ ] Główny flow PromptPolish działa.
[ ] Anonymous-first flow nadal działa.
[ ] Auth działa dla historii i Pro.
[ ] Historia pokazuje tylko własne analizy.
[ ] Sensitive-data high-risk jest blokowane przed AI.
[ ] Gemini structured output jest walidowany.
[ ] Backend liczy finalny score.
[ ] Private /result/[id] jest chroniony.
[ ] /share/[token] działa tylko po opt-in.
[ ] /api/share/disable działa.
[ ] Publiczny share nie ujawnia metadanych wewnętrznych.
[ ] Retention cleanup działa.
[ ] Full-schema Gemini smoke test jest wykonany.
[ ] Bundle leak test jest zielony.
[ ] Feedback i copy events działają.
[ ] Free/Pro entitlements są egzekwowane server-side.
[ ] Markdown/PDF export jest zgodny z uprawnieniami.
[ ] Pricing jest zgodny z realnymi funkcjami.
[ ] Stripe Checkout działa w test mode i kontrolowanym production smoke.
[ ] Stripe webhook aktualizuje subskrypcje idempotentnie.
[ ] Customer Portal działa.
[ ] Cancel/failure states są obsłużone.
[ ] Sekrety nie są w client bundle.
[ ] Terms/privacy/refund/cancel drafts są przygotowane i oznaczone do review.
[ ] Monitoring błędów, kosztów i webhooków istnieje.
[ ] Rollback plan istnieje.
[ ] Paid beta launch review ma go.
```

---

# 4. Najważniejsze zasady utrzymania zakresu

```text
MVP:
- bez auth,
- bez billing,
- bez dashboardu,
- bez pricing,
- bez marketplace,
- bez prompt library,
- bez multi-model execution.

Po MVP:
- najpierw dane,
- potem auth/history,
- potem entitlements/export,
- potem pricing,
- dopiero potem Stripe.

v1.0:
- jeden Pro plan,
- server-side entitlements,
- customer portal,
- monitoring,
- mała paid beta,
- bez enterprise/team/workspaces.
```

---

# 5. Prompty awaryjne do Gemini

## 5.1. Gdy Gemini zrobi scope creep

```text
Stop implementation.

Review the last changes for scope creep.

Rules:
- Do not write new code.
- Identify files changed outside the mission scope.
- Identify features added outside MVP/v1.0 scope.
- Recommend what to revert.
- Do not revert automatically until I approve.

Output:
- out-of-scope changes
- risky changes
- recommended rollback plan
```

## 5.2. Gdy build/test nie przechodzi

```text
Act as a senior debugging engineer.

Task:
Fix only the failing build/test issues from the last mission.

Rules:
- Do not add features.
- Do not refactor unrelated files.
- Do not change architecture.
- Do not weaken tests just to pass.
- Explain the root cause.
- Make the smallest fix.

Validation:
- pnpm test
- pnpm build

Output:
- root cause
- files changed
- validation results
```

## 5.3. Gdy pojawia się ryzyko sekretów

```text
Stop and perform a secret exposure audit.

Check:
- source files
- env examples
- client components
- API responses
- logs
- tests
- docs
- bundle references if practical

Rules:
- Do not print any discovered secret values.
- Redact secrets in output.
- Do not commit.
- Recommend immediate remediation.
- If a real secret was committed, mark it as incident requiring key rotation.

Output:
- affected files
- risk level
- remediation steps
- whether key rotation is required
```

## 5.4. Gdy dostęp do wyników wygląda niebezpiecznie

```text
Stop and review result access control.

Check:
- /result/[id]
- /share/[token]
- Supabase queries
- server/client boundaries
- owner_anonymous_id logic
- user_id logic if auth exists
- share_token logic
- disabled share behavior

Rules:
- Do not write code until review is complete.
- Do not expose private result by UUID.
- Do not allow direct client reads for private prompt_analyses.
- Identify exact bypass scenarios.

Output:
- access model summary
- possible bypasses
- blocking risks
- smallest fix plan
```

## 5.5. Gdy billing działa dziwnie

```text
Stop and review billing entitlement logic.

Check:
- Stripe webhook events
- subscriptions table
- user_profiles.plan_slug
- server-side entitlement functions
- /api/analyze limit enforcement
- export permission checks
- pricing page consistency
- client payload bypass risk

Rules:
- Do not change Stripe products/prices.
- Do not deploy.
- Do not trust client-provided plan data.
- Do not expose Stripe secrets.
- Identify whether the issue is checkout, webhook, sync, or entitlement.

Output:
- root cause hypothesis
- affected users or states
- safe fix plan
- tests to add
```

---

# 6. Rekomendowana kolejność wykonania

```text
MVP:
00 Environment smoke test
01 Create clean Next.js project
02 Add project control docs
03 Review docs before code
04 Landing page and basic layout
05 Analyze page UI mock
06 Result page UI mock
07 Privacy and terms drafts
08 Deterministic scoring
09 Sensitive-data detector
10 Wire local sensitive warning into UI
11 Supabase migration and seed
12 Server-only Supabase data access layer
13 Anonymous identity cookie
14 AI analysis Zod schema
15 Gemini docs check and structured output smoke test
16 Gemini client
17 /api/analyze
18 Connect /analyze UI to real API
19 Private result access
20 Opt-in share link
21 Anonymous usage limits
22 Feedback and copy events
22A Mandatory share disable and privacy tests
22B Retention cleanup
23 Production readiness basics
23A Secret and bundle exposure audit
24 Test suite hardening
25 AI eval fixtures
26 AI quality eval pass
26A Full-schema Gemini smoke test
27 Launch checklist and security review
28 Vercel preview deploy checklist

Beta:
29 Beta instrumentation report
30 Paid readiness report gate

Paid SaaS:
31 Supabase Auth foundation
32 Analysis history
33 Plan entitlement layer without Stripe
34 Markdown and PDF export
35 Pricing page without payments
36 Stripe decision and docs check
37 Stripe billing foundation
38 Paid plan enforcement
39 Legal and billing readiness drafts
40 Paid SaaS monitoring and operations
41 v1.0 product freeze review
42 v1.0 launch checklist
43 Controlled production smoke test plan
44 Paid beta launch readiness review
45 v1.0 release notes and operator runbook
```

---

## 7. Werdykt końcowy

[Wniosek] Ten dokument prowadzi od pustego repo do `v1.0`, ale nie powinien być wykonywany jako jedna długa automatyczna sesja.

Najbezpieczniejszy tryb:

```text
Missions 00–28 plus 22A, 22B, 23A i 26A → MVP/preview/beta
Mission 29–30 → decyzja na danych
Missions 31–45 → paid SaaS v1.0 tylko jeśli walidacja jest pozytywna
```

Nie przechodź do Stripe, jeśli nie masz danych z bety pokazujących, że użytkownicy:

```text
- wykonują analizy,
- kopiują improved prompt,
- wracają,
- używają historii/share/export,
- jasno potrzebują wyższych limitów albo artefaktów dla klienta/zespołu.
```
