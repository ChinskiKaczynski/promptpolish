# Production Smoke Test Checklist

Use this checklist immediately after deploying PromptPolish to a live production environment (e.g. Vercel) to confirm system health.

---

## 1. Landing Page Integrity
- [ ] **Accessibility**: Open your production domain in a clean, non-cached browser (e.g., Incognito Mode).
- [ ] **Navbar Validation**: Verify the navbar header is centered, fits on mobile, and displays `"Działa bez konta"`.
- [ ] **Footer**: Confirm that Privacy Policy, Terms, and copyright display correctly.

---

## 2. Analyze Flow & Security Preflight
- [ ] **Preflight Mitigation**: Type `sk-proj-test123456SECRETAPIKEYFORTESTS` into the prompt input block.
  - Verify that the `"Audytuj prompt"` button is immediately disabled.
  - Confirm the warning panel correctly lists high-risk pattern detections and stops the audit request from sending.
- [ ] **Audit Dispatch**: Paste a clean, standard prompt (e.g., `"Napisz krótki post na LinkedIn o nowym produkcie SaaS"`).
  - Select working language as Polish (`PL`).
  - Click `"Przeprowadź audyt promptu"`.
  - Confirm the loader appears with the text `"Trwa inżynieryjny audyt promptu..."`.

---

## 3. Result Page Rendering & UI Polish
- [ ] **Redirect**: Confirm that the analysis completes and redirects cleanly to `/result/[id]`.
- [ ] **Privacy Integrity**: 
  - Ensure the header is cleanly titled `"Raport audytu promptu"`.
  - Check that **NO** database/internal UUID or audit ID is printed in the public breadcrumbs.
  - Confirm **NO** AI provider names (e.g. `Gemini`, `gemini-2.5-flash`) are visible on user-facing results.
- [ ] **Criteria Breakdown**: Click details in the detailed criteria card, and ensure all explanations and critiques expand smoothly without breaking layouts.

---

## 4. Copy Prompt & Feedback Tracking
- [ ] **Copy Action**: Click `"Kopiuj prompt"` in the improved prompt box.
  - Confirm it changes to `"Skopiowano!"` / `"Skopiowano prompt!"`.
- [ ] **Rating Dispatch**: Click the upvote button.
  - Confirm it immediately displays the feedback message.
  - Click downvote button. Verify the comment textbox expands smoothly to collect details.

---

## 5. Sharing Controls & Public Scrubbing
- [ ] **Sharing Toggle**: Toggle the share switch.
  - Confirm it generates a public token url (e.g., `/share/[token]`).
- [ ] **Public View**: Copy the public URL, open a separate Incognito browser window, and access the link.
  - Confirm the page renders cleanly under public branding.
  - Confirm **NO** sharing controls, favorite flags, feedback forms, or private database IDs are printed.
- [ ] **Public Revocation**: Go back to the private owner tab, toggle public sharing **OFF**, and go back to the Incognito tab.
  - Refresh the page and confirm it immediately returns a **404 Not Found** page.

---

## 6. Server Observability & Logs (Vercel / Supabase Dashboard)
- [ ] **No Permission Denied Errors**: Open the Vercel Realtime Logs or Supabase Logs, and confirm that there are no Postgres policy rejects. No client-side `anon` queries should trigger exceptions.
- [ ] **No Semantic Validation Failures**: Confirm that completions do not trigger Zod parsing failures or repeat retries.
- [ ] **Correct Event Counts**: Run the metrics script `pnpm exec tsx scripts/get-mvp-metrics.ts` in your shell, and confirm that successful runs add to Completed Analyses, while preflight blocks do not.
