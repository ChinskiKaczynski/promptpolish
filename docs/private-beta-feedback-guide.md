# Poradnik dla Testerów Prywatnej Bety (Feedback Guide)

Witaj w gronie testerów prywatnej wersji beta **PromptPolish (Prompt Optimizer)**! Twoje opinie pomogą nam dopracować silnik ulepszania promptów przed oficjalną premierą.

Poniżej znajdziesz szczegółowe instrukcje, co i jak testować, na co uważać oraz jak przekazywać nam cenne uwagi.

---

## 1. Instrukcja krok po kroku
1. Otwórz podany przez nas link do wersji produkcyjnej aplikacji.
2. Korzystanie z aplikacji **nie wymaga logowania ani podawania danych**. Uruchomienie analizy jest całkowicie darmowe i anonimowe.
3. Wklej swój własny prompt w pole tekstowe (patrz rekomendacje poniżej) i wybierz preferowany język pracy (np. Polski).
4. Kliknij **"Przeprowadź audyt promptu"** i poczekaj na wygenerowanie raportu.
5. Zapoznaj się z oceną punktową (0–100) oraz diagnozą słabych punktów.
6. Skopiuj ulepszoną wersję promptu za pomocą przycisku **"Kopiuj prompt"**.
7. **Kluczowy krok**: Wklej skopiowany (ulepszony) prompt do swojego ulubionego modelu LLM (np. ChatGPT, Claude, Gemini) i porównaj odpowiedź z tą, którą generował Twój oryginalny prompt.
8. Wróć do karty z raportem w PromptPolish i kliknij odpowiedni kciuk:
   * **👍 Tak, bardzo** – jeśli ulepszony prompt dał zauważalnie lepsze efekty.
   * **👎 Nie, słaba jakość** – jeśli ulepszony prompt nie pomógł, zepsuł intencję lub nie przyniósł różnicy. Po kliknięciu opisz krótko w polu tekstowym, co poszło nie tak.

---

## 2. Jakie prompty najlepiej testować?
Wybieraj prompty, których faktycznie używasz w codziennej pracy:
* **Prompty zadaniowe / kreatywne**: Tworzenie postów na social media, maili sprzedażowych, konspektów artykułów.
* **Prompty techniczne / programistyczne**: Wyjaśnianie kodu, refaktoryzacja, generowanie zapytań SQL, naprawa błędów.
* **Prompty analityczne**: Analiza danych, wyciąganie wniosków z tekstu, streszczanie raportów.
* **Wskazówka**: Unikaj skrajnie krótkich promptów typu *"napisz wiersz"*. Silnik pokazuje swoją pełną moc na promptach o długości powyżej 2–3 zdań, gdzie kontekst, formatowanie i instrukcje można uporządkować strukturalnie.

---

## 3. Ważne ostrzeżenie dotyczące prywatności (Privacy Warning)

> [!WARNING]
> **BEZPIECZEŃSTWO TWOICH DANYCH**:
> * Aplikacja posiada wbudowany skaner bezpieczeństwa (*Preflight Scan*), który automatycznie wykrywa i blokuje wysyłanie haseł, kluczy API (np. OpenAI `sk-...`) oraz połączeń do baz danych.
> * Mimo to, **NIGDY nie wklejaj w promptach żadnych wrażliwych danych osobowych, poufnych dokumentów firmowych, haseł ani sekretów**.
> * Narzędzie przetwarza wprowadzony tekst przez zewnętrzne API OpenRouter (model DeepSeek) i chociaż dane nie są wykorzystywane do trenowania modeli, dbaj o swoje bezpieczeństwo i używaj zanonimizowanych danych testowych.

---

## 4. Jak ocenić, czy ulepszony prompt jest użyteczny?
Porównując odpowiedzi modeli LLM na prompt oryginalny i ulepszony, zwróć uwagę na:
1. **Precyzję i trafność**: Czy model lepiej zrozumiał Twoje intencje i nie pominął kluczowych wymagań?
2. **Formatowanie i strukturę**: Czy odpowiedź jest lepiej zorganizowana (np. przejrzyste tabele, punktor, podział na sekcje), zgodnie z zaleceniami w ulepszonym promptcie?
3. **Styl i ton**: Czy ton wypowiedzi jest bardziej dopasowany do kontekstu?
4. **Brak "wodolejstwa"**: Czy model przeszedł od razu do rzeczy, zamiast generować zbędne wstępy i zakończenia?

---

## 5. Co nam zgłaszać?
Zwróć uwagę i zgłoś nam (najlepiej w komentarzu przy ocenie negatywnej lub bezpośrednio na czacie):
* **Błędy techniczne**: Zawieszenie ekranu ładowania, brak reakcji przycisków, błędy 500, rozjeżdżanie się interfejsu na telefonie.
* **Błędy merytoryczne**: Ulepszony prompt zmienił znaczenie oryginalnego zapytania (np. silnik błędnie zinterpretował Twoją intencję).
* **Problemy z językiem**: Błędy gramatyczne, sztucznie brzmiące frazy w diagnozie lub ulepszonym promptcie (szczególnie w języku polskim).
* **Niezrozumiałe metryki**: Jeśli punktacja lub diagnoza kryteriów wydają się nielogiczne lub niejasne.
