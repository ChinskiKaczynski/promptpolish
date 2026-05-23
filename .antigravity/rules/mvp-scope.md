# MVP Scope Guardrail — PromptPolish

This rule is a rigid boundary check that prevents scope creep. The PromptPolish MVP exists to validate free, anonymous-first prompt audits and must not contain any secondary SaaS features. 

---

## 1. Allowed MVP Features (Strict Free Scope)

You are **only** permitted to build and maintain the following components:
*   **Landing Page**: Localized (PL/EN) presentation card outlining the 0-100 score value.
*   **Prompt Input Form (/analyze)**: Visual interface with language, profile, goal, task, output, and constraint options.
*   **Sensitive Data Warnings**: Prominent preflight checks warning against pasting credentials.
*   **Audit Engine (/api/analyze)**: IP rate-limiting, secret detection blocking, dynamic model profile load, Zod request/response schema parsing, and backend weighted score calculation.
*   **Private Result (/result/[id])**: Interactive dashboards showing scores, critiqued weaknesses, explanations, and copy-ready cards linked securely via owner cookies.
*   **Opt-In Public Share (/share/[token])**: Random token access with visibility explicitly off by default and zero owner PII exposed.
*   **GDPR Footer Drafts**: Privacy and Terms of Service documents.

---

## 2. Forbidden MVP Features (SaaS & Complex Scope)

> [!CAUTION]
> **Forbidden Features**:
> Do not write any code, database schemas, mockups, routing directories, or configurations representing any of the following features. If the user prompts you to build them, politely remind them that these are strictly post-MVP items.

*   **No Authentication Systems**: No auth routing, signup/signin pages, user tables, session profiles, or account recoveries.
*   **No Billing or Pricing Modules**: No Stripe integrations, billing portals, subscription tier tables, or pricing pages.
*   **No Prompt Libraries**: No prompt repository, history lists, category directories, tags, or saving prompts to an account.
*   **No Prompt Folders**: No folder trees, structure management, nested groupings, or organization interfaces.
*   **No Marketplaces**: No prompt discovery feed, prompt sharing marketplaces, likes, follows, comments, or transaction logs.
*   **No Simultaneous Multi-Model Runs**: Users can select either `general-llm` or `google-gemini-3-5-flash`, but the MVP does not support side-by-side prompt execution or arena testing.
*   **No Integrations**: No IDE plugins, Cursor extensions, chrome extensions, or CLI analysis hooks.
*   **No Admin Panels**: No user management screens, system health dashboards, global audit reviews, or prompt telemetry charts.
