# PromptPolish MVP Private Beta Checklist & Guidelines

This document serves as the core operational guide for conducting private beta testing of the PromptPolish anonymous MVP with a small cohort of 5–10 real users.

---

## 1. Pre-Beta Technical Checklist
Before sending the live application link to external testers, ensure the following parameters are fully configured and verified:
- [ ] **Secrets Management**: Verify that `SUPABASE_SECRET_KEY`, `OPENROUTER_API_KEY`, and database client secrets are strictly locked down to production environments and never leaked or compiled into client-side JS bundles.
- [ ] **Rate Limiting**: Confirm the anonymous IP-based and cookie-based limit (e.g. 20 prompt audits per user per month) is active to prevent cost overruns.
- [ ] **Model Aliases**: Confirm that `AI_MODEL_ALIAS` is configured in production to route model evaluations correctly through the designated fallback profile (`openrouter-deepseek-v4-flash`), and model provider names are completely scrubbed from client bundles.
- [ ] **RLS Policy Lockdown**: Confirm that migration `0008` is active in the database. Client-side `anon` or `authenticated` requests must be blocked from writing or reading private tables (`prompt_analyses`, `usage_events`, `feedback_events`).

---

## 2. Live QA & Smoke Checklist (The Beta Administrator Run)
Conduct a complete visual and operational walkthrough in a clean browser session (e.g. Incognito Mode):
1. **Landing Page**: Verify the page pre-renders smoothly under 100% zoom with no broken margins, spelling is correct, and ampersands in cards are replaced with natural Polish casing.
2. **Preflight Sensitive Scan**: Input a prompt containing a mockup secret (e.g. `sk-proj-12345`) and ensure the analyze button is deactivated, showing the preflight warning.
3. **Successful Audit Flow**: Audit a standard prompt (e.g. writing a product copy) and ensure the system redirects cleanly to `/result/[id]`.
4. **Casing & Layout Integrity**: Check that the resulting headers display `"Raport audytu promptu"`, and that there are no visible developer internal IDs, DeepSeek or OpenRouter names.
5. **Code Gutter wrap**: Ensure line numbers wrap row-by-row on mobile screens instead of breaking layouts.
6. **Share Toggle Check**: Toggle public sharing on, copy the link, open in an external incognito tab, and confirm that all private analytics (UUIDs, tokens, feedback rating fields) are safely scrubbed. Toggle public sharing off and confirm that the URL returns a `404 Not Found`.

---

## 3. Tester Instructions (Template to Send to Testers)
Copy and adapt the following message when sending the invite to beta testers:

> "Cześć! Bardzo dziękuję za dołączenie do prywatnych testów beta narzędzia **PromptPolish** – szybkiego i w 100% anonimowego audytora Twoich promptów.
> 
> Chcemy sprawdzić, jak system radzi sobie z realnymi wyzwaniami. Proszę Cię o wykonanie 3 prostych kroków:
> 1. Wejdź na [LINK DO APLIKACJI].
> 2. Wklej 2-3 swoje codzienne prompty, z których korzystasz w pracy (np. marketingowe, programistyczne, analityczne) i uruchom audyt.
> 3. Przeanalizuj ulepszoną wersję promptu, skopiuj ją kliknięciem „Kopiuj prompt”, przetestuj w swoim ulubionym modelu LLM (np. ChatGPT, Claude) i daj nam znać za pomocą kciuka w górę/dół na stronie raportu, czy ulepszona wersja była lepsza od oryginału!
> 
> *Ważne: Narzędzie jest w pełni darmowe i nie wymaga zakładania konta ani podawania danych osobowych. Nie wklejaj jednak w promptach żadnych haseł ani prywatnych kluczy API – nasz skaner preflight zablokuje je przed wysłaniem w trosce o Twoje bezpieczeństwo.*"

---

## 4. Questions to Ask Testers (Feedback Collection)
Prepare these questions to send in follow-up chats or a quick survey:
1. Czy ulepszona wersja promptu wygenerowana przez PromptPolish dała lepsze/bardziej precyzyjne rezultaty w Twoim LLM niż Twój oryginalny prompt?
2. Czy raport i punktacja (0–100) były dla Ciebie jasne i zrozumiałe?
3. Czy któraś część interfejsu (np. przełącznik udostępniania linku, kopiowanie promptu) była trudna w obsłudze lub niejasna?
4. Czy napotkałeś/aś na jakiekolwiek błędy (np. zawieszenie ładowania, brak odpowiedzi)?
5. Czy korzystał(a)byś z takiego narzędzia na co dzień w swojej pracy?

---

## 5. Success Criteria
The Private Beta is considered successful if:
- [ ] At least **5 testers** complete at least **2 prompt audits** each.
- [ ] **Feedback Signal**: At least 70% of feedback events rated as positive (`rating === 'up'`).
- [ ] **Performance Stability**: Zero `analysis_failed` events logged in the MVP metrics dashboard.
- [ ] **No Secrets Leak**: Zero occurrences of sensitive data or API keys stored in database tables or server logs.

---

## 6. Known Limits & Exclusions (Not in MVP Scope)
Ensure testers do not expect these features, as they are explicitly out-of-scope for the anonymous MVP:
- **No User Registration/Authentication**: Test histories are stored in cookies/local sessions only. Deleting cookies will reset history.
- **No Side-by-Side Multi-Model Audits**: Evaluates prompts against a single uniwersalny profile.
- **No File, PDF, or Markdown Exports**: Export buttons are hidden to prevent unfinished SAAS billing triggers from interrupting beta tests.
- **No Batch Auditing**: Tester must audit prompts one by one.
