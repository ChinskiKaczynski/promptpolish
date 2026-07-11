# REPAIR_ROUND_2_STATE.md
# PromptPolish — Round 2 Repair State

**Data:** 2026-07-11  
**Zakres:** 8 zadań z audytu Round 2  
**Środowisko:** Windows 11, Node.js 20, pnpm, Vitest, Playwright (Chromium)

---

## Stan zadań

| Zadanie | Status | Zmienione pliki | Testy | Pozostałe ryzyko |
|---------|--------|-----------------|-------|------------------|
| 1 — Hydration fix (`share-settings.tsx`) | DONE | `components/result/share-settings.tsx`, `tests/pages/share-settings.test.ts` | 4 zaktualizowane | Brak — `useSyncExternalStore` eliminuje hydration mismatch |
| 2 — Fallback docs & OpenRouter cleanup | DONE | `docs/provider-fallback.md`, `docs/vercel-runtime-checklist.md`, `docs/calibration-report.md`, `.env.example`, `tests/security/openrouter-cleanup.test.ts` | 1 nowy (static scan) | Brak — żadne runtime paths nie odwołują się do OpenRouter |
| 3 — Unified log redaction | DONE | `lib/monitoring/observability.ts`, `lib/privacy/sensitive-data-rules.ts`, `tests/monitoring/observability-redaction.test.ts` | 16 nowych | Niskie: regex nie pokrywa wszystkich custom secret formatów, ale pokrywa wszystkie znane typy |
| 4 — XML escaping & prompt injection | MITIGATED | `lib/ai/prompts.ts`, `tests/security/prompt-injection.test.ts` | 7 (w tym 2 nowe breakout scenarios) | Niskie: LLM może nadal interpretować HTML entities — eskalacja tylko przy zmianie parsera |
| 5 — Time-sensitive guard false positives | DONE | `lib/ai/prompts.ts`, `tests/security/time-sensitive-guard.test.ts` | 12 (7 nowych, w tym 4 false-positive regression fixtures) | Bardzo niskie: word-boundary regex testowane dla 12 przypadków PL/EN |
| 6 — `invoice.payment_failed` webhook | ACCEPTED_POLICY | `app/api/webhooks/stripe/route.ts`, `tests/api/webhook-invoice-payment-failed.test.ts` | 2 nowe | Niskie: Stripe retry lifecycle obsługuje grace period; decyzja udokumentowana |
| 7 — Playwright E2E suite expansion | DONE | `tests/e2e/extended-flows.test.ts` | 9 scenariuszy (patrz wyniki E2E) | Pro testy wymagają `E2E_PRO_USER_COOKIE` — pomijane bez niego |
| 8 — Final reports | DONE | `REPAIR_ROUND_2_STATE.md`, `REPAIR_ROUND_2_DECISIONS.md`, `REPAIR_ROUND_2_TEST_RESULTS.md`, `REPAIR_ROUND_2_REPORT.md`, `AUDIT_FINDINGS_TABLE_CORRECTED.md` | — | Brak |

---

## Dozwolone statusy użyte w tym dokumencie

- `DONE` — Implementacja i testy kompletne, lint clean, build OK
- `MITIGATED` — Ryzyko zredukowane przez implementację, ale nie wyeliminowane całkowicie (udokumentowane)
- `ACCEPTED_POLICY` — Ryzyko zaakceptowane przez decyzję architektoniczną z dokumentacją
- `PARTIAL` — Implementacja częściowa (nie użyty w tej rundzie)
- `BLOCKED` — Zablokowane zewnętrznymi zależnościami (nie użyty w tej rundzie)
- `DEFERRED` — Odłożone na kolejną rundę (nie użyty w tej rundzie)

---

## Ograniczenia środowiskowe

| Ograniczenie | Powód |
|-------------|-------|
| Brak deploy | Poza zakresem: wyłącznie lokalne zmiany |
| Brak commit/push | Poza zakresem: agent nie pushuje |
| Brak realnych płatności | Stripe Sandbox — tylko testowe eventy |
| Brak migracji produkcyjnych | Wymagają dostępu do Supabase dashboard |
| E2E Pro testy pomijane | Brak `E2E_PRO_USER_COOKIE` w środowisku CI/lokalnym |
