> [!WARNING]
> **Archived / Historical** — This document has been moved to archive/ and is no longer an active project reference. It is retained for historical context only. Do not use as instructions.

# PromptPolish â€” audyt kodu i nowego UI

**Data audytu:** 2026-06-12  
**Zakres:** statyczny audyt repozytorium z paczki `promptpolish-new_look.zip`  
**ĹšcieĹĽka robocza:** `promptpolish-new_look/`  
**Werdykt:** **NO-GO dla publicznej bety z danymi uĹĽytkownikĂłw i NO-GO dla pĹ‚atnej produkcji.** WewnÄ™trzny preview UI jest moĹĽliwy po poprawie krytycznych niespĂłjnoĹ›ci.

---

## 1. Podsumowanie wykonawcze

Nowy interfejs jest wyraĹşnie dojrzalszy wizualnie: ma spĂłjny dark theme, czytelnÄ… hierarchiÄ™, sensowny ukĹ‚ad raportu i dobrÄ… strukturÄ™ komponentĂłw. JednoczeĹ›nie repo ma kilka bĹ‚Ä™dĂłw, ktĂłre mogÄ… powodowaÄ‡:

- utratÄ™ historii uĹĽytkownikĂłw,
- obejĹ›cie skanera sekretĂłw,
- faĹ‚szowanie telemetryki i limitĂłw,
- niespĂłjne uprawnienia planĂłw Free/Pro,
- nadmierne uprawnienia bazodanowe,
- zawodnÄ… synchronizacjÄ™ Stripe,
- rozjazd miÄ™dzy UI, dokumentacjÄ… i backendem.

Najpierw naleĹĽy zamknÄ…Ä‡ problemy P0/P1. Dopiero potem warto wykonywaÄ‡ peĹ‚ne testy E2E oraz publikowaÄ‡ wersjÄ™ beta.

---

## 2. Ocena obszarĂłw

| Obszar | Ocena | Werdykt |
|---|---:|---|
| UI â€” spĂłjnoĹ›Ä‡ wizualna | 8/10 | Dobry kierunek |
| UX i zgodnoĹ›Ä‡ funkcji | 5/10 | Kilka obietnic nie odpowiada backendowi |
| DostÄ™pnoĹ›Ä‡ | 5/10 | Kontrast, focus i kontrolki wymagajÄ… poprawy |
| Architektura backendu | 6/10 | Dobre fundamenty, ale istotne rozjazdy logiki |
| BezpieczeĹ„stwo | 5/10 | SÄ… mechanizmy ochronne, lecz istniejÄ… obejĹ›cia i zbyt szerokie granty |
| Billing / Stripe | 4/10 | Test-mode foundation, jeszcze nie production-safe |
| Dokumentacja | 4/10 | Wiele plikĂłw opisuje nieaktualny zakres |
| PewnoĹ›Ä‡ walidacji | 3/10 | Nie udaĹ‚o siÄ™ uruchomiÄ‡ Ĺ›wieĹĽych testĂłw/builda bez zaleĹĽnoĹ›ci i sieci |

[Wniosek] Repo wyglÄ…da jak kandydat RC, ale nie speĹ‚nia jeszcze jakoĹ›ci RC w zakresie spĂłjnoĹ›ci produktu, retencji danych i bezpieczeĹ„stwa operacyjnego.

---

## 3. Blokery P0/P1

### P0 â€” nadmierne uprawnienia Supabase

**Plik:** `supabase/migrations/20260603200000_baseline_private_beta.sql`, okolice linii 403â€“446.

Migracja nadaje rolom `anon` i `authenticated` m.in. `TRUNCATE`, `REFERENCES`, `TRIGGER`, `MAINTAIN`, a takĹĽe ustawia szerokie default privileges dla przyszĹ‚ych tabel.

**Ryzyko:** zbyt szerokie uprawnienia omijajÄ… zaĹ‚oĹĽony model â€žserver-onlyâ€ť; `TRUNCATE` nie jest kontrolowane przez RLS tak jak zwykĹ‚e operacje na wierszach.

**Naprawa:**

1. Dla `model_profiles` zostawiÄ‡ publicznie co najwyĹĽej `SELECT`.
2. CofnÄ…Ä‡ `TRUNCATE`, `REFERENCES`, `TRIGGER`, `MAINTAIN` dla `anon` i `authenticated`.
3. UsunÄ…Ä‡ szerokie default privileges dla przyszĹ‚ych tabel.
4. UstaliÄ‡ jednÄ… kanonicznÄ… Ĺ›cieĹĽkÄ™ migracji â€” obecnie istniejÄ… `db/migrations` i `supabase/migrations`.
5. DodaÄ‡ test uprawnieĹ„ wykonywany po migracji.

### P1 â€” skaner sekretĂłw nie obejmuje wszystkich pĂłl

**Plik:** `app/api/analyze/route.ts`, skan ok. linii 114â€“115; pola wysyĹ‚ane dalej ok. 315â€“342.  
**UI:** `components/analyzer/analyze-form.tsx`, ok. linii 53â€“59 i 108â€“117.

Skanowane jest tylko `input_prompt`. UĹĽytkownik moĹĽe wkleiÄ‡ klucz API, hasĹ‚o lub connection string do `task_goal`, `task_type`, `expected_output_format` albo `constraints`; pola te trafiajÄ… do providera i bazy.

**Naprawa:** skanowaÄ‡ wszystkie pola kontrolowane przez uĹĽytkownika przed jakimkolwiek zapisem i przed wywoĹ‚aniem modelu. Wyniki powinny zawieraÄ‡ nazwÄ™ pola i wyĹ‚Ä…cznie zredagowany podglÄ…d.

### P1 â€” publiczny endpoint pozwala faĹ‚szowaÄ‡ telemetrykÄ™ systemowÄ…

**Plik:** `app/api/events/route.ts`, ok. linii 23â€“54 i 93â€“110.

Allowlista przyjmuje zdarzenia takie jak `analysis_completed`, `checkout_completed`, `subscription_activated` i `provider_error`. Klient moĹĽe je wysĹ‚aÄ‡ samodzielnie, bez solidnej weryfikacji wĹ‚asnoĹ›ci analizy i bez limitu.

**Skutek:** faĹ‚szywe metryki, zanieczyszczenie panelu administracyjnego i potencjalne rozjechanie limitĂłw, jeĹĽeli limity bazujÄ… na `analysis_completed`.

**Naprawa:** endpoint klienta ograniczyÄ‡ do prawdziwych interakcji UI, np. `copy_improved_prompt`. Zdarzenia serwerowe i billingowe majÄ… byÄ‡ emitowane wyĹ‚Ä…cznie po stronie serwera. DodaÄ‡ ownership check oraz rate limit.

### P1 â€” retencja usuwa historiÄ™ zalogowanych i ulubione

**Plik:** `lib/privacy/retention.ts`, ok. linii 33â€“38 i 79â€“85.

Cleanup usuwa wszystkie nieudostÄ™pnione analizy starsze niĹĽ limit, niezaleĹĽnie od `user_id` i `is_favorite`. Nazwa zmiennej Ĺ›rodowiskowej wskazuje retencjÄ™ anonimowych analiz, podczas gdy UI obiecuje uĹĽytkownikom historiÄ™.

**Naprawa:** automatyczne usuwanie ograniczyÄ‡ co najmniej do rekordĂłw `user_id IS NULL`, `is_favorite = false`, `is_share_enabled = false`. Dla kont zdefiniowaÄ‡ oddzielnÄ… politykÄ™ usuwania i test regresyjny.

### P1 â€” limit dĹ‚ugoĹ›ci promptu nie respektuje planu

**Pliki:**

- `components/analyzer/analyze-form.tsx`, ok. linii 11â€“13 â€” 12 000 znakĂłw,
- `app/api/analyze/route.ts`, ok. 176â€“224 â€” globalny limit sprawdzany przed ustaleniem planu,
- `lib/plans/config.ts`, ok. 41â€“50 â€” Pro deklaruje 24 000.

Przy domyĹ›lnych ustawieniach Pro nadal jest blokowane na 12 000. Po podniesieniu globalnego env do 24 000 limit moĹĽe przypadkowo wzrosnÄ…Ä‡ takĹĽe dla Free/Anonymous.

**Naprawa:** najpierw rozwiÄ…zaÄ‡ plan, nastÄ™pnie walidowaÄ‡ `PLAN_LIMITS[plan].maxPromptChars`. UI musi dostawaÄ‡ limit z tego samego ĹşrĂłdĹ‚a.

### P1 â€” eksport Free/Pro jest sprzeczny

**Pliki:**

- `app/pricing/page.tsx`, ok. 109â€“112 â€” Free ma Markdown/TXT,
- `lib/plans/config.ts`, ok. 30â€“39 â€” `exportMarkdown: false`,
- `app/api/export/[id]/route.ts`, ok. 51â€“55 â€” Free dostaje 403,
- `components/result/export-actions.tsx`, ok. 25â€“65 â€” przyciski sÄ… pokazywane wszystkim.

**Naprawa:** podjÄ…Ä‡ jednÄ… decyzjÄ™ produktowÄ… i zsynchronizowaÄ‡ cennik, konfiguracjÄ™, backend, UI, testy i dokumentacjÄ™. NiedostÄ™pne akcje ukryÄ‡ albo pokazaÄ‡ jako Ĺ›wiadomy upgrade flow, nie surowe 403.

### P1 â€” udostÄ™pnianie wynikĂłw jest sprzeczne z planem produktu

W dokumentacji MVP share link jest funkcjÄ… podstawowÄ…, ale obecny `lib/plans/config.ts` wyĹ‚Ä…cza go dla Anonymous/Free, a `app/api/share/route.ts` wymaga Pro. JednoczeĹ›nie `ResultView` pokazuje panel udostÄ™pniania kaĹĽdemu wĹ‚aĹ›cicielowi.

**Naprawa:** zdecydowaÄ‡, czy share pozostaje podstawowÄ… funkcjÄ… opt-in, czy premium. NastÄ™pnie poprawiÄ‡ konfiguracjÄ™, API, widocznoĹ›Ä‡ komponentu, copy i testy.

### P1 â€” Stripe nie ma wystarczajÄ…cej niezawodnoĹ›ci i idempotencji

**Pliki:**

- `app/api/billing/checkout/route.ts`, ok. 72â€“80,
- `app/api/webhooks/stripe/route.ts`, m.in. ok. 71â€“99, 149â€“175, 220â€“221,
- `lib/supabase/billing.ts`, ok. 99â€“119,
- migracja tabel subskrypcji w baseline Supabase.

Problemy:

- checkout moĹĽe byÄ‡ kontynuowany mimo bĹ‚Ä™du zapisu klienta Stripe,
- brak ochrony przed utworzeniem kolejnej aktywnej subskrypcji,
- brak idempotency keys przy tworzeniu zasobĂłw,
- webhook potwierdza 200 przy braku mapowania klienta,
- wyniki zapisu subskrypcji sÄ… ignorowane,
- brak deduplikacji po `event.id`,
- brak ochrony przed starszym webhookiem nadpisujÄ…cym nowszy stan,
- brak unikalnoĹ›ci subskrypcji per uĹĽytkownik.

**Naprawa:** utworzyÄ‡ tabelÄ™/inbox `stripe_webhook_events`, przetwarzaÄ‡ idempotentnie, sprawdzaÄ‡ wszystkie wyniki zapisu, zwracaÄ‡ bĹ‚Ä…d dla zdarzeĹ„ nieprzetworzonych, dodaÄ‡ kontrolÄ™ kolejnoĹ›ci zdarzeĹ„ i unikalnoĹ›Ä‡ aktywnej subskrypcji.

### P1 â€” bĹ‚Ä™dne parsowanie booleanĂłw w env

**Plik:** `lib/env/server.ts`, m.in. linie 10, 17 i 26.

`z.coerce.boolean()` traktuje niepusty string, w tym czÄ™sto tekst `"false"`, jako wartoĹ›Ä‡ truthy. MoĹĽe to przypadkowo wĹ‚Ä…czyÄ‡ mock AI, wyĹ‚Ä…czyÄ‡/zmieniÄ‡ blokadÄ™ sekretĂłw albo aktywowaÄ‡ Stripe.

**Naprawa:** uĹĽyÄ‡ jawnego parsera:

```ts
const booleanFromEnv = z
  .enum(["true", "false"])
  .transform((value) => value === "true");
```

Wszystkie miejsca powinny korzystaÄ‡ z jednego sparsowanego obiektu konfiguracji.

### P1 â€” brak `.gitignore` i `.env.example`

Repo nie zawiera tych plikĂłw, mimo ĹĽe README sugeruje ich obecnoĹ›Ä‡.

**Ryzyko:** Ĺ‚atwiejsze przypadkowe dodanie `.env`, `.next`, raportĂłw Playwright lub innych artefaktĂłw do repozytorium.

**Naprawa:** dodaÄ‡ kompletne `.gitignore` i bezpieczne `.env.example` z nazwami zmiennych, typami oraz komentarzami, bez wartoĹ›ci sekretĂłw.

---

## 4. WaĹĽne problemy P2

### Limity mogÄ… zawodziÄ‡ w trybie fail-open

`lib/supabase/queries.ts` zwraca 0 przy bĹ‚Ä™dzie liczenia uĹĽycia. Awaria bazy moĹĽe wiÄ™c odblokowaÄ‡ kolejne analizy. Limit anonimowy bazuje gĹ‚Ăłwnie na cookie, ktĂłre moĹĽna wyczyĹ›ciÄ‡.

**Rekomendacja:** atomowy check-and-increment w DB, warstwowy klucz konto/cookie/HMAC-IP, kontrolowany tryb degradacji zamiast bezwarunkowego fail-open.

### Hash IP/UA wykorzystuje przewidywalny salt

`lib/rate-limit/hash-ip.ts` uĹĽywa `APP_URL` jako soli SHA-256. To nie jest dedykowany sekret.

**Rekomendacja:** HMAC-SHA256 z osobnym rotowalnym sekretem i wersjÄ… hasha.

### Feedback moĹĽna spamowaÄ‡

`app/api/feedback/route.ts` pozwala wielokrotnie zapisywaÄ‡ opiniÄ™, a tabela nie ma ograniczenia per wĹ‚aĹ›ciciel/analiza.

**Rekomendacja:** upsert jednej opinii na analizÄ™ i toĹĽsamoĹ›Ä‡, ownership check, rate limit.

### Profil modelu z bazy jest Ĺ‚adowany, ale nie steruje analizÄ…

`app/api/analyze/route.ts` pobiera profil DB, natomiast `lib/ai/analyze-prompt.ts` opiera siÄ™ na statycznym katalogu profili. Wersja z bazy trafia gĹ‚Ăłwnie do metadanych.

**Rekomendacja:** przekazywaÄ‡ znormalizowany profil DB do warstwy AI albo usunÄ…Ä‡ pozornÄ… zaleĹĽnoĹ›Ä‡ od DB.

### Brak jawnego timeoutu providera w realnym flow

Klient obsĹ‚uguje timeout, ale route go nie przekazuje.

**Rekomendacja:** ustawiÄ‡ limit czasu, obsĹ‚uĹĽyÄ‡ abort i zwracaÄ‡ stabilny bĹ‚Ä…d 503/504.

### Koszt AI jest liczony ze staĹ‚ych, nie z rzeczywistego usage

W `app/api/analyze/route.ts` zastosowano rÄ™cznÄ… formuĹ‚Ä™ cenowÄ…. MoĹĽe staÄ‡ siÄ™ nieaktualna i przekĹ‚amywaÄ‡ panel kosztĂłw.

**Rekomendacja:** zapisywaÄ‡ usage/cost zwracane przez provider, z wersjÄ… modelu i walutÄ….

### Wszystkie bĹ‚Ä™dy trafiajÄ… do telemetryki jako provider error

Route zapisuje bĹ‚Ä…d providera przed klasyfikacjÄ… wyjÄ…tku. BĹ‚Ä™dy semantyczne, DB i wewnÄ™trzne mogÄ… byÄ‡ Ĺşle raportowane.

**Rekomendacja:** logowaÄ‡ dopiero po zawÄ™ĹĽeniu typu bĹ‚Ä™du.

### Weryfikacja wĹ‚aĹ›ciciela nie jest atomowa

Przy uĹĽyciu service role czÄ™Ĺ›Ä‡ zapytaĹ„ pobiera rekord po `id`, porĂłwnuje ownera w JS, a potem aktualizuje rekord samym `id`.

**Rekomendacja:** zawrzeÄ‡ warunki wĹ‚aĹ›ciciela w samym `UPDATE/DELETE` albo RPC i sprawdzaÄ‡ liczbÄ™ zmienionych wierszy.

### Wyszukiwanie historii interpoluje tekst do filtra PostgREST

`lib/supabase/queries.ts` buduje `.or(...)` z tekstu uĹĽytkownika. Znaki specjalne mogÄ… uszkodziÄ‡ filtr lub zmieniÄ‡ jego znaczenie.

**Rekomendacja:** bezpieczne RPC/FTS albo dokĹ‚adne escapowanie skĹ‚adni PostgREST.

### Sesja Supabase Auth jest krucha

Aplikacja przechowuje access token w dĹ‚ugowiecznym cookie, a odĹ›wieĹĽenie zaleĹĽy od listenera w przeglÄ…darce. SSR po wygaĹ›niÄ™ciu tokena moĹĽe utraciÄ‡ sesjÄ™.

**Rekomendacja:** migracja do aktualnego wzorca `@supabase/ssr` z obsĹ‚ugÄ… cookies i odĹ›wieĹĽaniem po stronie proxy/middleware.

### Rozjazd polityki cookies

Kod ustawia `SameSite=Lax` i rok ĹĽycia cookie, natomiast publiczne teksty mĂłwiÄ… o `Strict` i 30 dniach.

**Rekomendacja:** ujednoliciÄ‡ implementacjÄ™, privacy i terms. Nie uĹĽywaÄ‡ hasĹ‚a â€ž100% anonymousâ€ť, jeĹ›li prompt jest zapisywany, wysyĹ‚any do providera i istnieje telemetryka/konto.

### CSP jest zbyt liberalne

`next.config.ts` dopuszcza `unsafe-inline` i `unsafe-eval`; brakuje m.in. `object-src 'none'`, `base-uri` i `form-action`.

**Rekomendacja:** osobna polityka dev/prod, nonce-based CSP, usuniÄ™cie przestarzaĹ‚ego `X-XSS-Protection`.

### MoĹĽliwe cacheâ€™owanie odwoĹ‚anego share linku â€” [Niezweryfikowane]

`app/share/[token]/page.tsx` nie wymusza jawnie dynamicznego renderowania/no-store.

**Rekomendacja:** `force-dynamic` lub `revalidate = 0`, runtime ownership/share check i test revocation.

### Eksport prywatny nie ustawia `Cache-Control: private, no-store`

DodaÄ‡ nagĹ‚Ăłwki uniemoĹĽliwiajÄ…ce cache raportu przez przeglÄ…darkÄ™/proxy.

### PDF moĹĽe nie obsĹ‚ugiwaÄ‡ polskich znakĂłw â€” [Niezweryfikowane]

Generator uĹĽywa standardowych fontĂłw jsPDF bez jawnego fontu Unicode. NaleĹĽy rÄ™cznie przetestowaÄ‡ `Ä…Ä™Ä‡Ĺ‚Ĺ„ĂłĹ›ĹşĹĽ` w eksporcie.

### Publiczne zapytanie pobiera oryginalny prompt, choÄ‡ widok go nie pokazuje

ZmniejszyÄ‡ payload publiczny i nie pobieraÄ‡ `input_prompt`, chyba ĹĽe to Ĺ›wiadoma funkcja produktu. Copy w panelu share rĂłwnieĹĽ powinno odpowiadaÄ‡ faktycznemu zakresowi publikacji.

---

## 5. Audyt nowego UI/UX

### Co dziaĹ‚a dobrze

- spĂłjny dark theme i wyraĹşny jÄ™zyk wizualny,
- dobra hierarchia hero â†’ formularz â†’ raport,
- raport wynikowy jest logicznie podzielony,
- widoczne stany Ĺ‚adowania i bĹ‚Ä™dĂłw,
- responsywne gridy sÄ… sensownie zaplanowane,
- istnieje obsĹ‚uga `prefers-reduced-motion`,
- komponenty sÄ… podzielone wedĹ‚ug funkcji, a nie tylko stron.

### Klasy CSS/Tailwind, ktĂłre mogÄ… nie dziaĹ‚aÄ‡

Repo uĹĽywa klas m.in. `animate-in`, `fade-in`, `slide-in-*`, `zoom-in-95`, ale `tailwind.config.ts` nie ma pluginu `tailwindcss-animate`, a paczka nie wystÄ™puje w zaleĹĽnoĹ›ciach. WystÄ™pujÄ… teĹĽ klasy bez definicji, np. `shadow-surface`, `h-22`, `w-22`, `animate-shake`.

**Skutek:** przeglÄ…darka po prostu je zignoruje, wiÄ™c czÄ™Ĺ›Ä‡ redesignu nie bÄ™dzie wyglÄ…daÄ‡ zgodnie z zamiarem.

### Kontrast

Token `#4A5568` ma okoĹ‚o:

- 2,59:1 na `#0C0C10`,
- 2,46:1 na `#13131A`,
- 2,24:1 na `#1C1C27`.

Dla zwykĹ‚ego tekstu wymagane jest zwykle 4,5:1. Kolor jest uĹĽywany takĹĽe przy tekstach 8â€“12 px.

**Naprawa:** podnieĹ›Ä‡ jasnoĹ›Ä‡ koloru tekstu pomocniczego i zweryfikowaÄ‡ wszystkie kombinacje tokenĂłw w automatycznym audycie kontrastu.

### DostÄ™pnoĹ›Ä‡ kontrolek

Toggle udostÄ™pniania powinien mieÄ‡ `role="switch"`, `aria-checked`, jednoznacznÄ… etykietÄ™ i stan disabled/loading. Modale wymagajÄ… focus trap, Esc i przywrĂłcenia focusu. Komunikaty sukcesu/bĹ‚Ä™du powinny uĹĽywaÄ‡ `aria-live`.

### Lokalizacja

Landing miesza polski i angielski, `<html lang="pl">` jest staĹ‚e, a ekran wyniku jest gĹ‚Ăłwnie po polsku takĹĽe dla analizy EN.

**Naprawa:** jeden sĹ‚ownik i18n, locale przekazywane przez layout/route, spĂłjne copy PL i EN.

### Nieprawdziwe lub niezaimplementowane obietnice

Landing pokazuje lub sugeruje:

- Dashboard,
- Prompt Library,
- Templates,
- Settings,
- Batch Audit,
- â€ž4 pillarsâ€ť, choÄ‡ scoring ma 10 kryteriĂłw,
- mock 2 489/5 000 analiz, gdy konfiguracja Pro przewiduje 500,
- â€ž100% anonymousâ€ť.

Te elementy naleĹĽy oznaczyÄ‡ jako preview/roadmap albo usunÄ…Ä‡ z publicznego UI do czasu implementacji.

### Twardo zakodowane metadane raportu

`components/result/result-view.tsx` pokazuje m.in. staĹ‚Ä… wersjÄ™ algorytmu, â€žSzybki audyt anonimowyâ€ť i â€žUNIWERSALNYâ€ť, niezaleĹĽnie od faktycznego planu, profilu i trybu.

**Naprawa:** renderowaÄ‡ wartoĹ›ci z rekordu analizy i wersjonowanej konfiguracji.

### Google Fonts przez `@import`

Lepsze bÄ™dzie `next/font/google` albo font lokalny zarzÄ…dzany w buildzie. Ograniczy to zaleĹĽnoĹ›Ä‡ runtime, poprawi CSP i wydajnoĹ›Ä‡.

---

## 6. ZgodnoĹ›Ä‡ z planem projektu

Repo jest funkcjonalnie dalej niĹĽ pierwotny MVP: ma auth, historiÄ™, admin metrics, Stripe i entitlements. To samo w sobie nie jest bĹ‚Ä™dem, ale dokumenty sterujÄ…ce sÄ… niespĂłjne:

- `AGENTS.md` nadal zakazuje auth, billing, pricing, dashboardu i admina,
- README rĂłwnoczeĹ›nie nazywa repo starterem i opisuje funkcje wersji beta,
- czÄ™Ĺ›Ä‡ dokumentĂłw nadal odnosi siÄ™ do Gemini, podczas gdy kod uĹĽywa OpenRouter,
- share/export/retention w dokumentacji nie odpowiadajÄ… obecnej konfiguracji.

**Rekomendacja:** utworzyÄ‡ jeden dokument `CURRENT_PRODUCT_CONTRACT.md` lub zaktualizowaÄ‡ `AGENTS.md`, README, architekturÄ™, plan limits i release notes tak, aby opis byĹ‚ jednoznaczny dla agentĂłw i ludzi.

---

## 7. Pozytywne elementy bezpieczeĹ„stwa i architektury

- klucze providerĂłw i Supabase sÄ… trzymane w Ĺ›cieĹĽkach server-only,
- anonimowe cookie jest podpisywane HMAC i porĂłwnywane staĹ‚oczasowo,
- prywatny wynik wymaga sprawdzenia wĹ‚aĹ›ciciela,
- share link jest opt-in i ma mechanizm revocation,
- webhook Stripe weryfikuje podpis,
- wynik AI ma structured output i walidacjÄ™ semantycznÄ…,
- finalny score jest liczony po stronie backendu,
- nie znaleziono `dangerouslySetInnerHTML`, `eval` ani jawnego logowania peĹ‚nego promptu,
- statyczny skan nie ujawniĹ‚ aktywnych sekretĂłw; znalezione wzorce wyglÄ…daĹ‚y na mocki i placeholdery.

---

## 8. Walidacja techniczna

### Wykonane

- rozpakowanie i inwentaryzacja 222 plikĂłw,
- statyczna analiza tras, migracji, env, auth, billing, telemetryki, retencji, eksportĂłw i UI,
- kontrola wersji kluczowych zaleĹĽnoĹ›ci z `package.json`,
- statyczne przeszukanie repo pod kÄ…tem sekretĂłw i niebezpiecznych wzorcĂłw,
- obliczenie kontrastu kluczowego tokenu tekstowego.

### Niewykonane

Nie udaĹ‚o siÄ™ wykonaÄ‡ Ĺ›wieĹĽych:

```bash
pnpm lint
pnpm test
pnpm build
pnpm exec playwright test
```

Ĺšrodowisko nie miaĹ‚o `pnpm` ani zainstalowanego `node_modules`, a prĂłba pobrania pnpm przez Corepack zakoĹ„czyĹ‚a siÄ™ bĹ‚Ä™dem sieciowym. Obecny `test-results/.last-run.json` wskazuje wczeĹ›niejszy status â€žpassedâ€ť, ale nie jest to dowĂłd z bieĹĽÄ…cego audytu.

[Niezweryfikowane] Nie potwierdzono wiÄ™c kompilacji, zgodnoĹ›ci typĂłw, peĹ‚nego test suite, zachowania przeglÄ…darkowego ani rzeczywistego renderowania PDF.

---

## 9. Zalecana kolejnoĹ›Ä‡ napraw

### Etap 1 â€” przed jakimkolwiek publicznym ruchem

1. CofnÄ…Ä‡ niebezpieczne granty Supabase i zunifikowaÄ‡ migracje.
2. SkanowaÄ‡ wszystkie pola wejĹ›ciowe pod kÄ…tem sekretĂłw.
3. ZamknÄ…Ä‡ moĹĽliwoĹ›Ä‡ faĹ‚szowania telemetryki.
4. NaprawiÄ‡ retencjÄ™, aby nie usuwaĹ‚a kont i ulubionych.
5. NaprawiÄ‡ parser booleanĂłw env.
6. DodaÄ‡ `.gitignore` i `.env.example`.

### Etap 2 â€” spĂłjnoĹ›Ä‡ produktu

7. UjednoliciÄ‡ limity znakĂłw per plan.
8. PodjÄ…Ä‡ decyzjÄ™ o export/share dla Free i Pro.
9. UkryÄ‡ niedostÄ™pne akcje albo wdroĹĽyÄ‡ poprawny upgrade UX.
10. UsunÄ…Ä‡ niezaimplementowane obietnice z landing/pricing.

### Etap 3 â€” przed Stripe test-mode staging

11. DodaÄ‡ idempotencjÄ™ checkout/webhook, kontrolÄ™ duplikatĂłw i kolejnoĹ›ci.
12. DodaÄ‡ unikalnoĹ›Ä‡ aktywnej subskrypcji per user.
13. SprawdzaÄ‡ kaĹĽdy zapis DB i nie potwierdzaÄ‡ webhooka przy bĹ‚Ä™dzie.
14. DodaÄ‡ dedykowane testy webhook retry, duplicate i out-of-order.

### Etap 4 â€” polish UI i dostÄ™pnoĹ›Ä‡

15. NaprawiÄ‡ brakujÄ…ce klasy/animacje.
16. PoprawiÄ‡ kontrast tokenĂłw.
17. DodaÄ‡ peĹ‚nÄ… dostÄ™pnoĹ›Ä‡ toggle/modal/feedback.
18. UjednoliciÄ‡ PL/EN i metadane raportu.
19. PrzetestowaÄ‡ mobile, keyboard, axe i PDF z polskimi znakami.

### Etap 5 â€” bramka release

20. ZainstalowaÄ‡ zaleĹĽnoĹ›ci z lockfile i uruchomiÄ‡ lint/test/build.
21. UruchomiÄ‡ testy E2E na lokalnym Supabase/preview.
22. WykonaÄ‡ test migracji od zera oraz upgrade istniejÄ…cej bazy.
23. WykonaÄ‡ test dwĂłch przeglÄ…darek: owner/non-owner/share revocation.
24. PrzeskanowaÄ‡ finalny client bundle pod kÄ…tem sekretĂłw.

---

## 10. Ostateczny werdykt

- **WewnÄ™trzny preview nowego UI:** warunkowo **GO**.
- **Publiczna anonymous/private beta:** **NO-GO**, dopĂłki nie zostanÄ… naprawione granty DB, skan wszystkich pĂłl, telemetryka, retencja i limity planĂłw.
- **Stripe test-mode staging:** **NO-GO** do czasu wdroĹĽenia idempotencji i poprawnego sprawdzania zapisĂłw webhookĂłw.
- **PĹ‚atna produkcja:** **NO-GO** â€” technicznie i zgodnie z istniejÄ…cymi blockerami prawnymi/podatkowymi.

[Wniosek] NajwiÄ™kszym problemem nie jest nowy UI. Interfejs jest dobrym fundamentem. Ryzyko znajduje siÄ™ gĹ‚Ăłwnie w spĂłjnoĹ›ci kontraktu produktu, migracjach/uprawnieniach Supabase, retencji danych oraz granicach pomiÄ™dzy eventami klienta i serwera.
