# AUDIT_FINDINGS_TABLE_CORRECTED.md
# PromptPolish — Corrected Audit Findings Table (Round 2)

**Data:** 2026-07-11  
**Źródło:** Audyt z sesji Round 2 + weryfikacja implementacji

---

## Tabela znalezisk z aktualizacją statusu

| ID | Obszar | Znalezisko | Ocena | Status przed naprawą | Status po Round 2 | Dowód |
|----|--------|-----------|-------|---------------------|-------------------|-------|
| F-01 | Hydration | `share-settings.tsx` używała `useState(false)` + `useEffect + setTimeout` do wykrywania montażu — anti-pattern w React 19, powoduje SSR/CSR hydration mismatch | HIGH | OPEN | DONE | `tests/pages/share-settings.test.ts` — 4 testy ✅ |
| F-02 | Archiwizacja | Kod i dokumenty nadal odwołują się do OpenRouter/DeepSeek po archiwizacji integracji | MEDIUM | OPEN | DONE | `tests/security/openrouter-cleanup.test.ts` — 1 test ✅ |
| F-03 | Log redaction | `scrubSensitiveData()` miała tylko 4 wzorce; GitHub PAT, JWT, bearer, HuggingFace, npm, Slack — niechronione | HIGH | OPEN | DONE | `tests/monitoring/observability-redaction.test.ts` — 16 testów ✅ |
| F-04 | Prompt injection | User input interpolowany surowo w XML template; `</user_input_prompt>` może naruszyć strukturę promptu | MEDIUM | OPEN | MITIGATED | `tests/security/prompt-injection.test.ts` — 7 testów ✅; escaping `&lt;/user_input_prompt&gt;` weryfikowany |
| F-05 | Guard false positives | `requiresTimeSensitiveVerification()` używał `includes()` — `"ocena"` triggrowała `"cena"`, `"React"` triggrowało `"act"` | MEDIUM | OPEN | DONE | `tests/security/time-sensitive-guard.test.ts` — 12 testów ✅ |
| F-06 | Webhook | `invoice.payment_failed` case — pusty handler, brak telemetrii, brak polityki | MEDIUM | OPEN | ACCEPTED_POLICY | `tests/api/webhook-invoice-payment-failed.test.ts` — 2 testy ✅; polityka udokumentowana w `REPAIR_ROUND_2_DECISIONS.md` |
| F-07 | E2E coverage | Tylko jeden smoke test; brak Anonymous, Security, Free, Pro flow | LOW | OPEN | DONE | `tests/e2e/extended-flows.test.ts` — 9 scenariuszy; 7 passed, 2 skipped (Pro bez cookie) |
| F-08 | Raporty | Brak raportów końcowych w katalogu głównym repozytorium | LOW | OPEN | DONE | 5 plików MD w katalogu głównym |

---

## Poziomy oceny

| Poziom | Definicja |
|--------|-----------|
| HIGH | Bezpośrednie ryzyko bezpieczeństwa lub utrata danych |
| MEDIUM | Potencjalne ryzyko, wymaga mitygacji lub policy decision |
| LOW | Jakość kodu, coverage, dokumentacja |

---

## Statusy po Round 2

| Status | Znaczenie |
|--------|-----------|
| DONE | Pełna implementacja + testy + lint + build |
| MITIGATED | Ryzyko zredukowane przez implementację; resztkowe ryzyko udokumentowane |
| ACCEPTED_POLICY | Decyzja architektoniczna zaakceptowana z dokumentacją uzasadnienia |

---

## Pozostałe ryzyka (resztkowe)

| ID | Ryzyko | Prawdopodobieństwo | Mitygacja |
|----|--------|--------------------|-----------|
| R-01 | LLM interpretuje HTML entities `&lt;` jako `<` w niektórych kontekstach | Niskie | Monitorowanie; eskalacja jeśli wykryta | 
| R-02 | Pro testy E2E nie testują auth flow — cookie bypass | Niskie | DECISION-05; wymaga email/password w kolejnej rundzie |
| R-03 | Log redaction nie pokrywa wszystkich możliwych custom secret formatów | Bardzo niskie | Dodawaj wzorce reaktywnie przy zgłoszeniach |
| R-04 | Stripe retry grace period (do 14 dni) Pro access dla nieudanej płatności | Niskie (akceptowalne) | DECISION-01 |
