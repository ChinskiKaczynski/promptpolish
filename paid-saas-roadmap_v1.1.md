# Paid SaaS Roadmap — PromptPolish

**Status:** dokument etapowy po MVP, z bramkami po poprawkach krytycznych v1.2  
**Zakres:** droga od zwalidowanego MVP do płatnego SaaS  
**Zasada nadrzędna:** nie dodawać auth, billing, pricing ani Stripe przed walidacją wartości MVP  
**Źródło bazowe:** `PromptPolish — kompletny plan wykonawczy v1.2`

---

## 0. Werdykt

[Wniosek] Ten dokument zaczyna się **dopiero po produkcyjnym MVP / prywatnej becie**, nie zastępuje planu MVP.

Najpierw udowodnij, że użytkownicy realnie korzystają z narzędzia:

```text
wklej prompt → analiza → score → poprawiony prompt → kopiuj → feedback/share
```

Dopiero potem buduj:

```text
auth → historia → limity per plan → pricing → Stripe → Pro → paid beta
```

Nie traktuj płatności jako funkcji technicznej. Płatności mają sens dopiero, gdy produkt ma powtarzalną wartość.


[Wniosek] Po korekcie MVP v1.2 paid roadmap nie może ruszyć, jeśli nie są domknięte: `POST /api/share/disable`, retention cleanup, full-schema Gemini smoke test, bundle leak test, share privacy tests, cost benchmark oraz legal readiness draft dla GDPR/cookies/vendor processing.


---

## 1. Bramka decyzyjna przed płatnym SaaS

### 1.1. Minimalne warunki rozpoczęcia etapu paid

Nie zaczynaj implementacji płatności, dopóki nie masz przynajmniej:

```text
- 50–100 realnych analiz,
- kilku użytkowników, którzy wrócili więcej niż raz,
- mierzalnego copy rate dla improved prompt,
- pozytywnego feedbacku jakościowego,
- znanego średniego kosztu jednej analizy,
- danych o token usage,
- danych o provider errors, retry count i invalid schema count,
- potwierdzonego bundle leak test,
- potwierdzonego share privacy test,
- działającego retention cleanup,
- jasnej odpowiedzi, za co użytkownik miałby płacić,
- potwierdzenia, że wynik jest lepszy niż zwykłe „popraw mi prompt” w czacie AI.
```

### 1.2. Sygnały, że można iść w płatności

```text
- użytkownicy pytają o historię analiz,
- użytkownicy pytają o większe limity,
- użytkownicy kopiują poprawione prompty,
- użytkownicy udostępniają wyniki klientom lub zespołom,
- użytkownicy chcą eksportu Markdown/PDF,
- użytkownicy proszą o batch audit wielu promptów,
- użytkownicy wracają bez przypominania,
- koszt analizy jest przewidywalny,
- copy rate i feedback pokazują realną wartość.
```

### 1.3. Sygnały, że nie należy jeszcze dodawać płatności

```text
- większość użytkowników testuje narzędzie tylko raz,
- copy rate jest niski,
- feedback mówi „ChatGPT robi to samo”,
- użytkownicy nie rozumieją scoringu,
- wyniki są zbyt długie lub mało praktyczne,
- koszt analizy jest niekontrolowany,
- share link i feedback nie są używane,
- nie ma jasnej funkcji premium,
- share disable, retention cleanup, bundle leak test albo full-schema Gemini smoke test nie są domknięte.
```

---

## 2. Strategia monetyzacji

### 2.1. Rekomendowany model startowy

[Wniosek] Najprostszy model dla pierwszej płatnej wersji:

```text
Free plan:
- niski dzienny/miesięczny limit analiz,
- brak lub ograniczona historia,
- podstawowy wynik,
- opt-in share link.

Pro plan:
- wyższy limit analiz,
- historia analiz,
- eksport Markdown,
- eksport PDF,
- bardziej szczegółowa analiza,
- zapis ulubionych wyników,
- task templates,
- później batch audit.
```

### 2.2. Czego nie monetyzować na początku

Nie zaczynaj od:

```text
- enterprise,
- team workspaces,
- marketplace,
- custom agents,
- wielu providerów AI,
- zaawansowanych benchmarków,
- sprzedaży tokenów bez jasnego UX,
- ręcznych faktur B2B jako głównego modelu.
```

### 2.3. Pierwsza hipoteza płatnej wartości

```text
Użytkownik płaci nie za samą analizę promptu, ale za:
- oszczędność czasu,
- powtarzalny scoring,
- historię pracy,
- gotowe wersje do kopiowania,
- eksport do klienta/zespołu,
- większe limity,
- możliwość audytu większej liczby promptów.
```

---

## 3. Etapy przejścia z MVP do płatnego SaaS

## Etap 0 — Validation Gate

### Cel

Potwierdzić, że płatności mają sens.

### Zakres

```text
- przeanalizuj usage_events,
- policz copy rate,
- policz powroty użytkowników,
- policz koszt jednej analizy,
- sprawdź token usage,
- sprawdź provider errors,
- sprawdź retry count,
- sprawdź invalid schema count,
- sprawdź feedback up/down,
- sprawdź najczęstsze task types,
- sprawdź użycie share linków,
- sprawdź limit_reached events.
```

### Kryteria akceptacji

```text
- wiadomo, która funkcja ma być płatna,
- wiadomo, jaki problem rozwiązuje Pro,
- wiadomo, ile kosztuje obsługa użytkownika,
- wiadomo, jakie limity są bezpieczne kosztowo,
- retention cleanup jest wykonany lub zaplanowany,
- secret/bundle exposure audit jest zielony,
- share privacy tests są zielone,
- legal readiness draft ma listę pytań GDPR/cookies/vendor processing,
- istnieje decyzja w docs/decision-log.md.
```

### Antigravity task

```text
Review production MVP usage data and prepare a paid SaaS readiness report.

Rules:
- Do not write code.
- Do not add auth, billing or pricing.
- Analyze copy rate, returning users, feedback, share usage, limit reached events, average analysis cost, token usage, provider errors, retry count and invalid schema count.
- Confirm share disable, retention cleanup, bundle leak test and share privacy tests are complete.
- Identify whether a paid plan is justified.
- Recommend Free/Pro packaging only if data supports it.
- Update docs/decision-log.md with the decision.

Output:
- docs/paid-readiness-report.md
- decision-log entry
- recommended next step: continue MVP, improve product, or start paid roadmap
```

---

## Etap 1 — Konta użytkowników i migracja anonymous-first

### Cel

Dodać konta bez psucia anonimowego flow.

### Decyzja produktowa

```text
- anonimowy użytkownik nadal może wykonać podstawową analizę,
- konto jest potrzebne do historii, limitów miesięcznych i płatnego planu,
- rejestracja nie blokuje pierwszej wartości produktu,
- po rejestracji można przypisać dotychczasowe anonymous analyses do user_id.
```

### Zakres techniczny

```text
- Supabase Auth,
- tabela user_profiles,
- powiązanie prompt_analyses.user_id,
- migracja anonymous_id → user_id po zalogowaniu,
- server-side ownership check: user_id OR owner_anonymous_id,
- basic account page,
- logout,
- email confirmation policy.
```

### Proponowane tabele

```sql
create table user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  plan_slug text not null default 'free',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Kryteria akceptacji

```text
- anonimowy flow nadal działa,
- zalogowany user widzi swoje wyniki,
- user nie widzi cudzych wyników,
- stare anonymous analyses mogą zostać przypięte do konta,
- server-only access control nadal obowiązuje,
- brak billing logic w tym etapie.
```

### Antigravity task

```text
Add Supabase Auth and user profile foundation without billing.

Scope:
- add Supabase Auth integration
- add user_profiles table
- support logged-in ownership for prompt_analyses
- preserve anonymous-first flow
- add account page with basic user info
- add migration path from anonymous owner id to user_id after login

Rules:
- Do not add Stripe.
- Do not add pricing page.
- Do not force login before first analysis.
- Keep private reads server-only.
- Do not expose Supabase secret keys client-side.

Validation:
- anonymous analysis still works
- login works
- logged-in user can access own result
- non-owner cannot access another result
- migration applies cleanly
- pnpm test
- pnpm build
```

---

## Etap 2 — Historia analiz i zapisane wyniki

### Cel

Dać realny powód do założenia konta.

### Zakres

```text
- /dashboard albo /history,
- lista analiz użytkownika,
- filtrowanie po języku/profilu/task type,
- wyszukiwanie po fragmencie promptu lub tytule,
- zapis ulubionych wyników,
- usunięcie wyniku przez użytkownika,
- basic empty states.
```

### Zmiany danych

Rozważ dodanie pól:

```text
prompt_analyses.title text nullable
prompt_analyses.is_favorite boolean not null default false
prompt_analyses.deleted_at timestamptz nullable
```

### Kryteria akceptacji

```text
- zalogowany user widzi historię,
- anonimowy user nie dostaje dashboardu,
- private result access nadal działa,
- soft delete ukrywa wynik w historii,
- share links dla usuniętych wyników są wyłączane albo respektują politykę produktu.
```

### Antigravity task

```text
Implement logged-in analysis history.

Scope:
- add /history page for authenticated users
- list prompt analyses owned by user_id
- add favorite flag
- add soft delete
- add empty/loading/error states

Rules:
- No billing.
- No team/workspace features.
- No prompt library beyond simple history.
- Private reads must remain server-side.

Validation:
- user sees only own history
- anonymous users are redirected or shown sign-in CTA
- soft-deleted results do not appear
- pnpm test
- pnpm build
```

---

## Etap 3 — Limity planów i entitlement layer

### Cel

Dodać warstwę uprawnień przed Stripe.

[Wniosek] Najpierw zaimplementuj lokalną logikę planów, potem podepnij Stripe. Dzięki temu billing nie miesza się z regułami produktu.

### Zakres

```text
- static plan config,
- free/pro feature flags,
- monthly usage limit,
- daily abuse limit,
- canAnalyzePrompt(),
- canExportMarkdown(),
- canExportPdf(),
- canUseBatchAudit(),
- limit reached UX,
- upgrade CTA placeholder.
```

### Proponowana konfiguracja

```ts
export const PLAN_LIMITS = {
  free: {
    monthlyAnalyses: 20,
    maxPromptChars: 12000,
    history: true,
    exportMarkdown: false,
    exportPdf: false,
    batchAudit: false,
  },
  pro: {
    monthlyAnalyses: 500,
    maxPromptChars: 24000,
    history: true,
    exportMarkdown: true,
    exportPdf: true,
    batchAudit: false,
  },
} as const
```

[Do weryfikacji] Konkretne limity ustaw dopiero po obliczeniu kosztu analizy i zachowań użytkowników.

### Kryteria akceptacji

```text
- limity działają bez Stripe,
- plan usera pochodzi z backendu,
- klient nie może sam sobie ustawić Pro,
- endpoint /api/analyze respektuje limit planu,
- limit reached pokazuje upgrade CTA,
- usage_events rejestrują limit reached.
```

### Antigravity task

```text
Implement plan entitlement layer without Stripe.

Scope:
- add plan config
- add server-side entitlement checks
- enforce monthly analysis limits
- add upgrade CTA placeholders
- add tests for free/pro limits

Rules:
- Do not integrate Stripe yet.
- Do not trust plan data from the client.
- Keep all enforcement server-side.

Validation:
- free user limit works
- pro user limit works using seeded/manual plan
- analyze route enforces plan limits
- client cannot bypass limit
- pnpm test
- pnpm build
```

---

## Etap 4 — Eksport Markdown i PDF

### Cel

Dodać pierwsze funkcje premium, które są łatwe do zrozumienia.

### Zakres

```text
- eksport wyniku do Markdown,
- eksport wyniku do PDF,
- watermark albo ograniczenie eksportu dla Free,
- event tracking export_markdown/export_pdf,
- dostęp zależny od planu.
```

### Decyzja produktowa

```text
Free:
- może kopiować improved prompt,
- może zobaczyć wynik w aplikacji,
- nie ma pełnego eksportu PDF.

Pro:
- może eksportować Markdown,
- może eksportować PDF,
- może używać wyniku jako artefaktu dla klienta/zespołu.
```

### Kryteria akceptacji

```text
- eksport działa tylko dla ownera,
- shared public link nie daje darmowego eksportu premium,
- eksport nie ujawnia owner_anonymous_id/user_id/internal metadata,
- eksport respektuje sensitive-data safety notes,
- PDF nie zawiera sekretów technicznych.
```

### Antigravity task

```text
Add Markdown and PDF export for analysis results.

Scope:
- export Markdown from result page
- export PDF from result page
- enforce plan entitlements server-side
- log export events

Rules:
- Do not leak internal metadata.
- Do not allow public shared links to bypass Pro export limits.
- Do not include secrets or server-side env data in exported files.

Validation:
- free user cannot export premium PDF
- pro user can export Markdown/PDF
- non-owner cannot export private result
- exported file is readable and clean
- pnpm test
- pnpm build
```

---

## Etap 5 — Pricing page i upgrade UX bez finalnego billing

### Cel

Sprawdzić komunikację płatnej wartości przed pełnym uruchomieniem płatności.

### Zakres

```text
- /pricing,
- Free vs Pro comparison,
- upgrade CTA,
- FAQ,
- transparent limits,
- no fake claims,
- no unsupported model claims,
- no public pricing promise without final decision.
```

### Minimalna struktura `/pricing`

```text
Hero:
- Upgrade when PromptPolish becomes part of your workflow.

Free:
- limited analyses,
- basic history,
- copy improved prompt,
- share result.

Pro:
- higher limits,
- full history,
- Markdown/PDF export,
- detailed analysis,
- saved favorites,
- future batch audit.

FAQ:
- Can I use it without an account?
- What happens to my prompts?
- Can I cancel?
- Do you store sensitive data?
- Which model is used?
```

### Kryteria akceptacji

```text
- pricing nie obiecuje funkcji, których nie ma,
- CTA może prowadzić do waitlist/placeholder, jeśli Stripe nie jest gotowy,
- pricing jest zgodny z regulaminem i privacy,
- plan config i pricing copy są spójne.
```

### Antigravity task

```text
Add pricing page and upgrade UX without enabling payments.

Scope:
- add /pricing
- show Free and Pro plan comparison
- add upgrade CTA placeholders
- add limit reached upgrade CTA

Rules:
- Do not integrate Stripe in this task.
- Do not claim unavailable features as live.
- Do not invent model capabilities or guarantees.

Validation:
- /pricing renders
- copy is consistent with plan config
- no billing code added
- pnpm build
```

---

## Etap 6 — Stripe foundation

### Cel

Dodać techniczną warstwę Stripe, ale jeszcze bez agresywnej sprzedaży.

### Wymagane decyzje przed kodem

```text
- subskrypcja czy pakiety kredytów,
- miesięczny czy roczny billing,
- trial czy brak triala,
- jeden Pro plan czy kilka planów,
- waluta,
- obsługa VAT/faktur,
- kraj działalności i wymagania podatkowe,
- refund policy,
- cancellation policy.
```

[Do weryfikacji] Przed implementacją użyj aktualnej dokumentacji Stripe, Supabase i Vercel. API, webhooki i best practices mogą się zmieniać.

### Zakres techniczny

```text
- STRIPE_SECRET_KEY server-only,
- STRIPE_WEBHOOK_SECRET server-only,
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY tylko jeśli potrzebne w kliencie,
- stripe_customers table,
- subscriptions table,
- checkout session endpoint,
- customer portal endpoint,
- webhook endpoint,
- idempotency handling,
- local webhook testing.
```

### Proponowane tabele

```sql
create table stripe_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  plan_slug text not null,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Kryteria akceptacji

```text
- checkout session tworzy się tylko dla zalogowanego usera,
- webhook aktualizuje subscription status,
- customer portal działa dla istniejącego customer id,
- plan_slug aktualizuje się tylko server-side,
- brak sekretów Stripe w client bundle,
- webhook jest idempotentny,
- failed/canceled subscription obniża dostęp po stronie backendu.
```

### Antigravity task

```text
Implement Stripe billing foundation.

Scope:
- add Stripe env validation
- add stripe_customers table
- add subscriptions table
- add checkout session endpoint
- add customer portal endpoint
- add webhook endpoint
- sync subscription status to server-side entitlements

Rules:
- Use current Stripe docs before implementation.
- Do not expose Stripe secret key client-side.
- Do not trust client-provided plan or price ids without server validation.
- Make webhook handling idempotent.
- Update docs/decision-log.md with billing decisions.

Validation:
- checkout works in Stripe test mode
- webhook updates subscription
- customer portal opens for subscribed user
- canceled subscription removes Pro entitlement
- pnpm test
- pnpm build
```

---

## Etap 7 — Paid plan enforcement

### Cel

Połączyć Stripe status z realnymi limitami produktu.

### Zakres

```text
- sync subscription → user_profiles.plan_slug,
- entitlement check w /api/analyze,
- entitlement check w exportach,
- entitlement check w historii,
- plan badge w UI,
- billing status page,
- upgrade/downgrade/cancel states,
- grace period policy.
```

### Kryteria akceptacji

```text
- aktywny Pro ma dostęp do Pro features,
- canceled but active until period end zachowuje dostęp do końca okresu,
- past_due ma jasną politykę dostępu,
- unpaid/canceled nie zachowuje Pro po okresie,
- backend jest źródłem prawdy,
- klient nie może obejść limitów.
```

### Antigravity task

```text
Connect Stripe subscription status to product entitlements.

Scope:
- map subscription status to plan access
- enforce Pro features server-side
- add billing status UI
- add plan badge
- add tests for active, canceled, past_due and unpaid states

Rules:
- Server-side entitlement is the source of truth.
- Client UI is only informational.
- Do not allow plan bypass by changing request payloads.

Validation:
- active Pro gets Pro limits
- canceled subscription keeps/removes access according to policy
- failed payment state is handled
- free user cannot access Pro-only routes
- pnpm test
- pnpm build
```

---

## Etap 8 — Legal, privacy i billing readiness

### Cel

Przygotować płatny produkt formalnie i operacyjnie.

[Do weryfikacji] Przed publicznym płatnym wdrożeniem oraz przed szerszym ruchem z UE skonsultuj kwestie prawne, podatkowe, GDPR, cookies, vendor/data processing i regulaminy z odpowiednim specjalistą.

### Zakres

```text
- terms update pod płatności,
- privacy update pod konta, płatności i procesorów danych,
- refund policy,
- cancellation policy,
- data retention dla kont,
- data deletion request flow,
- cookie/banner decision,
- DPA/vendor list,
- invoice/VAT process,
- support contact,
- abuse policy.
```

### Kryteria akceptacji

```text
- Terms opisują płatności, anulowanie i ograniczenia usługi,
- Privacy opisuje Stripe/Supabase/Vercel/AI providerów,
- użytkownik wie, co dzieje się z promptami,
- użytkownik może usunąć konto lub dane zgodnie z przyjętą polityką,
- support/refund flow jest opisany,
- brak sprzeczności między pricing, terms i produktem.
```

### Antigravity task

```text
Prepare legal and billing readiness drafts.

Scope:
- update docs/legal-readiness.md
- update privacy draft
- update terms draft
- add refund/cancellation policy draft
- add vendor/data processor inventory draft

Rules:
- Mark legal content as draft and requiring professional review.
- Do not make unsupported compliance claims.
- Do not deploy paid production until review is complete.

Validation:
- documents exist
- pricing, terms and privacy are consistent
- unresolved legal questions are listed
```

---

## Etap 9 — Monitoring, koszty i support

### Cel

Nie sprzedawać produktu bez widoczności kosztów, błędów i problemów użytkowników.

### Zakres

```text
- error monitoring,
- provider failure monitoring,
- Stripe webhook failure alerts,
- cost per analysis dashboard,
- usage by plan,
- conversion events,
- churn/cancel reasons,
- support inbox/process,
- admin-safe read-only diagnostics.
```

### Eventy do mierzenia

```text
signup_started
signup_completed
checkout_started
checkout_completed
checkout_failed
subscription_activated
subscription_canceled
subscription_past_due
customer_portal_opened
upgrade_cta_clicked
limit_reached
export_markdown
export_pdf
analysis_completed
copy_improved_prompt
feedback_submitted
```

### Kryteria akceptacji

```text
- wiadomo, ile kosztuje analiza per plan,
- błędy płatności są widoczne,
- błędy providera AI są widoczne,
- można obsłużyć użytkownika bez dostępu do sekretów,
- logi nie zawierają pełnych promptów z danymi wrażliwymi,
- admin tooling nie łamie prywatności.
```

### Antigravity task

```text
Add paid SaaS monitoring and operational readiness.

Scope:
- add billing-related usage events
- add cost tracking fields where available
- add operational checklist
- add basic admin-safe diagnostics documentation

Rules:
- Do not build a full admin panel unless explicitly approved.
- Do not expose private prompts in diagnostics.
- Do not log secrets or payment data.

Validation:
- key paid events are recorded
- provider errors are observable
- Stripe webhook failures are observable
- docs/operations-runbook.md exists
```

---

## Etap 10 — Paid beta launch

### Cel

Uruchomić płatności dla ograniczonej grupy użytkowników.

### Zakres

```text
- Stripe test mode pełny smoke test,
- produkcyjne Stripe keys,
- produkcyjne webhooki,
- Vercel production env,
- Supabase production policies,
- final pricing copy,
- final legal draft review,
- support contact,
- backup/rollback plan,
- paid beta announcement.
```

### Launch checklist

```text
[ ] Auth działa.
[ ] Anonymous flow nadal działa.
[ ] Historia działa tylko dla właściciela.
[ ] Free limits działają.
[ ] Pro limits działają.
[ ] Checkout test mode działa.
[ ] Checkout production działa na kontrolowanym teście.
[ ] Webhook production działa.
[ ] Customer portal działa.
[ ] Cancel subscription działa.
[ ] Failed payment state jest obsłużony.
[ ] Pro entitlement nie jest możliwy do obejścia client-side.
[ ] Stripe secrets nie są w client bundle.
[ ] Supabase secret key nie jest w client bundle.
[ ] Gemini key nie jest w client bundle.
[ ] Pricing, terms i privacy są spójne.
[ ] Refund/cancel policy jest opisana.
[ ] Support contact działa.
[ ] Monitoring błędów działa.
[ ] Monitoring kosztu analizy działa.
[ ] Rollback plan jest opisany.
[ ] Paid beta jest ograniczona do małej grupy.
```

### Antigravity task

```text
Perform paid beta launch readiness review.

Rules:
- Do not deploy or modify production without explicit approval.
- Do not change Stripe products/prices without explicit approval.
- Do not bypass legal/security checklist.

Review:
- auth
- billing
- webhook handling
- entitlement enforcement
- privacy
- terms
- data retention
- support flow
- monitoring
- rollback plan

Output:
- docs/paid-beta-launch-review.md
- go/no-go recommendation
- blocking issues
- non-blocking issues
```

---

## 4. Proponowana architektura paid SaaS

### 4.1. Źródła prawdy

```text
Supabase Auth:
- tożsamość użytkownika.

user_profiles:
- aplikacyjny profil usera,
- plan_slug jako cache/uproszczenie dostępu.

subscriptions:
- aktualny status płatności z webhooków Stripe.

plan config:
- limity i feature flags.

server-side entitlement functions:
- ostateczna decyzja, czy user może wykonać akcję.
```

### 4.2. Zasada bezpieczeństwa

```text
- frontend może pokazywać stan planu,
- frontend nie decyduje o dostępie,
- każdy endpoint premium sprawdza uprawnienia server-side,
- Stripe webhook jest jedyną drogą aktualizacji statusu subskrypcji,
- user nie może wysłać plan_slug w body i dostać Pro,
- wszystkie sekrety billingowe są server-only.
```

### 4.3. Entitlement pseudo-flow

```text
User calls /api/analyze
→ resolve user/session
→ load user profile
→ load subscription status if needed
→ resolve effective plan
→ check monthly usage
→ check feature permission
→ run sensitive-data detection
→ run AI analysis
→ save usage
→ return result
```

---

## 5. Minimalny backlog funkcji płatnych

### Must-have dla pierwszego Pro

```text
- wyższy miesięczny limit analiz,
- historia analiz,
- eksport Markdown,
- eksport PDF,
- zapis ulubionych wyników,
- billing portal,
- cancel subscription,
- plan badge,
- limit reached upgrade CTA.
```

### Should-have po pierwszej płatnej becie

```text
- task templates,
- bardziej szczegółowa analiza,
- porównanie wersji promptu,
- retry/reanalyze,
- notes do analizy,
- foldery lub lekkie kolekcje,
- CSV/JSON export.
```

### Later

```text
- batch audit,
- team workspace,
- admin panel model profiles,
- drugi provider AI,
- API access,
- browser extension,
- enterprise/SAML,
- branded reports.
```

---

## 6. Minimalny model danych po paid roadmap

Docelowo rozważ tabele:

```text
user_profiles
stripe_customers
subscriptions
prompt_analyses
usage_events
feedback_events
export_events albo usage_events z event_type
plan_usage_monthly
```

### `plan_usage_monthly`

```sql
create table plan_usage_monthly (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  analyses_count int not null default 0,
  export_markdown_count int not null default 0,
  export_pdf_count int not null default 0,
  ai_cost_estimate numeric(12, 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, period_start)
);
```

[Do weryfikacji] Koszt AI zapisuj tylko wtedy, gdy provider/SDK zwraca wiarygodne usage metadata albo masz własne ostrożne estymacje.

---

## 7. Pricing — robocza struktura, nie finalna cena

[Niezweryfikowane] Poniższe ceny są tylko placeholderami do dyskusji. Nie publikować bez analizy kosztów, konkurencji i walidacji użytkowników.

```text
Free:
- 20 analiz / miesiąc,
- historia ostatnich wyników,
- copy improved prompt,
- share link.

Pro:
- 500 analiz / miesiąc,
- pełniejsza historia,
- eksport Markdown,
- eksport PDF,
- favorites,
- wyższy limit długości promptu.
```

Nie wpisuj finalnej ceny w kodzie bez decyzji w:

```text
docs/decision-log.md
docs/pricing-decision.md
```

---

## 8. Ryzyka płatnego SaaS

| Ryzyko | Wpływ | Zabezpieczenie |
|---|---:|---|
| Stripe przed walidacją | Budowa funkcji bez popytu | Validation gate przed paid etapem |
| Zbyt niski limit Free | Użytkownik nie doświadcza wartości | Free musi pozwolić dojść do “aha moment” |
| Zbyt wysoki limit Free | Koszty bez konwersji | Monthly usage + abuse daily limit |
| Plan Pro bez realnej wartości | Brak konwersji | Historia, eksport, większe limity, batch później |
| Bypass planu client-side | Utrata przychodu i abuse | Server-side entitlements |
| Błędy webhooków | Zły dostęp użytkowników | Idempotentne webhooki + monitoring |
| Niejasne anulowanie | Spory i chargebacki | Customer portal + jasna polityka |
| Brak kontroli kosztów AI | Marża ujemna | Cost tracking per analysis/user/plan |
| Brak legal readiness | Ryzyko formalne | Terms/privacy/refund/vendor review |
| Scope creep po płatnościach | Opóźnienie launchu | Jeden Pro plan na start |

---

## 9. Kolejność wykonania w praktyce

```text
1. Zakończ publiczny MVP po poprawkach v1.2: share disable, retention cleanup, bundle leak test, share privacy tests, full-schema Gemini smoke test, cost benchmark.
2. Zbierz realne użycie.
3. Zrób paid readiness report.
4. Dodaj auth bez płatności.
5. Dodaj historię analiz.
6. Dodaj entitlement layer bez Stripe.
7. Dodaj eksport Markdown/PDF.
8. Dodaj pricing page jako komunikację wartości.
9. Dopiero potem dodaj Stripe foundation.
10. Połącz Stripe z entitlementami.
11. Zaktualizuj terms/privacy/refund/cancel policy.
12. Dodaj monitoring kosztów i billing events.
13. Uruchom paid beta na małej grupie.
14. Zmierz conversion, churn, usage i marżę.
15. Dopiero potem skaluj publicznie.
```

---

## 10. Pierwszy prompt do Antigravity dla paid roadmap

Użyj dopiero po zakończeniu MVP i zebraniu danych.

```text
Read docs/product-mvp.md, docs/architecture.md, docs/decision-log.md, docs/launch-checklist.md, docs/evaluation-results.md, docs/paid-saas-roadmap.md and current usage/event data.

Act as a senior SaaS product engineer.

Task:
Prepare a paid SaaS readiness report before any billing implementation.

Rules:
- Do not write code.
- Do not add auth, billing, pricing or Stripe.
- Evaluate whether the product is ready for paid roadmap.
- Use actual usage data where available.
- Include token usage, provider errors, retry count and invalid schema count where available.
- Confirm MVP v1.2 critical controls are complete.
- Mark missing data as unknown.
- Identify whether users have shown enough value signals.
- Recommend one of: continue MVP, improve product, add auth/history, or start billing foundation.

Acceptance criteria:
- Report includes copy rate, feedback, returning users, share usage, limit reached events, estimated analysis cost, token usage, provider errors, retry count and invalid schema count.
- Report identifies the most likely Pro value proposition.
- Report lists blocking risks before Stripe.
- Report updates docs/decision-log.md with the decision.
```

---

## 11. Ostateczna rekomendacja

[Wniosek] Płatny SaaS powinien być **drugim produktem na fundamencie MVP**, nie rozszerzeniem robionym równolegle z MVP.

Najbezpieczniejsza droga:

```text
MVP → usage data → auth/history → entitlements → exports → pricing → Stripe → paid beta
```

Największy błąd:

```text
MVP → Stripe → pricing → brak realnej wartości Pro
```

Buduj płatności dopiero wtedy, gdy dane pokazują, że użytkownik wraca, kopiuje wynik i chce zachować albo eksportować swoją pracę.
