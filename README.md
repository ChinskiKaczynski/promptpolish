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

Ten starter nie zawiera prawdziwych sekretów, prawdziwego klienta Gemini ani pełnej integracji Supabase. Ma być bezpiecznym punktem startowym do pracy etapami w Antigravity.

Przed implementacją AI providera wykonaj zadanie z `MISSIONS_FOR_ANTIGRAVITY.md`: check dokumentacji Gemini, changelog i smoke test structured output. Zapisz decyzję w `docs/gemini-integration-decision.md`.

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


