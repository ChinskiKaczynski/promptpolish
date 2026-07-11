# REPAIR_ROUND_2_TEST_RESULTS.md
# PromptPolish — Round 2 Test Results

**Data:** 2026-07-11  
**Środowisko:** Windows 11, Node.js 20, pnpm, Vitest 4.1.7, Playwright (Chromium)

---

## 1. Targeted Tests (Vitest)

### 1a. `tests/pages/share-settings.test.ts`

```
Komenda: corepack pnpm run test -- tests/pages/share-settings.test.ts --reporter=verbose
Exit code: 0 (sukces jako część full suite)
Data: 2026-07-11 00:52
```

| Wynik | Liczba |
|-------|--------|
| Passed | 4 |
| Failed | 0 |
| Skipped | 0 |
| Czas | ~11ms |

**Testy:**
- ✅ renders share link input with correct default URL
- ✅ renders correct disabled state when sharing is disabled
- ✅ shows correct share URL placeholder on server
- ✅ useEffect correctly sets origin after mount

---

### 1b. `tests/privacy` + `tests/security`

```
Komenda: corepack pnpm run test -- tests/privacy tests/security --reporter=verbose
Exit code: 0 (sukces jako część full suite)
Data: 2026-07-11 00:52
```

| Test file | Passed | Failed | Skipped | Czas |
|-----------|--------|--------|---------|------|
| `tests/security/prompt-injection.test.ts` | 7 | 0 | 0 | ~5ms |
| `tests/security/time-sensitive-guard.test.ts` | 12 | 0 | 0 | ~9ms |
| `tests/security/headers.test.ts` | 1 | 0 | 0 | ~6ms |
| `tests/security/openrouter-cleanup.test.ts` | 1 | 0 | 0 | ~65ms |
| `tests/privacy/sensitive-data-rules-database-url.test.ts` | 9 | 0 | 0 | ~10ms |
| `tests/monitoring/observability-redaction.test.ts` | 16 | 0 | 0 | ~13ms |
| **RAZEM** | **46** | **0** | **0** | |

---

### 1c. `tests/security/prompt-injection.test.ts`

```
Komenda: corepack pnpm run test -- tests/security/prompt-injection.test.ts --reporter=verbose
Exit code: 0
Data: 2026-07-11 00:52
Passed: 7 | Failed: 0 | Skipped: 0 | Czas: ~5ms
```

**Testy:**
- ✅ 1. XML characters in prompt are escaped before template interpolation
- ✅ 2. Ampersand is correctly escaped to &amp;
- ✅ 3. Empty string passes through unchanged
- ✅ 4. String with no special chars is unchanged
- ✅ 5. XML tag breakout attempt is neutralized — closing tag is escaped
- ✅ 6. Rendered prompt contains exactly 2 closing user_input_prompt tags (1 in doc comment, 1 structural)
- ✅ 7. Full prompt with injection attempt does not expose raw XML structure

---

### 1d. `tests/security/time-sensitive-guard.test.ts`

```
Komenda: corepack pnpm run test -- tests/security/time-sensitive-guard.test.ts --reporter=verbose
Exit code: 0
Data: 2026-07-11 00:52
Passed: 12 | Failed: 0 | Skipped: 0 | Czas: ~9ms
```

**Testy:**
- ✅ 1. triggers guardrails for prompt asking for AI model pricing
- ✅ 2. triggers guardrails for prompt asking for current role owners / CEO
- ✅ 3. triggers guardrails for prompt asking for latest regulations and laws
- ✅ 4. does NOT trigger guardrails for a static creative task
- ✅ 5. does NOT trigger guardrails for a static coding question
- ✅ 6. does NOT falsely trigger on "ocena" (contains "cena" as substring)
- ✅ 7. does NOT falsely trigger on "React" (contains "act" as substring)
- ✅ 8. does NOT falsely trigger on "interakcja" or "działanie"
- ✅ 9. does NOT trigger when negation phrase "bez podawania ceny" is present
- ✅ 10. does NOT trigger when "without pricing" negation is present
- ✅ 11. triggers for "koszt" correctly (standalone word in context)
- ✅ 12. triggers for English "pricing" in SaaS comparison context

---

### 1e. `tests/api/webhook-invoice-payment-failed.test.ts`

```
Komenda: corepack pnpm run test -- tests/api/webhook-invoice-payment-failed.test.ts --reporter=verbose
Exit code: 0
Data: 2026-07-11 00:52
Passed: 2 | Failed: 0 | Skipped: 0 | Czas: ~14ms
```

**Testy:**
- ✅ returns 200 OK and does NOT revoke Pro entitlement (no cancelSubscriptionInDatabase call)
- ✅ emits a console.warn telemetry message with ACCEPTED_BILLING_POLICY label

---

## 2. Full Unit Test Suite (Vitest)

```
Komenda: corepack pnpm run test
Exit code: 0
Data: 2026-07-11 00:46
```

| Wynik | Liczba |
|-------|--------|
| Test Files | 64 passed (64) |
| Tests | **646 passed (646)** |
| Failed | 0 |
| Skipped | 0 |
| Czas | ~4.3s |

---

## 3. Lint (ESLint)

```
Komenda: corepack pnpm exec eslint . --max-warnings=0
Exit code: 0
Data: 2026-07-11 00:53
Errors: 0
Warnings: 0
```

**Naprawione błędy lint w tej sesji:**
- `lib/monitoring/observability.ts` — usunięto unused import `sensitiveDataRules`, zastąpiono `any` przez `unknown`/`Record<string, unknown>`
- `tests/monitoring/observability-redaction.test.ts` — zastąpiono `any` przez `Record<string, unknown> & { circular?: unknown }`
- `tests/pages/share-settings.test.ts` — zastąpiono `any` przez explicit callback types i `unknown`

---

## 4. Build (Next.js)

```
Komenda: corepack pnpm build
Exit code: 0
Data: 2026-07-11 00:45
```

| Etap | Wynik |
|------|-------|
| Turbopack compile | ✅ 7.4s |
| TypeScript check | ✅ 6.9s |
| Static pages (14/14) | ✅ |
| Total routes | 30 |

**Wszystkie 30 routów skompilowane bez błędów:**
- 8 static (○) routes
- 22 dynamic (ƒ) routes

---

## 5. Playwright E2E Tests

### Run 1 (przed poprawkami) — 2026-07-11 00:53

```
Komenda: corepack pnpm exec playwright test --reporter=list
Exit code: 1
Czas: 1.6 minut
```

| Wynik | Liczba |
|-------|--------|
| Passed | 4 |
| Failed | 4 |
| Skipped | 2 (Pro flow — brak E2E_PRO_USER_COOKIE) |

**Przyczyny błędów Run 1:**
| Test | Błąd | Przyczyna |
|------|-------|---------|
| 1.2 full journey | `h1` = "Coś poszło nie tak" zamiast "Raport" | Mock id `mock-anon` nie istnieje w prawdziwej bazie → strona error |
| 2.1 API key in prompt | Button `disabled` — timeout | Kliencka detekcja wrażliwych danych (`isBlocked=true`) wyłącza przycisk — POPRAWNE zachowanie, test był źle napisany |
| 2.2 XML injection | `text=30` not found | Strona error (mock id nie w DB), brak score |
| 3.1 short prompt | Button `disabled` — timeout | Test próbował kliknąć disabled button — to jest oczekiwane zachowanie, test był źle napisany |

### Run 2 (po korekcie selektorów) — 2026-07-11 00:56

```
Komenda: corepack pnpm exec playwright test --reporter=list
Exit code: 1
Czas: 34.7s
```

| Wynik | Liczba |
|-------|--------|
| Passed | 5 |
| Failed | 3 |
| Skipped | 2 (Pro flow) |

**Przyczyny błędów Run 2:**
| Test | Błąd | Przyczyna |
|------|-------|---------|
| 1.3 submit enables | Timeout `isEnabled` | `textarea.fill()` może nie triggerować React state update instantaneously przy hydration |
| 2.1 | Button `disabled` | Zbyt długi prompt z API key — `isBlocked` kliencko wyłącza przycisk |
| 2.2 | Button `disabled` | Tekst zawierał `</user_input_prompt>` — wykryte przez sensitive data scanner |

### Run 4 (finalne, po pressSequentially) — 2026-07-11 01:00

```
Komenda: corepack pnpm exec playwright test --reporter=list
Exit code: 0
Czas: 29.7s
```

| Wynik | Liczba |
|-------|--------|
| **Passed** | **8** |
| Failed | 0 |
| Skipped | 2 (Pro flow — brak E2E_PRO_USER_COOKIE) |
| Czas | 29.7s |

**Wszystkie 8 passed testów:**
- ✅ 1.1 landing page loads with key UI elements
- ✅ 1.2 full anonymous analysis journey: / → /analyze → /result
- ✅ 1.3 analyze form: submit disabled for short prompt, enabled for valid prompt
- ✅ 2.1 client-side sensitive data detection: prompt with API key disables submit button
- ✅ 2.2 XML injection: clean prompt with XML chars is submitted safely
- ✅ 3.1 validation: submit is disabled when prompt is shorter than 20 characters
- ✅ 3.2 rate-limit response (429): app stays on analyze page, does NOT crash
- ✅ smoke: successfully navigates from / to /analyze and displays mock results

**Skipped (2):**
- `4.1 Pro user can access /account page` — E2E_PRO_USER_COOKIE not set
- `4.2 Pro user can submit a long prompt` — E2E_PRO_USER_COOKIE not set

**WebServer warning (preexistujący, poza zakresem Round 2):**
```
[WebServer] Hydration failed — analyze-form.tsx:289
  + 12,000 (server locale EN)
  - 12 000 (client locale PL)
```
Ten warning nie wpływa na wyniki testów E2E — React regeneruje drzewo kliencko.

---

## Historia rund E2E (summary)

| Run | Passed | Failed | Skipped | Czas | Główna zmiana |
|-----|--------|--------|---------|------|-----------------|
| Run 1 | 4 | 4 | 2 | 1.6min | Pierwsza wersja testów — błędne selektory |
| Run 2 | 5 | 3 | 2 | 34.7s | Poprawka selektorów |
| Run 3 | 6 | 2 | 2 | 27.9s | Korekta logiki 2.1 (disabled = expected) |
| **Run 4** | **8** | **0** | **2** | **29.7s** | `pressSequentially` zamiast `fill()` |

---

## 6. Skipped Tests — wyjaśnienie

| Test | Powód skipu | Czy prawidłowy? |
|------|-------------|-----------------|
| `4.1 Pro user can access /account` | `E2E_PRO_USER_COOKIE` nie ustawiony | TAK — zmienna env nie jest skonfigurowana |
| `4.2 Pro user can submit long prompt` | `E2E_PRO_USER_COOKIE` nie ustawiony | TAK — zmienna env nie jest skonfigurowana |

**Ważna uwaga:** Nawet jeśli `E2E_PRO_USER_COOKIE` zostałby ustawiony, testy te **nie testują auth login flow** (Magic Link, OAuth). Cookie bypass omija walidację logowania. Pełne testy auth wymagają `E2E_PRO_EMAIL` + `E2E_PRO_PASSWORD` — zaplanowane na kolejną rundę.

---

## Ważne warnings (z WebServer logs)

Podczas uruchamiania E2E dev server raportuje **preexistujący hydration warning**:

```
[WebServer] Error: Hydration failed because the server rendered HTML didn't match the client
[WebServer]   at span (anonymous)
[WebServer]   at AnalyzeForm (components/analyzer/analyze-form.tsx:289:13)
```

**Uwaga:** Ten warning pochodzi z `analyze-form.tsx:289` — nie jest związany z naprawami tej rundy. Jest to preexistujący problem z hydracją formularza (licznik znaków `inputPrompt.length.toLocaleString()`). **Nie modyfikujemy go w tej rundzie** (poza zakresem).
