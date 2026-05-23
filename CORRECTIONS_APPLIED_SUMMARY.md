# Corrected files package — PromptPolish

**Generated:** 2026-05-23  
**Input corrections source:** `Wklejony tekst.txt`

## Files included

1. `prompt_audit_mvp_plan_v1.2.md`
2. `paid-saas-roadmap_v1.1.md`
3. `GEMINI_MISSIONS_FROM_ZERO_TO_V1_v1.1.md`

## Applied critical corrections

## Poprawki krytyczne do dodania

1. POST /api/share/disable jako obowiązkowy element MVP.
2. Realny mechanizm retencji danych, np. scheduled cleanup.
3. Smoke test structured output na pełnym analysisSchema, nie tylko mini schema.
4. UX warning: anonimowy wynik zależy od cookie i może być niedostępny po zmianie przeglądarki/czyszczeniu cookies.
5. Cost benchmark przed betą: token usage, koszt analizy, provider errors, retry count, invalid schema count.
6. Jasna decyzja Gemini: generateContent przez AI SDK w MVP; Interactions API dopiero przy agentic/background workflows.
7. Bundle leak test: brak sekretów w client bundle, sourcemapach, response body i logach.
8. Share privacy tests: publiczny share nie pokazuje owner_anonymous_id, user_id, internal UUID, debug fields ani sensitive findings.
9. Static/code review check: prywatne prompt_analyses nie są czytane client-side.
10. Dokument prawny jako draft: GDPR/cookies/vendor processing do review przed publicznym ruchem z UE.

## Zakres MVP po korekcie

Zachować:
- landing,
- /analyze,
- /result/[id] private owner-only,
- /share/[token] opt-in,
- /api/analyze,
- scoring backendowy,
- sensitive-data detector UI + API,
- Supabase model_profiles / prompt_analyses / usage_events / feedback_events,
- Gemini przez AI SDK,
- copy event,
- feedback,
- privacy / terms draft,
- AI eval fixtures,
- launch checklist.

Wyrzucić z MVP:
- auth,
- billing,
- Stripe,
- pricing page,
- dashboard,
- history,
- prompt library,
- marketplace,
- folders/tags,
- teams/workspaces,
- multi-model execution,
- batch audit,
- exports PDF/Markdown.

Dodać dopiero po danych z bety:
- auth,
- history,
- entitlements,
- exports,
- pricing,
- Stripe.

## Threat model — top ryzyka

| Ryzyko | Wpływ | Prawdopodobieństwo | Mitigacja |
|---|---:|---:|---|
| Wyciek sekretu użytkownika do AI providera | Krytyczny | Średnie | UI + API sensitive-data detector, high-risk block, brak raw prompt save. |
| Publiczny dostęp do prywatnego wyniku | Krytyczny | Średnie | /result owner-only, /share token only opt-in, server-side checks. |
| Supabase secret w client bundle | Krytyczny | Niskie/średnie | env boundaries, bundle scan, brak importu admin client w client components. |
| Halucynacje o modelach | Wysoki | Średnie | model_profiles z verification_status, source_checked_at, stale warning. |
| Structured output valid JSON, ale słaba jakość | Średni | Wysokie | semantic validation, fixtures, manual AI eval, backend score. |
| Kosztowy spam anonimowy | Wysoki | Średnie | daily limit, max chars, one AI request, rate limiting, provider failure handling. |
| Cookie-only result access frustruje użytkownika | Średni | Średnie | jasny UX warning, share opt-in, później auth/history. |
| Scope creep przez agenta | Średni | Wysokie | AGENTS.md, małe misje, review, no auto commit/deploy. |

## Decision ledger

| Decyzja | Status | Czy zmieniać? |
|---|---|---|
| Anonymous-first MVP | Zatwierdzone | Nie. |
| Jeden flow: prompt → analiza → score → improved prompt | Zatwierdzone | Nie. |
| Brak auth w MVP | Zatwierdzone | Nie przed betą. |
| Brak Stripe/pricing w MVP | Zatwierdzone | Nie przed danymi. |
| Gemini jako główny provider | Zatwierdzone | Tak, ale tylko po smoke testach. |
| AI SDK structured output | Zatwierdzone | Tak, zgodnie z aktualnym wzorcem. |
| Interactions API poza MVP | Zatwierdzone | Nie używać w MVP. |
| Backend liczy final score | Zatwierdzone | Nie. |
| /share/[token] w MVP | Warunkowo zatwierdzone | Tak, ale disable endpoint obowiązkowy. |
| Retencja 30/90/180 dni | Do uzupełnienia | Dodać realny cleanup. |
| Paid roadmap | Po MVP | Nie startować bez usage data. |

## Kolejność wykonania

### MVP

1. Mission 00 — environment smoke test.
2. Mission 01 — clean Next.js project.
3. Mission 02 — docs/control files.
4. Mission 03 — review docs before code.
5. Mission 04–07 — UI mock + privacy/terms.
6. Mission 08–10 — scoring + sensitive-data detector + UI preflight.
7. Mission 11–13 — Supabase schema + server-only DAL + anonymous cookie.
8. Mission 14–16 — AI schema + Gemini docs/smoke + Gemini client.
9. Mission 17–22 — real API, result access, share, limits, feedback/copy.
10. New Mission 22A — mandatory disable share + tests.
11. New Mission 22B — retention cleanup job.
12. Mission 23–28 — production readiness, tests, eval, launch review, preview checklist.

### Beta

13. Mission 29 — beta instrumentation.
14. Mission 30 — paid readiness gate.

### Paid SaaS

15. Missions 31+ tylko po pozytywnych danych: copy rate, powroty, feedback, koszt, share usage, limit reached.

## Nowe misje do dopisania

### Mission 22A — Mandatory share disable and privacy tests

Implement mandatory share link disabling and public share privacy tests.

Requirements:
- POST /api/share/disable is required, not optional.
- Owner can disable a previously generated share link.
- Disabled share returns 404 or safe 403.
- Public share page never exposes owner_anonymous_id, user_id, internal UUID, debug fields, provider metadata or sensitive findings.
- Log share_link_disabled event.

Validation:
- owner can disable share.
- non-owner cannot disable share.
- disabled token does not work.
- public share snapshot contains no internal metadata.
- pnpm test.
- pnpm build.

### Mission 22B — Retention cleanup

Implement retention cleanup for MVP data.

Requirements:
- anonymous analyses expire after configured retention period.
- usage_events expire after configured retention period.
- feedback_events expire after configured retention period.
- high-risk blocked prompts are never stored raw.
- cleanup can be run manually and scheduled.
- dry-run mode exists if practical.

Validation:
- old records are deleted/anonymized according to policy.
- fresh records are untouched.
- cleanup does not delete shared active records unless policy says so.
- pnpm test.
- migration/check script documented.

### Mission 23A — Secret and bundle exposure audit

Check that server secrets are not exposed.

Requirements:
- scan source files.
- scan built output where practical.
- verify GOOGLE_GENERATIVE_AI_API_KEY, SUPABASE_SECRET_KEY, Stripe future secrets are server-only.
- verify error responses do not include env values.
- verify logs redact sensitive values.

Validation:
- pnpm build.
- grep/scanner result documented.
- no secrets in client bundle.

### Mission 26A — Full-schema Gemini smoke test

Run Gemini structured output smoke test using the production-like analysisSchema.

Requirements:
- use same schema shape as /api/analyze.
- test PL and EN prompt.
- test weak prompt and strong prompt.
- record invalid output rate.
- record model_id_used.
- do not fake success if API key is missing.

Validation:
- docs/gemini-integration-decision.md updated.
- docs/evaluation-results.md updated.

## Najważniejszy prompt do wklejenia jako pierwszy

Read AGENTS.md, docs/product-mvp.md, docs/architecture.md, docs/model-profile-policy.md, docs/ai-safety.md, docs/gemini-integration-decision.md, docs/supabase-access-policy.md and .antigravity/rules/project-rules.md.

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
- Treat POST /api/share/disable, retention cleanup, full-schema Gemini smoke test and bundle secret exposure audit as required additions before public beta.

Acceptance criteria:
- No features outside MVP.
- Keep opt-in public /share/[token] in MVP.
- Each step has a clear output.
- Each step has validation commands.
- Each risky change requires human review.
- AI SDK integration must use current structured output pattern unless explicitly pinned otherwise.
- Gemini API changelog must be checked before provider implementation.
- Private Supabase reads must be server-only.
- Sensitive-data detection must be included before sending prompts to provider.

## Finalny werdykt

[Wniosek] To jest dobry plan na mały, produkcyjny SaaS MVP. Po dodaniu wskazanych misji kontrolnych będzie wystarczająco mocny, żeby go wykonywać etapami w Antigravity bez dużego ryzyka scope creepu.

Najbliższy praktyczny krok: wykonaj Mission 00–03, potem zatrzymaj się na review zanim powstanie jakikolwiek kod funkcjonalny.

## Notes

- Files are complete Markdown documents, not diffs.
- Original scope remains: MVP anonymous-first, no auth, no billing, no Stripe, no pricing, no dashboard/history/library/team/workspace/batch/export in MVP.
- New controls required before public beta:
  - mandatory share disable,
  - retention cleanup,
  - full-schema Gemini smoke test,
  - secret/bundle exposure audit,
  - cost benchmark,
  - share privacy tests,
  - static check for client-side private `prompt_analyses` reads,
  - legal readiness draft for GDPR/cookies/vendor processing.
