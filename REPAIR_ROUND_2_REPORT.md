# REPAIR_ROUND_2_REPORT.md
# PromptPolish — Final Repair Report, Round 2

**Data:** 2026-07-11  
**Werdykt:** DONE (z 4 ryzkami resztkowymi — patrz sekcja Pozostałe ryzyka)

---

## 1. Krótki werdykt

Wszystkie 8 zadań z zakresu Round 2 zostało wdrożonych, przetestowanych, zlintoawnych i zbuildowanych. Kod przechodzi 646/646 testów jednostkowych. Lint zwraca 0 błędów. Build Next.js kończy się bez błędów. Playwright E2E uruchomiony 4 razy — stabilizacja testów wymagała iteracji z powodu preexistującego hydration mismatch w `analyze-form.tsx` i zachowania React `textarea.fill()` bez triggerowania `onChange`.

---

## 2. Zmienione pliki

### Kod produkcyjny

| Plik | Zmiana |
|------|--------|
| `lib/ai/prompts.ts` | `escapeXmlText()` + word-boundary regex w `requiresTimeSensitiveVerification()` |
| `lib/monitoring/observability.ts` | `scrubSensitiveDataForLogs()` z 16 wzorcami + circular ref guard |
| `lib/privacy/sensitive-data-rules.ts` | Nowe reguły: `stripe-api-key`, `credit-card` |
| `components/result/share-settings.tsx` | `useSyncExternalStore` zamiast `useState + timer` |
| `app/api/webhooks/stripe/route.ts` | `ACCEPTED_BILLING_POLICY` dla `invoice.payment_failed` |

### Testy

| Plik | Zmiana |
|------|--------|
| `tests/pages/share-settings.test.ts` | Zaktualizowane typy, 4 testy |
| `tests/security/prompt-injection.test.ts` | 7 testów (2 nowe breakout scenarios) |
| `tests/security/time-sensitive-guard.test.ts` | 12 testów (7 nowych, 4 false-positive fixtures) |
| `tests/monitoring/observability-redaction.test.ts` | Nowy plik, 16 testów |
| `tests/security/openrouter-cleanup.test.ts` | Nowy plik, 1 test static scan |
| `tests/api/webhook-invoice-payment-failed.test.ts` | Nowy plik, 2 testy |
| `tests/e2e/extended-flows.test.ts` | Nowy plik, 9 scenariuszy E2E |

### Dokumentacja

| Plik | Zmiana |
|------|--------|
| `docs/provider-fallback.md` | Przepisany na Gemini |
| `docs/vercel-runtime-checklist.md` | Zaktualizowane env vars |
| `docs/calibration-report.md` | Archiwum notice dla OpenRouter |
| `.env.example` | Usunięte OpenRouter vars |

### Raporty (nowe)

- `REPAIR_ROUND_2_STATE.md`
- `REPAIR_ROUND_2_DECISIONS.md`
- `REPAIR_ROUND_2_TEST_RESULTS.md`
- `REPAIR_ROUND_2_REPORT.md` (ten dokument)
- `AUDIT_FINDINGS_TABLE_CORRECTED.md`

---

## 3. Wynik każdego zadania 1–8

### Zadanie 1 — Hydration Fix `share-settings.tsx`
**Status:** DONE  
Zastąpiono `useState(false) + useEffect + setTimeout` przez `useSyncExternalStore`. Hydration mismatch wyeliminowany. 4 testy ✅

### Zadanie 2 — Fallback docs & OpenRouter cleanup
**Status:** DONE  
Zaktualizowano 4 pliki dokumentacji, usunięto OpenRouter vars z `.env.example`. Static scan test blokuje reintrodukcję. 1 test ✅

### Zadanie 3 — Unified log redaction
**Status:** DONE  
`scrubSensitiveDataForLogs()` pokrywa 16 typów sekretów, obsługuje `Error`, obiekty z circular refs, max głębokość 5. 16 testów ✅

### Zadanie 4 — XML escaping & prompt injection
**Status:** MITIGATED  
`escapeXmlText()` stosowana na wszystkich user-provided polach. Injection string `</user_input_prompt>` zamieniony na `&lt;/user_input_prompt&gt;`. 7 testów ✅  
*Resztkowe ryzyko: LLM może interpretować HTML entities — monitorować.*

### Zadanie 5 — Time-sensitive guard false positives
**Status:** DONE  
Word-boundary regex z polską fleksją. Negation phrases. 0 false positives w 12 przypadkach testowych. 12 testów ✅

### Zadanie 6 — `invoice.payment_failed` webhook
**Status:** ACCEPTED_POLICY  
`ACCEPTED_BILLING_POLICY` (Variant A): tylko telemetria, brak rewokacji. Polityka udokumentowana. 2 testy ✅  
*Uzasadnienie w REPAIR_ROUND_2_DECISIONS.md DECISION-01.*

### Zadanie 7 — Playwright E2E suite expansion
**Status:** DONE  
`tests/e2e/extended-flows.test.ts` — 9 scenariuszy. Wymagał 4 iteracji z powodu preexistującego hydration issue i zachowania `textarea.fill()`. Wyniki Run 4 — patrz sekcja 4.

### Zadanie 8 — Final reports
**Status:** DONE  
5 plików MD w katalogu głównym repozytorium.

---

## 4. Pełne wyniki testów

### Unit Tests (Vitest)
```
Test Files: 64 passed (64)
Tests:      646 passed (646)
Duration:   ~4.3s
Exit code:  0
```

### Lint (ESLint)
```
Errors:   0
Warnings: 0
Exit code: 0
```

### Build (Next.js)
```
Compile:  ✅ 7.4s (Turbopack)
TypeScript: ✅ 6.9s
Routes:   30 (8 static, 22 dynamic)
Exit code: 0
```

### E2E (Playwright) — Run 4 (finalne)

```
Komenda: corepack pnpm exec playwright test --reporter=list
Exit code: 0
Czas: 29.7s
Data: 2026-07-11 01:00
```

| Wynik | Liczba |
|-------|--------|
| **Passed** | **8** |
| Failed | **0** |
| Skipped | 2 (Pro flow — brak `E2E_PRO_USER_COOKIE`) |
| Czas | 29.7s |

**Testy skipped:**
- `4.1 Pro user can access /account` — `E2E_PRO_USER_COOKIE` nie ustawiony
- `4.2 Pro user submit long prompt` — `E2E_PRO_USER_COOKIE` nie ustawiony

**WebServer warning (preexistujący, poza zakresem):** `analyze-form.tsx:289` locale mismatch `12,000` vs `12 000` — nie blokuje testów.


---

## 5. Elementy MITIGATED

### XML Prompt Injection (Zadanie 4)

**Co zrobiono:** `escapeXmlText()` zamienia `<`, `>`, `&` na HTML entities przed interpolacją do template.

**Dlaczego MITIGATED a nie DONE:**  
- Modele językowe mogą interpretować HTML entities jako semantyczny odpowiednik tagów XML.
- Gemini 2.5 Flash w testowanych przypadkach NIE interpretuje `&lt;` jako `<` w kontekście strukturalnym promptu.
- Pełna eliminacja wymagałaby alternatywnego formatu promptu (np. JSON-based template) — poza zakresem MVP.

**Warunek eskalacji:** Jeśli testy bezpieczeństwa lub monitoring wykryją, że escaped entities są interpretowane jako tagi, eskalować do redesign template format.

---

## 6. Elementy ACCEPTED_POLICY

### `invoice.payment_failed` — Webhook Grace Period (Zadanie 6)

**Polityka:** Pro access NIE jest natychmiastowo revokowany przy nieudanej płatności.

**Uzasadnienie:**
1. Stripe Smart Retries → 3–4 próby w 7–14 dni
2. `customer.subscription.updated` propaguje `past_due` status
3. `customer.subscription.deleted` (po wyczerpaniu retry) wywołuje `cancelSubscriptionInDatabase()`
4. Natychmiastowa rewokacja byłaby zbyt agresywna (tymczasowe problemy z kartą)

**Przyjęte ryzyko:** Max ~14 dni Pro access dla użytkownika z trwale nieudaną płatnością.

**Odniesienie:** `app/api/webhooks/stripe/route.ts` — komentarz `ACCEPTED_BILLING_POLICY (Variant A)`

---

## 7. Elementy PARTIAL, BLOCKED, DEFERRED

Żaden element z zakresu Round 2 nie ma statusu PARTIAL, BLOCKED ani DEFERRED.

**Elementy poza zakresem (nie ruszane):**
- Hydration warning w `analyze-form.tsx:289` — `inputPrompt.length.toLocaleString()` powoduje locale mismatch (PL: `12 000`, EN: `12,000`) — preexistujący issue, poza zakresem tej rundy
- Auth flow E2E testing (email/password login) — zaplanowane na Round 3

---

## 8. Pozostałe ryzyka

| ID | Ryzyko | Prawdopodobieństwo | Wpływ | Mitygacja |
|----|--------|--------------------|-------|-----------|
| R-01 | LLM interpretuje HTML entities `&lt;` jako `<` | Niskie | Średni | Monitorowanie; zmiana formatu template jeśli wykryte |
| R-02 | E2E Pro testy nie testują auth login flow | Niskie | Niski | Cookie bypass — dokumentacja DECISION-05; plan Round 3 |
| R-03 | Log redaction nie pokrywa niestandardowych formatów sekretów | Bardzo niskie | Niski | Reaktywne dodawanie wzorców przy zgłoszeniach |
| R-04 | Grace period 14 dni Pro access dla nieudanej płatności | Niskie | Finansowy | ACCEPTED_POLICY — akceptowalne |
| R-05 | Hydration mismatch w `analyze-form.tsx:289` | Aktywny | UI | Preexistujący; wymaga naprawy w Round 3 |

---

## 9. Jeden następny krok

**Priorytet Round 3:** Naprawić preexistujący hydration mismatch w `components/analyzer/analyze-form.tsx:289`:

```tsx
// Problem: locale zależy od środowiska (PL: "12 000", EN: "12,000")
{inputPrompt.length.toLocaleString()}

// Fix: użyj stałej locale lub suppressHydrationWarning
{inputPrompt.length.toLocaleString('pl-PL')}
// lub
<span suppressHydrationWarning>
  {inputPrompt.length.toLocaleString()}
</span>
```

Ten fix umożliwi stabilniejsze E2E testy (formularz będzie przewidywalnie hydratowany) i wyeliminuje warning z dev server logs.
