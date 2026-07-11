# Stripe Billing Sandbox & Webhook Local Testing Guide

Ten przewodnik krok po kroku wyjaśnia, jak poprawnie skonfigurować i przetestować integrację z systemem Stripe (subskrypcje, webhooki oraz Customer Portal) na środowisku lokalnym w aplikacji PromptPolish.

---

## 1. Wymagania wstępne
Do lokalnego testowania potrzebujesz:
* Konta Stripe w trybie testowym (Test Mode).
* Zainstalowanego **Stripe CLI** na swoim komputerze (użyj `scoop install stripe-cli` na Windows lub pobierz ze strony Stripe).
* Zalogowanego CLI do swojego konta Stripe (`stripe login`).

---

## 2. Krok po kroku: Konfiguracja lokalna

### Krok 2.1: Konfiguracja zmiennych środowiskowych (.env.local)
Upewnij się, że w pliku `.env.local` posiadasz następujące wpisy (zastąp wartości kluczami z Panelu Stripe):

```bash
# Włączenie Stripe
STRIPE_ENABLED=true

# Klucze API z Panelu Stripe (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# ID ceny produktu PRO utworzonego w Stripe
STRIPE_PRICE_ID_PRO=price_...
```

### Krok 2.2: Uruchomienie lokalnego serwera
Uruchom aplikację lokalnie:
```bash
pnpm dev
```
Aplikacja będzie dostępna pod adresem `http://localhost:3000`.

### Krok 2.3: Uruchomienie przekazywania Webhooków za pomocą Stripe CLI
Otwórz nowy terminal i uruchom Stripe CLI, aby nasłuchiwało zdarzeń i przekazywało je do Twojego lokalnego endpointu:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
Po uruchomieniu CLI wyświetli w konsoli informację:
`Your webhook signing secret is whsec_...`

**Bardzo ważne**: Skopiuj ten klucz (`whsec_...`) i wklej go do `.env.local` jako `STRIPE_WEBHOOK_SECRET`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```
Następnie **zrestartuj serwer Next.js** (`pnpm dev`), aby wczytać nową zmienną środowiskową.

---

## 3. Scenariusze testowe

### Scenariusz A: Zakup subskrypcji PRO (Checkout)
1. Zarejestruj nowe konto w aplikacji jako użytkownik FREE (`http://localhost:3000/login`).
2. Przejdź do zakładki cennika (`http://localhost:3000/pricing`).
3. Kliknij przycisk **Kup teraz** przy planie PRO.
4. Zostaniesz przekierowany na bezpieczną stronę Stripe Checkout.
5. Użyj testowej karty Stripe:
   * **Numer karty**: `4242 4242 4242 4242`
   * **Data ważności**: dowolna przyszła (np. `12/29`)
   * **CVC**: dowolny trzycyfrowy kod (np. `123`)
6. Kliknij **Zapłać**. Po udanej płatności zostaniesz przekierowany z powrotem do PromptPolish.
7. W konsoli Stripe CLI zobaczysz przekazane zdarzenie: `checkout.session.completed` oraz `customer.subscription.created`.
8. Twój status konta w PromptPolish natychmiast zmieni się na PRO (możesz to zweryfikować w profilu).

### Scenariusz B: Zarządzanie subskrypcją (Customer Portal)
1. Będąc zalogowanym jako użytkownik PRO, przejdź do strony profilu (`http://localhost:3000/account`).
2. Kliknij **Zarządzaj subskrypcją** w sekcji rozliczeń.
3. Zostaniesz przekierowany do bezpiecznego portalu klienta Stripe (Customer Portal).
4. Tutaj możesz:
   * **Anulować subskrypcję** (po anulowaniu Stripe wyśle webhook `customer.subscription.updated` z flagą `cancel_at_period_end = true`). Twój dostęp PRO wygaśnie dopiero na koniec okresu rozliczeniowego.
   * **Zaktualizować metodę płatności**.
5. Kliknięcie powrotu przekieruje Cię z powrotem do ustawień konta PromptPolish.

### Scenariusz C: Natychmiastowe anulowanie w Panelu Stripe
Możesz przetestować natychmiastową utratę dostępu (np. z powodu braku środków) bezpośrednio w panelu Stripe:
1. Wejdź na dashboard Stripe.
2. Znajdź subskrypcję danego użytkownika testowego i wybierz **Anuluj subskrypcję -> Natychmiast**.
3. Stripe CLI wyśle webhook `customer.subscription.deleted`.
4. Po odświeżeniu aplikacji profil użytkownika automatycznie powróci do planu FREE.

---

## 4. Diagnostyka błędów (Troubleshooting)

* **Błąd 400 (Bad Request) na webhooku**: Upewnij się, czy wkleiłeś poprawny `STRIPE_WEBHOOK_SECRET` wygenerowany przez działające polecenie `stripe listen`. Każde nowe uruchomienie nasłuchu generuje unikalny klucz.
* **Brak zmiany planu po płatności**: Sprawdź logi serwera. Jeśli występuje błąd bazy danych, upewnij się, czy Twoje migracje Supabase są w pełni zaaplikowane (tabele `stripe_customers`, `stripe_subscriptions` muszą istnieć w bazie).
* **Niedostępność Stripe CLI na Windows**: Jeśli polecenie `stripe` nie działa, upewnij się, że katalog z plikiem wykonywalnym `stripe.exe` został dodany do zmiennej środowiskowej PATH systemu operacyjnego.
