# PromptPolish — audyt kodu i nowego UI

**Data audytu:** 2026-06-12  
**Zakres:** statyczny audyt repozytorium z paczki `promptpolish-new_look.zip`  
**Ścieżka robocza:** `promptpolish-new_look/`  
**Werdykt:** **NO-GO dla publicznej bety z danymi użytkowników i NO-GO dla płatnej produkcji.** Wewnętrzny preview UI jest możliwy po poprawie krytycznych niespójności.

---

## 1. Podsumowanie wykonawcze

Nowy interfejs jest wyraźnie dojrzalszy wizualnie: ma spójny dark theme, czytelną hierarchię, sensowny układ raportu i dobrą strukturę komponentów. Jednocześnie repo ma kilka błędów, które mogą powodować:

- utratę historii użytkowników,
- obejście skanera sekretów,
- fałszowanie telemetryki i limitów,
- niespójne uprawnienia planów Free/Pro,
- nadmierne uprawnienia bazodanowe,
- zawodną synchronizację Stripe,
- rozjazd między UI, dokumentacją i backendem.

Najpierw należy zamknąć problemy P0/P1. Dopiero potem warto wykonywać pełne testy E2E oraz publikować wersję beta.

---

## 2. Ocena obszarów

| Obszar | Ocena | Werdykt |
|---|---:|---|
| UI — spójność wizualna | 8/10 | Dobry kierunek |
| UX i zgodność funkcji | 5/10 | Kilka obietnic nie odpowiada backendowi |
| Dostępność | 5/10 | Kontrast, focus i kontrolki wymagają poprawy |
| Architektura backendu | 6/10 | Dobre fundamenty, ale istotne rozjazdy logiki |
| Bezpieczeństwo | 5/10 | Są mechanizmy ochronne, lecz istnieją obejścia i zbyt szerokie granty |
| Billing / Stripe | 4/10 | Test-mode foundation, jeszcze nie production-safe |
| Dokumentacja | 4/10 | Wiele plików opisuje nieaktualny zakres |
| Pewność walidacji | 3/10 | Nie udało się uruchomić świeżych testów/builda bez zależności i sieci |

[Wniosek] Repo wygląda jak kandydat RC, ale nie spełnia jeszcze jakości RC w zakresie spójności produktu, retencji danych i bezpieczeństwa operacyjnego.

---

## 3. Blokery P0/P1

### P0 — nadmierne uprawnienia Supabase

**Plik:** `supabase/migrations/20260603200000_baseline_private_beta.sql`, okolice linii 403–446.

Migracja nadaje rolom `anon` i `authenticated` m.in. `TRUNCATE`, `REFERENCES`, `TRIGGER`, `MAINTAIN`, a także ustawia szerokie default privileges dla przyszłych tabel.

**Ryzyko:** zbyt szerokie uprawnienia omijają założony model „server-only”; `TRUNCATE` nie jest kontrolowane przez RLS tak jak zwykłe operacje na wierszach.

**Naprawa:**

1. Dla `model_profiles` zostawić publicznie co najwyżej `SELECT`.
2. Cofnąć `TRUNCATE`, `REFERENCES`, `TRIGGER`, `MAINTAIN` dla `anon` i `authenticated`.
3. Usunąć szerokie default privileges dla przyszłych tabel.
4. Ustalić jedną kanoniczną ścieżkę migracji — obecnie istnieją `db/migrations` i `supabase/migrations`.
5. Dodać test uprawnień wykonywany po migracji.

### P1 — skaner sekretów nie obejmuje wszystkich pól

**Plik:** `app/api/analyze/route.ts`, skan ok. linii 114–115; pola wysyłane dalej ok. 315–342.  
**UI:** `components/analyzer/analyze-form.tsx`, ok. linii 53–59 i 108–117.

Skanowane jest tylko `input_prompt`. Użytkownik może wkleić klucz API, hasło lub connection string do `task_goal`, `task_type`, `expected_output_format` albo `constraints`; pola te trafiają do providera i bazy.

**Naprawa:** skanować wszystkie pola kontrolowane przez użytkownika przed jakimkolwiek zapisem i przed wywołaniem modelu. Wyniki powinny zawierać nazwę pola i wyłącznie zredagowany podgląd.

### P1 — publiczny endpoint pozwala fałszować telemetrykę systemową

**Plik:** `app/api/events/route.ts`, ok. linii 23–54 i 93–110.

Allowlista przyjmuje zdarzenia takie jak `analysis_completed`, `checkout_completed`, `subscription_activated` i `provider_error`. Klient może je wysłać samodzielnie, bez solidnej weryfikacji własności analizy i bez limitu.

**Skutek:** fałszywe metryki, zanieczyszczenie panelu administracyjnego i potencjalne rozjechanie limitów, jeżeli limity bazują na `analysis_completed`.

**Naprawa:** endpoint klienta ograniczyć do prawdziwych interakcji UI, np. `copy_improved_prompt`. Zdarzenia serwerowe i billingowe mają być emitowane wyłącznie po stronie serwera. Dodać ownership check oraz rate limit.

### P1 — retencja usuwa historię zalogowanych i ulubione

**Plik:** `lib/privacy/retention.ts`, ok. linii 33–38 i 79–85.

Cleanup usuwa wszystkie nieudostępnione analizy starsze niż limit, niezależnie od `user_id` i `is_favorite`. Nazwa zmiennej środowiskowej wskazuje retencję anonimowych analiz, podczas gdy UI obiecuje użytkownikom historię.

**Naprawa:** automatyczne usuwanie ograniczyć co najmniej do rekordów `user_id IS NULL`, `is_favorite = false`, `is_share_enabled = false`. Dla kont zdefiniować oddzielną politykę usuwania i test regresyjny.

### P1 — limit długości promptu nie respektuje planu

**Pliki:**

- `components/analyzer/analyze-form.tsx`, ok. linii 11–13 — 12 000 znaków,
- `app/api/analyze/route.ts`, ok. 176–224 — globalny limit sprawdzany przed ustaleniem planu,
- `lib/plans/config.ts`, ok. 41–50 — Pro deklaruje 24 000.

Przy domyślnych ustawieniach Pro nadal jest blokowane na 12 000. Po podniesieniu globalnego env do 24 000 limit może przypadkowo wzrosnąć także dla Free/Anonymous.

**Naprawa:** najpierw rozwiązać plan, następnie walidować `PLAN_LIMITS[plan].maxPromptChars`. UI musi dostawać limit z tego samego źródła.

### P1 — eksport Free/Pro jest sprzeczny

**Pliki:**

- `app/pricing/page.tsx`, ok. 109–112 — Free ma Markdown/TXT,
- `lib/plans/config.ts`, ok. 30–39 — `exportMarkdown: false`,
- `app/api/export/[id]/route.ts`, ok. 51–55 — Free dostaje 403,
- `components/result/export-actions.tsx`, ok. 25–65 — przyciski są pokazywane wszystkim.

**Naprawa:** podjąć jedną decyzję produktową i zsynchronizować cennik, konfigurację, backend, UI, testy i dokumentację. Niedostępne akcje ukryć albo pokazać jako świadomy upgrade flow, nie surowe 403.

### P1 — udostępnianie wyników jest sprzeczne z planem produktu

W dokumentacji MVP share link jest funkcją podstawową, ale obecny `lib/plans/config.ts` wyłącza go dla Anonymous/Free, a `app/api/share/route.ts` wymaga Pro. Jednocześnie `ResultView` pokazuje panel udostępniania każdemu właścicielowi.

**Naprawa:** zdecydować, czy share pozostaje podstawową funkcją opt-in, czy premium. Następnie poprawić konfigurację, API, widoczność komponentu, copy i testy.

### P1 — Stripe nie ma wystarczającej niezawodności i idempotencji

**Pliki:**

- `app/api/billing/checkout/route.ts`, ok. 72–80,
- `app/api/webhooks/stripe/route.ts`, m.in. ok. 71–99, 149–175, 220–221,
- `lib/supabase/billing.ts`, ok. 99–119,
- migracja tabel subskrypcji w baseline Supabase.

Problemy:

- checkout może być kontynuowany mimo błędu zapisu klienta Stripe,
- brak ochrony przed utworzeniem kolejnej aktywnej subskrypcji,
- brak idempotency keys przy tworzeniu zasobów,
- webhook potwierdza 200 przy braku mapowania klienta,
- wyniki zapisu subskrypcji są ignorowane,
- brak deduplikacji po `event.id`,
- brak ochrony przed starszym webhookiem nadpisującym nowszy stan,
- brak unikalności subskrypcji per użytkownik.

**Naprawa:** utworzyć tabelę/inbox `stripe_webhook_events`, przetwarzać idempotentnie, sprawdzać wszystkie wyniki zapisu, zwracać błąd dla zdarzeń nieprzetworzonych, dodać kontrolę kolejności zdarzeń i unikalność aktywnej subskrypcji.

### P1 — błędne parsowanie booleanów w env

**Plik:** `lib/env/server.ts`, m.in. linie 10, 17 i 26.

`z.coerce.boolean()` traktuje niepusty string, w tym często tekst `"false"`, jako wartość truthy. Może to przypadkowo włączyć mock AI, wyłączyć/zmienić blokadę sekretów albo aktywować Stripe.

**Naprawa:** użyć jawnego parsera:

```ts
const booleanFromEnv = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
```

Wszystkie miejsca powinny korzystać z jednego sparsowanego obiektu konfiguracji.

### P1 — brak `.gitignore` i `.env.example`

Repo nie zawiera tych plików, mimo że README sugeruje ich obecność.

**Ryzyko:** łatwiejsze przypadkowe dodanie `.env`, `.next`, raportów Playwright lub innych artefaktów do repozytorium.

**Naprawa:** dodać kompletne `.gitignore` i bezpieczne `.env.example` z nazwami zmiennych, typami oraz komentarzami, bez wartości sekretów.

---

## 4. Ważne problemy P2

### Limity mogą zawodzić w trybie fail-open

`lib/supabase/queries.ts` zwraca 0 przy błędzie liczenia użycia. Awaria bazy może więc odblokować kolejne analizy. Limit anonimowy bazuje głównie na cookie, które można wyczyścić.

**Rekomendacja:** atomowy check-and-increment w DB, warstwowy klucz konto/cookie/HMAC-IP, kontrolowany tryb degradacji zamiast bezwarunkowego fail-open.

### Hash IP/UA wykorzystuje przewidywalny salt

`lib/rate-limit/hash-ip.ts` używa `APP_URL` jako soli SHA-256. To nie jest dedykowany sekret.

**Rekomendacja:** HMAC-SHA256 z osobnym rotowalnym sekretem i wersją hasha.

### Feedback można spamować

`app/api/feedback/route.ts` pozwala wielokrotnie zapisywać opinię, a tabela nie ma ograniczenia per właściciel/analiza.

**Rekomendacja:** upsert jednej opinii na analizę i tożsamość, ownership check, rate limit.

### Profil modelu z bazy jest ładowany, ale nie steruje analizą

`app/api/analyze/route.ts` pobiera profil DB, natomiast `lib/ai/analyze-prompt.ts` opiera się na statycznym katalogu profili. Wersja z bazy trafia głównie do metadanych.

**Rekomendacja:** przekazywać znormalizowany profil DB do warstwy AI albo usunąć pozorną zależność od DB.

### Brak jawnego timeoutu providera w realnym flow

Klient obsługuje timeout, ale route go nie przekazuje.

**Rekomendacja:** ustawić limit czasu, obsłużyć abort i zwracać stabilny błąd 503/504.

### Koszt AI jest liczony ze stałych, nie z rzeczywistego usage

W `app/api/analyze/route.ts` zastosowano ręczną formułę cenową. Może stać się nieaktualna i przekłamywać panel kosztów.

**Rekomendacja:** zapisywać usage/cost zwracane przez provider, z wersją modelu i walutą.

### Wszystkie błędy trafiają do telemetryki jako provider error

Route zapisuje błąd providera przed klasyfikacją wyjątku. Błędy semantyczne, DB i wewnętrzne mogą być źle raportowane.

**Rekomendacja:** logować dopiero po zawężeniu typu błędu.

### Weryfikacja właściciela nie jest atomowa

Przy użyciu service role część zapytań pobiera rekord po `id`, porównuje ownera w JS, a potem aktualizuje rekord samym `id`.

**Rekomendacja:** zawrzeć warunki właściciela w samym `UPDATE/DELETE` albo RPC i sprawdzać liczbę zmienionych wierszy.

### Wyszukiwanie historii interpoluje tekst do filtra PostgREST

`lib/supabase/queries.ts` buduje `.or(...)` z tekstu użytkownika. Znaki specjalne mogą uszkodzić filtr lub zmienić jego znaczenie.

**Rekomendacja:** bezpieczne RPC/FTS albo dokładne escapowanie składni PostgREST.

### Sesja Supabase Auth jest krucha

Aplikacja przechowuje access token w długowiecznym cookie, a odświeżenie zależy od listenera w przeglądarce. SSR po wygaśnięciu tokena może utracić sesję.

**Rekomendacja:** migracja do aktualnego wzorca `@supabase/ssr` z obsługą cookies i odświeżaniem po stronie proxy/middleware.

### Rozjazd polityki cookies

Kod ustawia `SameSite=Lax` i rok życia cookie, natomiast publiczne teksty mówią o `Strict` i 30 dniach.

**Rekomendacja:** ujednolicić implementację, privacy i terms. Nie używać hasła „100% anonymous”, jeśli prompt jest zapisywany, wysyłany do providera i istnieje telemetryka/konto.

### CSP jest zbyt liberalne

`next.config.ts` dopuszcza `unsafe-inline` i `unsafe-eval`; brakuje m.in. `object-src 'none'`, `base-uri` i `form-action`.

**Rekomendacja:** osobna polityka dev/prod, nonce-based CSP, usunięcie przestarzałego `X-XSS-Protection`.

### Możliwe cache’owanie odwołanego share linku — [Niezweryfikowane]

`app/share/[token]/page.tsx` nie wymusza jawnie dynamicznego renderowania/no-store.

**Rekomendacja:** `force-dynamic` lub `revalidate = 0`, runtime ownership/share check i test revocation.

### Eksport prywatny nie ustawia `Cache-Control: private, no-store`

Dodać nagłówki uniemożliwiające cache raportu przez przeglądarkę/proxy.

### PDF może nie obsługiwać polskich znaków — [Niezweryfikowane]

Generator używa standardowych fontów jsPDF bez jawnego fontu Unicode. Należy ręcznie przetestować `ąęćłńóśźż` w eksporcie.

### Publiczne zapytanie pobiera oryginalny prompt, choć widok go nie pokazuje

Zmniejszyć payload publiczny i nie pobierać `input_prompt`, chyba że to świadoma funkcja produktu. Copy w panelu share również powinno odpowiadać faktycznemu zakresowi publikacji.

---

## 5. Audyt nowego UI/UX

### Co działa dobrze

- spójny dark theme i wyraźny język wizualny,
- dobra hierarchia hero → formularz → raport,
- raport wynikowy jest logicznie podzielony,
- widoczne stany ładowania i błędów,
- responsywne gridy są sensownie zaplanowane,
- istnieje obsługa `prefers-reduced-motion`,
- komponenty są podzielone według funkcji, a nie tylko stron.

### Klasy CSS/Tailwind, które mogą nie działać

Repo używa klas m.in. `animate-in`, `fade-in`, `slide-in-*`, `zoom-in-95`, ale `tailwind.config.ts` nie ma pluginu `tailwindcss-animate`, a paczka nie występuje w zależnościach. Występują też klasy bez definicji, np. `shadow-surface`, `h-22`, `w-22`, `animate-shake`.

**Skutek:** przeglądarka po prostu je zignoruje, więc część redesignu nie będzie wyglądać zgodnie z zamiarem.

### Kontrast

Token `#4A5568` ma około:

- 2,59:1 na `#0C0C10`,
- 2,46:1 na `#13131A`,
- 2,24:1 na `#1C1C27`.

Dla zwykłego tekstu wymagane jest zwykle 4,5:1. Kolor jest używany także przy tekstach 8–12 px.

**Naprawa:** podnieść jasność koloru tekstu pomocniczego i zweryfikować wszystkie kombinacje tokenów w automatycznym audycie kontrastu.

### Dostępność kontrolek

Toggle udostępniania powinien mieć `role="switch"`, `aria-checked`, jednoznaczną etykietę i stan disabled/loading. Modale wymagają focus trap, Esc i przywrócenia focusu. Komunikaty sukcesu/błędu powinny używać `aria-live`.

### Lokalizacja

Landing miesza polski i angielski, `<html lang="pl">` jest stałe, a ekran wyniku jest głównie po polsku także dla analizy EN.

**Naprawa:** jeden słownik i18n, locale przekazywane przez layout/route, spójne copy PL i EN.

### Nieprawdziwe lub niezaimplementowane obietnice

Landing pokazuje lub sugeruje:

- Dashboard,
- Prompt Library,
- Templates,
- Settings,
- Batch Audit,
- „4 pillars”, choć scoring ma 10 kryteriów,
- mock 2 489/5 000 analiz, gdy konfiguracja Pro przewiduje 500,
- „100% anonymous”.

Te elementy należy oznaczyć jako preview/roadmap albo usunąć z publicznego UI do czasu implementacji.

### Twardo zakodowane metadane raportu

`components/result/result-view.tsx` pokazuje m.in. stałą wersję algorytmu, „Szybki audyt anonimowy” i „UNIWERSALNY”, niezależnie od faktycznego planu, profilu i trybu.

**Naprawa:** renderować wartości z rekordu analizy i wersjonowanej konfiguracji.

### Google Fonts przez `@import`

Lepsze będzie `next/font/google` albo font lokalny zarządzany w buildzie. Ograniczy to zależność runtime, poprawi CSP i wydajność.

---

## 6. Zgodność z planem projektu

Repo jest funkcjonalnie dalej niż pierwotny MVP: ma auth, historię, admin metrics, Stripe i entitlements. To samo w sobie nie jest błędem, ale dokumenty sterujące są niespójne:

- `AGENTS.md` nadal zakazuje auth, billing, pricing, dashboardu i admina,
- README równocześnie nazywa repo starterem i opisuje funkcje wersji beta,
- część dokumentów nadal odnosi się do Gemini, podczas gdy kod używa OpenRouter,
- share/export/retention w dokumentacji nie odpowiadają obecnej konfiguracji.

**Rekomendacja:** utworzyć jeden dokument `CURRENT_PRODUCT_CONTRACT.md` lub zaktualizować `AGENTS.md`, README, architekturę, plan limits i release notes tak, aby opis był jednoznaczny dla agentów i ludzi.

---

## 7. Pozytywne elementy bezpieczeństwa i architektury

- klucze providerów i Supabase są trzymane w ścieżkach server-only,
- anonimowe cookie jest podpisywane HMAC i porównywane stałoczasowo,
- prywatny wynik wymaga sprawdzenia właściciela,
- share link jest opt-in i ma mechanizm revocation,
- webhook Stripe weryfikuje podpis,
- wynik AI ma structured output i walidację semantyczną,
- finalny score jest liczony po stronie backendu,
- nie znaleziono `dangerouslySetInnerHTML`, `eval` ani jawnego logowania pełnego promptu,
- statyczny skan nie ujawnił aktywnych sekretów; znalezione wzorce wyglądały na mocki i placeholdery.

---

## 8. Walidacja techniczna

### Wykonane

- rozpakowanie i inwentaryzacja 222 plików,
- statyczna analiza tras, migracji, env, auth, billing, telemetryki, retencji, eksportów i UI,
- kontrola wersji kluczowych zależności z `package.json`,
- statyczne przeszukanie repo pod kątem sekretów i niebezpiecznych wzorców,
- obliczenie kontrastu kluczowego tokenu tekstowego.

### Niewykonane

Nie udało się wykonać świeżych:

```bash
pnpm lint
pnpm test
pnpm build
pnpm exec playwright test
```

Środowisko nie miało `pnpm` ani zainstalowanego `node_modules`, a próba pobrania pnpm przez Corepack zakończyła się błędem sieciowym. Obecny `test-results/.last-run.json` wskazuje wcześniejszy status „passed”, ale nie jest to dowód z bieżącego audytu.

[Niezweryfikowane] Nie potwierdzono więc kompilacji, zgodności typów, pełnego test suite, zachowania przeglądarkowego ani rzeczywistego renderowania PDF.

---

## 9. Zalecana kolejność napraw

### Etap 1 — przed jakimkolwiek publicznym ruchem

1. Cofnąć niebezpieczne granty Supabase i zunifikować migracje.
2. Skanować wszystkie pola wejściowe pod kątem sekretów.
3. Zamknąć możliwość fałszowania telemetryki.
4. Naprawić retencję, aby nie usuwała kont i ulubionych.
5. Naprawić parser booleanów env.
6. Dodać `.gitignore` i `.env.example`.

### Etap 2 — spójność produktu

7. Ujednolicić limity znaków per plan.
8. Podjąć decyzję o export/share dla Free i Pro.
9. Ukryć niedostępne akcje albo wdrożyć poprawny upgrade UX.
10. Usunąć niezaimplementowane obietnice z landing/pricing.

### Etap 3 — przed Stripe test-mode staging

11. Dodać idempotencję checkout/webhook, kontrolę duplikatów i kolejności.
12. Dodać unikalność aktywnej subskrypcji per user.
13. Sprawdzać każdy zapis DB i nie potwierdzać webhooka przy błędzie.
14. Dodać dedykowane testy webhook retry, duplicate i out-of-order.

### Etap 4 — polish UI i dostępność

15. Naprawić brakujące klasy/animacje.
16. Poprawić kontrast tokenów.
17. Dodać pełną dostępność toggle/modal/feedback.
18. Ujednolicić PL/EN i metadane raportu.
19. Przetestować mobile, keyboard, axe i PDF z polskimi znakami.

### Etap 5 — bramka release

20. Zainstalować zależności z lockfile i uruchomić lint/test/build.
21. Uruchomić testy E2E na lokalnym Supabase/preview.
22. Wykonać test migracji od zera oraz upgrade istniejącej bazy.
23. Wykonać test dwóch przeglądarek: owner/non-owner/share revocation.
24. Przeskanować finalny client bundle pod kątem sekretów.

---

## 10. Ostateczny werdykt

- **Wewnętrzny preview nowego UI:** warunkowo **GO**.
- **Publiczna anonymous/private beta:** **NO-GO**, dopóki nie zostaną naprawione granty DB, skan wszystkich pól, telemetryka, retencja i limity planów.
- **Stripe test-mode staging:** **NO-GO** do czasu wdrożenia idempotencji i poprawnego sprawdzania zapisów webhooków.
- **Płatna produkcja:** **NO-GO** — technicznie i zgodnie z istniejącymi blockerami prawnymi/podatkowymi.

[Wniosek] Największym problemem nie jest nowy UI. Interfejs jest dobrym fundamentem. Ryzyko znajduje się głównie w spójności kontraktu produktu, migracjach/uprawnieniach Supabase, retencji danych oraz granicach pomiędzy eventami klienta i serwera.
