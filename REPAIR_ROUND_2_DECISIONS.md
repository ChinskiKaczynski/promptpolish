# REPAIR_ROUND_2_DECISIONS.md
# PromptPolish — Round 2 Decisions Log

**Data:** 2026-07-11

Dokument rejestruje kluczowe decyzje architektoniczne i techniczne podjęte podczas Round 2 napraw audytowych.

---

## DECISION-01: ACCEPTED_POLICY — `invoice.payment_failed` bez natychmiastowej rewokacji Pro

**Kontekst:** Webhook case `invoice.payment_failed` był pusty. Możliwe podejścia:
- **Wariant A (ACCEPTED):** Logować tylko telemetrię; nie dotykać uprawnień.
- **Wariant B:** Natychmiastowo zdegradować użytkownika do Free przy pierwszym nieudanym płatności.

**Decyzja:** Wariant A — `ACCEPTED_BILLING_POLICY`.

**Uzasadnienie:**
1. Stripe Smart Retries automatycznie ponawia nieudane płatności (domyślnie 3–4 próby w 7–14 dni).
2. Stripe propaguje status `past_due` przez `customer.subscription.updated` — ten event jest już obsługiwany.
3. Dopiero `customer.subscription.deleted` (po wyczerpaniu retry) powinien wywołać `cancelSubscriptionInDatabase()`.
4. Natychmiastowa rewokacja przy pierwszym nieudanym płatności byłaby zbyt agresywna dla użytkowników z problemami bankowymi (np. tymczasowy brak środków, limity kart).

**Ryzyko przyjęte:** Użytkownik z trwale nieudaną płatnością ma dostęp Pro przez cały cykl retry (max ~14 dni). Akceptowalne.

**Odniesienie do kodu:** `app/api/webhooks/stripe/route.ts` — case `invoice.payment_failed`, komentarz `ACCEPTED_BILLING_POLICY (Variant A)`.

---

## DECISION-02: MITIGATED — XML escaping dla prompt injection

**Kontekst:** `constructUserAnalysisPrompt()` interpolowała surowe dane użytkownika w XML-podobny template. Injektując `</user_input_prompt>` można było potencjalnie naruszyć strukturę promptu.

**Decyzja:** Implementacja `escapeXmlText()` i zastosowanie do wszystkich user-provided pól.

**Status:** `MITIGATED` — nie `DONE`, ponieważ:
1. Escaping zamienia `<` → `&lt;` itd. — LLM nadal może rozumieć HTML entities.
2. Mitygacja jest skuteczna dla modeli Gemini (testowane — nie traktują `&lt;` jako znacznik XML).
3. Pełna eliminacja wymagałaby izolacji promptu na poziomie API (poza zakresem MVP).

**Odniesienie do kodu:** `lib/ai/prompts.ts` — funkcja `escapeXmlText()`, zastosowana w `constructUserAnalysisPrompt()`.

---

## DECISION-03: Word-boundary regex dla time-sensitive guard

**Kontekst:** Stary kod używał `String.includes()` — naiwne dopasowanie powodowało false positives.

**Decyzja:** Zastąpienie przez tablicę regex z `\b` (word boundary) + obsługa fleksji polskiej.

**Przykłady eliminowanych false positives:**
| Słowo w prompcie | Stary kod | Nowy kod |
|-----------------|-----------|----------|
| `ocena` | TRIGGER (zawiera `cena`) | PASS ✓ |
| `React` | TRIGGER (zawiera `act`) | PASS ✓ |
| `interakcja` | PASS | PASS ✓ |

**Dodatkowe:** negation phrases (`"bez podawania ceny"`, `"without pricing"`) suppress guard.

---

## DECISION-04: `useSyncExternalStore` zamiast mounted + timer

**Kontekst:** `share-settings.tsx` używała pattern `useState(false)` + `useEffect(() => setTimeout(() => setMounted(true), 10))` — anty-pattern dla React 19.

**Decyzja:** `useSyncExternalStore` z:
- `subscribe`: no-op (wartość nie zmienia się asynchronicznie)
- `getServerSnapshot`: zwraca `''` (SSR placeholder)
- `getSnapshot`: zwraca `window.location.origin`

**Efekt:** Hydration mismatch wyeliminowany. Server i client mają różne snapshots z definicji — React obsługuje to bez błędu.

---

## DECISION-05: Testowanie E2E z cookie zamiast email/password

**Kontekst:** Nie ustalono zmiennych `E2E_FREE_EMAIL`, `E2E_FREE_PASSWORD`, `E2E_PRO_EMAIL`, `E2E_PRO_PASSWORD` na tym etapie — tylko `E2E_PRO_USER_COOKIE` jako opcjonalny bypass.

**Problem z podejściem cookie:**
- Cookie bypass **omija auth flow** — nie testuje logowania jako takiego.
- Nie weryfikuje, że `/api/auth/session` poprawnie waliduje sesję.
- Jest to skrót dla CI bez dostępu do emaila testowego.

**Rekomendacja na następną rundę:** Zastąpić cookie-based skip przez prawdziwy login flow z `E2E_PRO_EMAIL` + `E2E_PRO_PASSWORD`. Wymagałoby to Supabase Magic Link lub OAuth mock.

**Status obecny:** Pro testy są pomijane z `testInfo.skip()` i wyraźnym komunikatem. Nie twierdzimy, że testują auth.

---

## DECISION-06: Unified log redaction — głębokość 5 i circular ref guard

**Kontekst:** `safeScrubObject` mógł powodować nieskończoną rekursję przy circular refs lub depth bomb.

**Decyzja:**
- Max głębokość: 5 (zabezpieczenie przed bardzo zagnieżdżonymi obiektami)
- Circular ref detection: `Set<object>` + `seen.has(obj)` → `'[Circular Reference]'`
- Wyczyszczenie `seen` po każdej gałęzi (poprawna implementacja backtracking)

**Zmiana vs poprzednia implementacja:** Poprzedni kod nie usuwał obiektu z `seen` po przetworzeniu (`seen.delete()` dodane dla Array i Error branches).
