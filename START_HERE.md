# START HERE

## 1. Otwórz folder w Antigravity

Otwórz główny folder `promptpolish-antigravity-starter`.

## 2. Najpierw daj agentowi to polecenie

```text
Read AGENTS.md, docs/product-mvp.md, docs/architecture.md, docs/model-profile-policy.md, docs/ai-safety.md, docs/gemini-integration-decision.md, docs/supabase-access-policy.md and .antigravity/rules/project-rules.md.

Act as a senior full-stack engineer building a small production MVP.

Task:
Review the current starter repo before implementation.

Rules:
- Do not write code.
- Do not modify files.
- Identify missing decisions.
- Identify outdated technical assumptions.
- Identify security and privacy risks.
- Identify scope creep.
- Return a numbered implementation sequence.

Acceptance criteria:
- No features outside MVP.
- Keep opt-in public /share/[token] in MVP.
- Each step has a clear output.
- Each step has validation commands.
- Each risky change requires human review.
- AI SDK integration must use current structured output pattern unless explicitly pinned otherwise.
- Gemini API changelog must be checked before provider implementation.
- Private Supabase reads must be server-only.
- Sensitive-data detection must be included before sending prompts to provider.
```

## 3. Potem realizuj misje po kolei

Zobacz `MISSIONS_FOR_ANTIGRAVITY.md`.

## 4. Nie rób od razu produkcyjnej integracji AI

Najpierw:

1. dokumenty i review,
2. UI mock,
3. scoring,
4. sensitive-data detector,
5. Supabase schema,
6. dopiero potem Gemini docs check + smoke test.
