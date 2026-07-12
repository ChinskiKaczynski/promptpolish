# PromptPolish — Antigravity Starter

Starter repo dla anonymous-first PromptPolish.

## Co jest w paczce

- minimalny szkielet Next.js App Router + TypeScript + Tailwind,
- dokumenty projektowe i reguły dla Google Antigravity,
- `.env.example` bez sekretów,
- stub UI: landing, formularz analizy, mock wyniku,
- deterministic scoring + testy,
- sensitive-data detector + testy,
- Zod schema dla AI structured output,
- migracja Supabase dla MVP,
- lista małych misji dla Antigravity.

## Start lokalny

```bash
pnpm install
pnpm dev
```

Walidacja:

```bash
pnpm lint
pnpm test
pnpm build
```

## Ważne

Projekt integruje się z **Google Gemini API** (model `gemini-2.5-flash` za pośrednictwem Vercel AI SDK) oraz bazą danych Supabase. Do uruchomienia i przetestowania aplikacji wymagane jest skonfigurowanie kluczy dostępowych w pliku `.env.local`. Decyzje architektoniczne i szczegóły wdrożenia znajdują się w pliku [docs/decision-log.md](docs/decision-log.md).

## Funkcjonalności V1 Beta (User History & Account)

### 1. Przepływ Użytkownika Beta (User Flow)

- **Anonimowi Goście (Anonymous-first)**: Mogą bez przeszkód przeprowadzać analizy promptów, a ich historia jest powiązana z unikalnym podpisem cyfrowym i ciasteczkiem sesyjnym `owner_anonymous_id`. Mogą zarządzać swoją historią na stronie `/history`.
- **Zarejestrowani Użytkownicy**: Po zalogowaniu ich anonimowa historia zostaje zsynchronizowana z kontem. Mają dostęp do strony `/account`, która wyświetla szczegóły abonamentowe i statystyki limitów.

### 2. Historia Analiz (`/history`)

- Działa zarówno dla zalogowanych, jak i anonimowych użytkowników (zabezpieczonych ciasteczkiem).
- Obsługuje wyszukiwanie (po tekście promptu lub tytule) oraz zaawansowane filtry (język, profil modelu, tylko ulubione).
- Obsługuje sortowanie (najnowsze, najstarsze, najwyższy/najniższy wynik).
- Pozwala na dodawanie/usuwanie z ulubionych (★) oraz przenoszenie do kosza (soft-delete).

### 3. Prywatność i Bezpieczeństwo

- **Bezpieczny podgląd**: Surowe prompty na listach historii są skracane do 120 znaków i automatycznie oczyszczane z wrażliwych danych (klucze API, maile, dane kart).
- **Soft-delete**: Usunięte analizy są natychmiast ukrywane przed użytkownikiem i wygaszane z publicznych linków udostępniania (zwracają 404).
- **Blokowanie wycieków**: Użytkownik gość nie może przeglądać analiz przypisanych do zalogowanych kont, a role dostępowe są wymuszane w backendzie.

### 4. Rozliczenia w Wersji Beta (`/account`)

- Jeśli bramka Stripe jest wyłączona (`STRIPE_ENABLED=false`), użytkownicy widzą wyraźne ostrzeżenie, że system płatności działa w trybie zamkniętej bety (Simulated Beta Pro).
- Wszelkie transakcje i subskrypcje Stripe są wstrzymane. Użytkownicy widzą aktualne wykorzystanie limitów analiz w danym miesiącu UTC za pomocą paska postępu.

### 5. Eksport Wyników (Export v1)

- **Formaty Eksportu**: Użytkownicy mogą eksportować szczegółowe raporty analizy promptów do formatów Markdown (`.md`) oraz czystego tekstu (`.txt`).
- **Prywatność i Scrubbing danych**: Eksportowane pliki są w pełni oczyszczane ze wszystkich poufnych metadanych systemowych i osobowych (takich jak tokeny udostępniania publicznego, identyfikatory użytkowników i gości).
- **Zabezpieczenie Dostępności**: Funkcja eksportu jest dostępna wyłącznie dla właściciela danej analizy (zarówno zalogowanego użytkownika, jak i gościa zabezpieczonego ciasteczkiem). Publiczne strony udostępniania (`/share/[token]`) nie eksponują kontrolek eksportu raportów.
- **PDF**: Eksport do formatu PDF nie jest wspierany w tej wersji.

---

## Beta Plans — Limits & Stripe State

### Plan Limits (Beta)

| Plan          | Monthly Analyses | Daily Abuse Limit                | Max Prompt Chars | Markdown Export | TXT Export | PDF Export | Share | Batch Audit |
| ------------- | ---------------- | -------------------------------- | ---------------- | --------------- | ---------- | ---------- | ----- | ----------- |
| **Anonymous** | 10               | 3 (env: `ANONYMOUS_DAILY_LIMIT`) | 12,000           | ✓               | ✓          | ✗          | ✓     | ✗           |
| **Free**      | 20               | 5                                | 12,000           | ✓               | ✓          | ✗          | ✓     | ✗           |
| **Pro**       | 500              | 100                              | 24,000           | ✓               | ✓          | ✓          | ✓     | ✗           |

> Batch Audit is **not available in MVP scope** for any plan. Source of truth: `lib/plans/config.ts`.

> Monthly limits are counted via `analysis_completed` events in UTC. They reset on the 1st of each month.

### STRIPE_ENABLED=false Behavior

When `STRIPE_ENABLED=false` (the default during beta):

- `/api/billing/checkout` returns **403 `billing_disabled`** — no Stripe session is created
- `/api/billing/portal` returns **400 `no_customer_record`** — no portal access
- `/pricing` shows a **beta notice banner** and replaces the checkout button with a waitlist form
- `/account` shows a **Beta Info amber banner** instead of subscription details
- The `SimulateProButton` (developer tool) still works for admin emails or in development mode

### Simulate-Pro (Beta Testing Tool)

Endpoint: `POST /api/entitlements/simulate-pro`

- **Development**: any authenticated user can call it (no admin check)
- **Production**: only emails listed in `ADMIN_EMAILS` env var (comma-separated) can call it
- Sets `user_profiles.plan_slug = 'pro'` directly in the database
- Does **not** create any Stripe subscription records
- Fires `simulate_pro_enabled` telemetry event
- The UI shows a `Beta Symulacja` badge next to the Pro plan name

### Usage Meter

A reusable `<UsageMeter>` component is available at `components/plans/usage-meter.tsx`:

- **Normal** (<80%): indigo progress bar
- **Warning** (≥80%): amber progress bar + warning banner linking to `/pricing`
- **Blocked** (100%): rose progress bar + blocked message with beta caveat

The `/analyze` page fires a server-side `limit_warning_shown` event when a user loads the page with ≥80% of their monthly quota consumed.

### What Changes Before Real Billing

1. Set `STRIPE_ENABLED=true` in production environment
2. Configure `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID_PRO`, `STRIPE_WEBHOOK_SECRET`
3. Set up Stripe webhook endpoint at `/api/webhooks/stripe`
4. The Stripe webhook handler automatically syncs `plan_slug` to `user_profiles` on subscription events
5. The `SimulateProButton` section on `/pricing` should be removed or hidden from non-admin users
6. Update pricing page to show real pricing instead of "Cena TBD"
