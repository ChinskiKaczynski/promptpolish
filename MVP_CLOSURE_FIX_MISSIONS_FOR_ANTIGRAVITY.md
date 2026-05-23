# MVP_CLOSURE_FIX_MISSIONS_FOR_ANTIGRAVITY.md

**Projekt:** PromptPolish / Prompt Audit Tool  
**Cel dokumentu:** zamknąć anonymous-first MVP przed publiczną betą i przed przejściem do paid SaaS roadmap  
**Status wejściowy:** MVP działa technicznie, testy i build przechodzą, ale istnieją blokery jakości, scope i infrastruktury  
**Źródło wejściowe:** `MVP Closure & Readiness Analysis — PromptPolish`, `Prompt Audit MVP v1.1`, `Paid SaaS Roadmap`

---

## 0. Werdykt operacyjny

[Wniosek] Nie przechodź jeszcze do publicznej bety ani Phase 2 paid SaaS.

Najpierw zamknij MVP przez serię krótkich misji:

```text
lint/type debt → legal JSX fixes → scope gate → infra readiness → production gates → final go/no-go
```

Aktualny stan według audytu:

```text
- build produkcyjny przechodzi,
- 146/146 testów przechodzi,
- core security/access-control jest zaimplementowany,
- istnieją 74 problemy lint,
- istnieją 4 deployment/infrastructure gates,
- w kodzie są wczesne elementy Phase 2: /login, /account, /history.
```

To znaczy, że projekt jest blisko **MVP closure**, ale nie jest jeszcze czysty produkcyjnie.

---

## 1. Zasady używania tego dokumentu

Wklejaj do Gemini / Antigravity **jedną misję naraz**.

Po każdej misji:

```text
1. Wymagaj planu przed kodem.
2. Zatwierdź zakres.
3. Pozwól zmienić tylko pliki z zakresu misji.
4. Wymagaj wyników: pnpm lint, pnpm test, pnpm build.
5. Sprawdź diff.
6. Commituj dopiero po review.
```

Nie pozwalaj agentowi:

```text
- wdrażać produkcji bez zgody,
- wklejać sekretów do plików,
- uruchamiać migracji produkcyjnych bez potwierdzenia,
- usuwać Phase 2 folderów bez decyzji,
- dodawać Stripe,
- rozszerzać auth/history,
- refaktorować unrelated files,
- osłabiać testów tylko po to, żeby przeszły.
```

---

## 2. Docelowy stan po zamknięciu MVP

MVP można uznać za zamknięty dopiero, gdy:

```text
[ ] pnpm lint = 0 errors, 0 warnings albo wszystkie warnings jawnie zaakceptowane.
[ ] pnpm test przechodzi.
[ ] pnpm build przechodzi.
[ ] Nie ma `as any` w krytycznej warstwie Supabase queries/types.
[ ] JSX legal pages nie generują błędów escape.
[ ] Unused imports/vars są usunięte.
[ ] Scope creep ma decyzję: retain gated albo move to staging-phase2.
[ ] /login, /account, /history nie psują MVP ani lint/build.
[ ] Supabase migration plan jest gotowy i zweryfikowany.
[ ] Vercel env checklist jest gotowy bez sekretów w repo.
[ ] Cron retention jest opisany i gotowy do konfiguracji.
[ ] Privacy/terms są gotowe jako beta draft albo oznaczone jako blocker.
[ ] Final MVP closure review ma `go` albo listę blockerów.
```

---

# PHASE A — Code quality closure

## Mission C0 — Reproduce current audit state

### Cel

Zweryfikować aktualny stan lokalnie przed naprawami.

### Prompt do Gemini / Antigravity

```text
Act as a senior release engineer.

Task:
Reproduce the current MVP closure audit state before making changes.

Run:
- git status
- pnpm lint
- pnpm test
- pnpm build

Rules:
- Do not modify files.
- Do not install new dependencies unless a command cannot run and you explain why.
- Do not fix anything yet.
- Do not hide failures.
- Classify findings as blocker / non-blocker.

Output:
- current branch and dirty files
- lint summary with counts
- test summary
- build summary
- exact blocker list
- recommended order of fixes
```

### Akceptacja

```text
[ ] Stan jest odtworzony.
[ ] Liczba lint issues jest znana.
[ ] Nie zmieniono plików.
```

---

## Mission C1 — Fix Supabase `any` type debt

### Cel

Usunąć krytyczny dług TypeScript z warstwy Supabase.

### Prompt do Gemini / Antigravity

```text
Act as a senior TypeScript and Supabase engineer.

Task:
Fix all ESLint errors caused by `any` casts in the Supabase data access layer.

Target files:
- lib/supabase/queries.ts
- lib/supabase/types.ts
- any directly related Supabase client typing files only if necessary

Known issue:
The Supabase server client is cast `as any` in core query operations. Remove these bypasses and use typed clients instead.

Requirements:
- Use the native typed SupabaseClient<Database> where practical.
- Keep private prompt_analyses reads server-only.
- Preserve existing query behavior.
- Preserve existing access-control logic.
- Do not weaken TypeScript strictness.
- Do not add broad `unknown as any` workarounds.
- Do not silence lint rules.
- Do not change DB schema in this mission.
- Do not change API behavior except typing safety.

Validation:
- pnpm lint
- pnpm test
- pnpm build

Output:
- root cause summary
- files changed
- list of removed `any` casts
- any remaining type compromises, if unavoidable
- validation results
```

### Akceptacja

```text
[ ] `as any` z query layer usunięte albo uzasadnione pojedyncze wyjątki są udokumentowane.
[ ] Access control nadal działa.
[ ] Testy przechodzą.
[ ] Build przechodzi.
```

---

## Mission C2 — Fix JSX escaping in legal pages

### Cel

Usunąć błędy React/JSX w privacy i terms.

### Prompt do Gemini / Antigravity

```text
Act as a senior React engineer.

Task:
Fix HTML entity escaping errors in legal draft pages.

Target files:
- app/privacy/page.tsx
- app/terms/page.tsx

Known issue:
Unescaped quotes and apostrophes inside JSX text cause lint/compiler issues.

Requirements:
- Replace raw problematic characters with safe React entities where needed.
- Preserve the visible text meaning.
- Do not rewrite legal copy beyond the minimal escaping fix.
- Do not remove draft warnings.
- Do not make legal/compliance claims.
- Do not add billing/privacy features.

Validation:
- pnpm lint
- pnpm build

Output:
- changed lines summary
- validation results
```

### Akceptacja

```text
[ ] Błędy escaping znikają.
[ ] Treść merytoryczna nie została niepotrzebnie zmieniona.
```

---

## Mission C3 — Remove unused imports and variables

### Cel

Doprowadzić lint do zera bez osłabiania reguł.

### Prompt do Gemini / Antigravity

```text
Act as a senior code quality engineer.

Task:
Fix unused imports and unused variables reported by lint.

Known areas:
- components/history/history-filters.tsx
- tests/privacy/retention.test.ts
- any other files currently reported by pnpm lint

Requirements:
- Remove unused imports.
- Remove unnecessary destructured variables.
- Prefix intentionally unused test mocks with `_` only if that is allowed by lint config.
- Do not disable lint rules.
- Do not weaken tsconfig or eslint config.
- Do not refactor unrelated logic.
- Do not delete Phase 2 routes in this mission.

Validation:
- pnpm lint
- pnpm test
- pnpm build

Output:
- files changed
- list of warnings fixed
- validation results
```

### Akceptacja

```text
[ ] Unused warnings są zamknięte.
[ ] Nie zmieniono funkcjonalności.
```

---

## Mission C4 — Final lint zero pass

### Cel

Dopiąć jakość kodu po C1–C3.

### Prompt do Gemini / Antigravity

```text
Act as a senior release engineer.

Task:
Perform final lint zero pass after code quality fixes.

Rules:
- Run pnpm lint, pnpm test, pnpm build.
- If lint still fails, fix only remaining lint issues.
- Do not refactor architecture.
- Do not change product scope.
- Do not disable rules.
- Do not touch infra/env/deploy.

Validation:
- pnpm lint
- pnpm test
- pnpm build

Output:
- final lint count
- final test result
- final build result
- changed files summary
```

### Akceptacja

```text
[ ] `pnpm lint` czysty.
[ ] `pnpm test` przechodzi.
[ ] `pnpm build` przechodzi.
```

---

# PHASE B — Scope creep gate

## Mission S0 — Review Phase 2 files without changing code

### Cel

Podjąć decyzję, co zrobić z `/login`, `/account`, `/history` i `components/history`.

### Prompt do Gemini / Antigravity

```text
Act as a senior product architect and security reviewer.

Task:
Review Phase 2 files that appeared before formal MVP closure.

Review paths:
- app/login
- app/account
- app/history
- components/history
- related Supabase auth/history code
- related migrations if any

Context:
MVP is anonymous-first. Auth, account pages and history are post-MVP / Phase 2 unless explicitly retained behind a safe gate.

Rules:
- Do not modify files.
- Do not delete files.
- Do not implement new features.
- Identify whether these files affect MVP routes, lint, build, runtime, security or deployment.
- Identify whether they expose auth/history to public users.
- Identify whether they increase Supabase or env requirements.

Return two options:
A. Retain files but make them clean, gated and non-blocking.
B. Move them to staging-phase2 or disable routes until Phase 2.

Output:
- affected files
- risks
- recommendation for beta
- exact action plan for chosen option
- decision entry text for docs/decision-log.md
```

### Akceptacja

```text
[ ] Jest jasna rekomendacja A/B.
[ ] Nic nie zostało zmienione.
```

---

## Mission S1A — Retain Phase 2 files safely

### Cel

Zostawić `/login`, `/account`, `/history`, ale tak, by nie blokowały MVP.

Użyj tej misji tylko, jeśli wybierzesz **Option A**.

### Prompt do Gemini / Antigravity

```text
Act as a senior full-stack engineer.

Task:
Retain Phase 2 auth/history files safely without expanding MVP scope.

Scope:
- app/login
- app/account
- app/history
- components/history
- related navigation only if needed

Requirements:
- All files must pass lint/build.
- Auth/history routes must not be promoted as part of anonymous MVP unless explicitly documented.
- If routes remain public, show clear beta/coming-soon/staging treatment as appropriate.
- They must not break anonymous-first flow.
- They must not require production billing or Stripe.
- They must not expose private prompt_analyses client-side.
- They must not introduce direct client reads for private data.
- Update docs/decision-log.md with the decision to retain Phase 2 files as non-MVP preview/staging.

Rules:
- Do not add new auth features.
- Do not add billing.
- Do not add pricing.
- Do not change core MVP analyze/result/share behavior.

Validation:
- pnpm lint
- pnpm test
- pnpm build
- manual route check for /, /analyze, /result/mock or real result, /login, /account, /history

Output:
- changed files
- gating behavior summary
- decision-log entry
- validation results
```

### Akceptacja

```text
[ ] Phase 2 pliki nie blokują MVP.
[ ] Nie są komunikowane jako płatny SaaS.
[ ] Build/lint/test przechodzą.
```

---

## Mission S1B — Move Phase 2 files to staging

### Cel

Wyłączyć auth/history z MVP bez utraty kodu.

Użyj tej misji tylko, jeśli wybierzesz **Option B**.

### Prompt do Gemini / Antigravity

```text
Act as a senior refactoring engineer.

Task:
Move Phase 2 auth/history files out of active MVP routes without deleting useful work.

Scope:
- app/login
- app/account
- app/history
- components/history
- related route links/navigation if needed

Requirements:
- Move Phase 2 UI/code to a clearly named staging area, for example:
  - src/staging-phase2/auth-history/
  - docs/staging-phase2-notes.md
- Remove active routes from Next.js routing if they are out of MVP.
- Preserve code for later Phase 2 reference.
- Update docs/decision-log.md with the decision.
- Ensure landing/analyze/result/share/privacy/terms still work.

Rules:
- Do not permanently delete files unless I approve.
- Do not add billing.
- Do not add pricing.
- Do not rewrite core MVP.
- Do not break imports.

Validation:
- pnpm lint
- pnpm test
- pnpm build
- manual route check: /login, /account, /history should be absent or safe according to decision

Output:
- moved files
- removed route links
- staging notes
- decision-log entry
- validation results
```

### Akceptacja

```text
[ ] Phase 2 kod zachowany, ale nieaktywny.
[ ] MVP route surface jest czysty.
[ ] Build/lint/test przechodzą.
```

---

# PHASE C — Production infrastructure readiness

## Mission I0 — Supabase production migration plan

### Cel

Przygotować bezpieczny plan migracji produkcyjnej, bez wykonywania jej automatycznie.

### Prompt do Gemini / Antigravity

```text
Act as a senior Supabase deployment engineer.

Task:
Prepare the Supabase production migration plan for MVP closure.

Known required database objects:
- prompt_analyses
- usage_events
- feedback_events
- model_profiles
- user_profiles only if Phase 2 auth/history was intentionally retained

Migration files mentioned by audit:
- db/migrations/0001_init.sql
- db/migrations/0002_user_profiles.sql
- db/migrations/0003_history_columns.sql
- db/seed/model_profiles.sql

Rules:
- Do not run production migrations without explicit approval.
- Do not connect to production unless I provide credentials and approve.
- Do not print secrets.
- Verify migration order.
- Verify seed idempotency.
- Identify whether user_profiles/history migrations are MVP or Phase 2 depending on scope decision.
- Identify rollback considerations.

Output:
- docs/supabase-production-migration-plan.md
- required SQL files
- apply order
- preflight checks
- post-migration checks
- rollback/restore notes
- open risks
```

### Akceptacja

```text
[ ] Jest plan migracji.
[ ] Nie wykonano produkcyjnych zmian.
[ ] Jest decyzja, czy 0002/0003 są MVP czy Phase 2.
```

---

## Mission I1 — Supabase local/preview migration verification

### Cel

Zweryfikować migracje poza produkcją.

### Prompt do Gemini / Antigravity

```text
Act as a senior database QA engineer.

Task:
Verify Supabase migrations in local or preview environment.

Requirements:
- Apply migrations to local Supabase or non-production preview only.
- Verify required tables exist.
- Verify indexes exist.
- Verify model_profiles seed is idempotent.
- Verify private prompt_analyses are not publicly readable from client path.
- Verify share_token access pattern works only for is_share_enabled=true.
- Verify high-risk blocked prompt raw body is not required to be stored.

Rules:
- Do not run against production.
- Do not use production secrets.
- Do not insert real user data.
- Use fake test rows only.

Output:
- migration verification result
- table/index checklist
- seed idempotency result
- access-control notes
- blocking issues
```

### Akceptacja

```text
[ ] Migracje działają poza produkcją.
[ ] Seed jest idempotentny.
[ ] Access model jest zgodny z MVP.
```

---

## Mission I2 — Vercel environment readiness checklist

### Cel

Przygotować listę env vars i tryb przełączenia mock → live.

### Prompt do Gemini / Antigravity

```text
Act as a Vercel deployment engineer.

Task:
Prepare Vercel environment readiness checklist for MVP closure.

Required envs from audit and project:
- APP_URL
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SECRET_KEY
- GOOGLE_GENERATIVE_AI_API_KEY
- GEMINI_MODEL_ID
- COOKIE_SIGNING_SECRET
- CRON_SECRET
- ANONYMOUS_DAILY_LIMIT
- MAX_PROMPT_CHARS
- MIN_PROMPT_CHARS
- SENSITIVE_DATA_BLOCK_HIGH_RISK
- NEXT_PUBLIC_ENABLE_MOCK_RESULT if present

Requirements:
- Mark server-only secrets clearly.
- Mark client-exposed NEXT_PUBLIC vars clearly.
- Explain that secrets must be set in Vercel dashboard, not committed.
- Include guidance to switch mock results off only after live Gemini smoke test.
- Include preview vs production differences.
- Include secret exposure checks.

Rules:
- Do not write actual secret values.
- Do not deploy.
- Do not modify Vercel settings.
- Do not paste env values into files.

Output:
- docs/vercel-env-readiness.md
- env var table
- preview checklist
- production checklist
- secret exposure checklist
```

### Akceptacja

```text
[ ] Env checklist jest kompletna.
[ ] Sekrety są oznaczone server-only.
[ ] Nie ma wartości sekretów w plikach.
```

---

## Mission I3 — Retention cron readiness

### Cel

Przygotować cron do polityki retencji.

### Prompt do Gemini / Antigravity

```text
Act as a Vercel operations engineer.

Task:
Prepare retention cron readiness for the MVP.

Known endpoint:
- /api/cron/cleanup

Known retention policy:
- anonymous analyses: 30 days
- usage_events: 90 days
- feedback_events: 180 days
- blocked high-risk raw prompt body: do not store

Requirements:
- Verify whether /api/cron/cleanup exists and is protected by CRON_SECRET.
- Verify it does not allow unauthenticated cleanup.
- Prepare vercel.json cron entry if missing.
- Recommended schedule: daily low-traffic UTC time, for example 0 2 * * *.
- Add docs/retention-cron-readiness.md.

Rules:
- Do not deploy.
- Do not trigger production cleanup.
- Do not delete production data.
- Do not expose CRON_SECRET.
- If code changes are needed, make the smallest safe change.

Validation:
- pnpm test if endpoint tests exist or are added
- pnpm build
- document manual curl test with redacted token

Output:
- endpoint protection status
- changed files if any
- cron config status
- validation results
```

### Akceptacja

```text
[ ] Cron endpoint jest chroniony.
[ ] Harmonogram jest opisany.
[ ] Nic nie usunięto z produkcji.
```

---

# PHASE D — Legal/compliance readiness

## Mission L0 — Legal draft cleanup for beta

### Cel

Doprowadzić privacy/terms do stanu beta draft, bez fałszywych claimów.

### Prompt do Gemini / Antigravity

```text
Act as a product/legal readiness assistant.

Task:
Review and polish /privacy and /terms for private/public beta readiness.

Requirements:
- Keep legal content marked as draft unless professionally reviewed.
- Explain anonymous-first flow.
- Explain prompt processing by AI provider at a high level.
- Explain Supabase/Vercel/Google/Gemini vendor roles at a high level.
- Explain opt-in public share links.
- Explain retention periods.
- Explain sensitive-data warnings and high-risk blocking.
- Explain support/contact placeholder if present.
- Remove misleading or overly strong compliance claims.
- Do not claim full GDPR compliance unless reviewed.
- Do not mention paid SaaS as live unless it is live.

Rules:
- This is not legal advice.
- Mark unresolved legal questions in docs/legal-open-questions.md.
- Do not add cookie banner unless explicitly approved.
- Do not add billing terms.

Validation:
- pnpm lint
- pnpm build

Output:
- pages reviewed
- copy changes summary
- unresolved legal questions
- validation results
```

### Akceptacja

```text
[ ] Privacy/terms są spójne z produktem.
[ ] Nie ma fałszywych compliance claimów.
[ ] Open questions są jawne.
```

---

## Mission L1 — Vendor and GDPR beta checklist

### Cel

Utworzyć checklistę formalną przed ruchem z UE.

### Prompt do Gemini / Antigravity

```text
Act as a SaaS compliance readiness assistant.

Task:
Create a vendor and GDPR beta checklist.

Scope:
- Google/Gemini as AI provider
- Supabase as database/auth provider if used
- Vercel as hosting provider
- Stripe only as future post-MVP vendor if not live
- cookies/session identifiers
- data retention
- deletion requests
- sensitive-data handling
- public share links

Rules:
- Do not claim legal compliance.
- Mark items requiring professional review.
- Do not add code.
- Do not add cookie banner.
- Do not add billing docs unless paid is live.

Output:
- docs/vendor-gdpr-beta-checklist.md
- processor/vendor table
- data categories
- retention summary
- open legal questions
- beta go/no-go legal blockers
```

### Akceptacja

```text
[ ] Checklist formalny istnieje.
[ ] Otwarte pytania prawne są jawne.
```

---

# PHASE E — MVP closure review

## Mission R0 — Full MVP closure review

### Cel

Ostateczny audyt po poprawkach.

### Prompt do Gemini / Antigravity

```text
Act as a senior security, production and product readiness reviewer.

Task:
Perform full MVP closure review after code quality and infrastructure readiness fixes.

Run:
- git status
- pnpm lint
- pnpm test
- pnpm build

Review:
- core anonymous flow
- sensitive-data blocking
- Gemini live/mock mode readiness
- Supabase server-only access
- private /result/[id]
- opt-in /share/[token]
- feedback and copy events
- anonymous limits
- retention policy
- Phase 2 scope handling
- Vercel env readiness
- Supabase migration readiness
- cron readiness
- privacy/terms readiness
- secret exposure risks
- mobile/error states if practical

Rules:
- Do not modify files.
- Do not deploy.
- Do not run production migrations.
- Do not hide blockers.
- Mark findings as P0/P1/P2.

Output:
- docs/mvp-closure-review.md
- go/no-go recommendation for public beta
- blockers
- non-blockers
- exact remaining actions
```

### Akceptacja

```text
[ ] Jest go/no-go.
[ ] Blokery są jawne.
[ ] Nie wykonano produkcyjnych zmian.
```

---

## Mission R1 — Create public beta runbook

### Cel

Przygotować instrukcję odpalenia public/private beta.

### Prompt do Gemini / Antigravity

```text
Act as a SaaS beta launch engineer.

Task:
Create a public/private beta runbook for the MVP.

Include:
- pre-launch checklist
- Vercel env checklist
- Supabase migration checklist
- Gemini live smoke test
- mock mode off checklist
- cron setup checklist
- smoke tests
- rollback plan
- support process
- known limitations
- what not to do during beta
- what metrics to review after week 1

Rules:
- Do not deploy.
- Do not paste secrets.
- Do not add billing.
- Do not add Stripe.
- Keep beta limited until data quality is known.

Output:
- docs/beta-runbook.md
- launch sequence
- rollback sequence
- week-1 metrics review checklist
```

### Akceptacja

```text
[ ] Beta runbook istnieje.
[ ] Ma rollback.
[ ] Nie dodaje paid SaaS.
```

---

## Mission R2 — Update mission roadmap after actual state

### Cel

Zaktualizować roadmapę na podstawie realnego audytu, bez zgadywania.

### Prompt do Gemini / Antigravity

```text
Act as a senior technical program manager.

Task:
Update the project mission roadmap based on the actual MVP closure state.

Read:
- docs/mvp-closure-review.md
- docs/beta-runbook.md
- docs/paid-saas-roadmap.md
- docs/decision-log.md
- current codebase state

Requirements:
- Mark completed MVP missions.
- Mark remaining MVP blockers.
- Mark Phase 2 items as postponed unless the paid readiness gate passes.
- Keep Stripe/payments blocked until data supports it.
- Produce a short next-10-actions plan.

Rules:
- Do not write code.
- Do not deploy.
- Do not add features.

Output:
- docs/next-actions-after-mvp-closure.md
- updated decision-log entry if needed
- next 10 actions
```

### Akceptacja

```text
[ ] Wiadomo, co robić po closure.
[ ] Phase 2 nie startuje automatycznie.
```

---

# PHASE F — Optional production execution gates

Te misje są **manualne / kontrolowane**. Nie wklejaj ich, jeśli nie chcesz wykonywać działań na zewnętrznych usługach.

## Mission P0 — Apply Supabase migrations to production

### Cel

Wykonać produkcyjne migracje dopiero po review.

### Prompt do Gemini / Antigravity

```text
Act as a Supabase production deployment engineer.

Task:
Apply reviewed Supabase migrations to production only after explicit approval.

Preconditions:
- docs/supabase-production-migration-plan.md exists.
- Local/preview migration verification passed.
- I explicitly approve production migration.
- Production backup/rollback plan exists.

Rules:
- Ask for explicit confirmation before any production change.
- Do not print secrets.
- Do not run destructive commands unless explicitly approved.
- Apply migrations in documented order only.
- Verify tables/indexes/seeds after apply.

Output:
- migration commands run
- production verification results
- issues encountered
- rollback status if needed
```

### Akceptacja

```text
[ ] Wykonane tylko po potwierdzeniu.
[ ] Produkcyjne tabele i seed działają.
```

---

## Mission P1 — Configure Vercel production env and preview smoke

### Cel

Skonfigurować Vercel bez sekretów w repo.

### Prompt do Gemini / Antigravity

```text
Act as a Vercel production deployment engineer.

Task:
Guide production env configuration and preview smoke test.

Preconditions:
- docs/vercel-env-readiness.md exists.
- I provide/enter secrets manually in Vercel dashboard.
- No secrets are committed.

Rules:
- Do not ask me to paste secrets into chat or files.
- Do not print secrets.
- Do not deploy production unless I explicitly approve.
- First verify preview deployment.
- Keep mock/live mode decision explicit.

Smoke tests:
- /
- /analyze
- /api/analyze with safe prompt
- high-risk fake secret blocked
- /result/[id]
- /share/[token]
- feedback
- copy event
- mobile layout
- secret exposure check

Output:
- env configured checklist
- preview smoke result
- production go/no-go
```

### Akceptacja

```text
[ ] Sekrety są tylko w Vercel dashboard.
[ ] Preview smoke przechodzi.
```

---

## Mission P2 — Configure production cron

### Cel

Włączyć retention cleanup.

### Prompt do Gemini / Antigravity

```text
Act as a Vercel operations engineer.

Task:
Configure production cron for retention cleanup after explicit approval.

Preconditions:
- /api/cron/cleanup is protected by CRON_SECRET.
- CRON_SECRET is configured in Vercel.
- docs/retention-cron-readiness.md exists.
- I approve production cron setup.

Rules:
- Do not expose CRON_SECRET.
- Do not trigger destructive cleanup manually unless approved.
- Do not delete production data outside the documented policy.
- Verify cron config after deployment.

Output:
- cron configuration summary
- endpoint protection confirmation
- next scheduled run
- manual verification instructions
```

### Akceptacja

```text
[ ] Cron jest aktywny i chroniony.
[ ] Retention policy nie usuwa danych poza zakresem.
```

---

# 3. Prompty awaryjne

## 3.1. Gdy lint fix robi za duży refaktor

```text
Stop implementation.

Review the last diff for excessive refactoring.

Rules:
- Do not write code.
- Identify files changed outside the mission scope.
- Identify behavior changes unrelated to lint fixes.
- Recommend the smallest rollback.
- Do not revert until I approve.

Output:
- out-of-scope changes
- risky changes
- recommended rollback plan
```

## 3.2. Gdy Phase 2 miesza się z MVP

```text
Stop implementation.

Review whether Phase 2 auth/history/billing scope leaked into MVP closure.

Check:
- /login
- /account
- /history
- pricing
- Stripe
- billing env vars
- user profile requirements
- navigation and CTAs

Rules:
- Do not write code.
- Identify what belongs to MVP vs Phase 2.
- Recommend retain-gated or move-to-staging decision.

Output:
- MVP items
- Phase 2 items
- risks
- recommended action
```

## 3.3. Gdy produkcyjne sekrety pojawiły się w plikach

```text
Stop and perform a secret exposure audit.

Check:
- source files
- .env files
- docs
- tests
- logs
- client bundle references if practical

Rules:
- Do not print discovered secret values.
- Redact all findings.
- If a real secret was committed, mark as incident requiring key rotation.
- Do not commit changes until remediation is approved.

Output:
- affected files
- risk level
- remediation plan
- whether key rotation is required
```

## 3.4. Gdy Supabase production migration jest ryzykowna

```text
Stop production migration.

Review migration risk before continuing.

Check:
- migration order
- destructive statements
- seed idempotency
- existing tables
- RLS/grants
- backup status
- rollback plan

Rules:
- Do not continue migration.
- Do not run destructive commands.
- Return go/no-go.

Output:
- risks
- blockers
- safe migration plan
- rollback plan
```

---

# 4. Rekomendowana kolejność wykonania

```text
Code quality:
C0 Reproduce current audit state
C1 Fix Supabase any type debt
C2 Fix JSX escaping in legal pages
C3 Remove unused imports and variables
C4 Final lint zero pass

Scope:
S0 Review Phase 2 files without changing code
S1A Retain Phase 2 files safely
OR
S1B Move Phase 2 files to staging

Infrastructure:
I0 Supabase production migration plan
I1 Supabase local/preview migration verification
I2 Vercel environment readiness checklist
I3 Retention cron readiness

Legal/compliance:
L0 Legal draft cleanup for beta
L1 Vendor and GDPR beta checklist

Closure:
R0 Full MVP closure review
R1 Create public beta runbook
R2 Update mission roadmap after actual state

Optional production execution gates:
P0 Apply Supabase migrations to production
P1 Configure Vercel production env and preview smoke
P2 Configure production cron
```

---

## 5. Najważniejsza decyzja teraz

[Wniosek] Najpierw wykonaj **C0–C4**. Dopóki lint nie jest czysty, nie ma sensu ruszać produkcyjnych bramek.

Potem wykonaj **S0** i wybierz:

```text
Option A: zostaw /login, /account, /history jako czysty, niepromowany Phase 2 preview/staging.
Option B: przenieś je poza aktywne Next.js routes do staging-phase2.
```

Dopiero po tym przejdź do infrastruktury Vercel/Supabase/cron.

---

## 6. Definicja “MVP Closed & Beta Ready”

```text
[ ] Zero lint errors.
[ ] Zero krytycznych warnings albo jawnie zaakceptowane warnings.
[ ] Test suite przechodzi.
[ ] Production build przechodzi.
[ ] Scope creep ma decyzję i nie blokuje MVP.
[ ] Supabase migrations są zweryfikowane poza produkcją.
[ ] Vercel env readiness jest opisane.
[ ] Cron readiness jest opisane.
[ ] Legal drafts są spójne i oznaczone jako draft/review.
[ ] Final closure review daje go dla bety.
[ ] Paid roadmap nadal jest zablokowana do czasu danych z bety.
```

