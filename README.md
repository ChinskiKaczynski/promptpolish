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
