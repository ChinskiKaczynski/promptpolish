# PromptPolish MVP - Production Smoke Test Checklist

Use this checklist immediately after deploying PromptPolish to a live production environment (e.g. Vercel) to confirm system health.

---

## 1. Landing Page Integrity
- [ ] **Accessibility**: Open `https://your-app-domain.com` in a clean, non-cached browser (e.g., Incognito Mode).
- [ ] **Navbar Validation**: Verify the navbar header is centered, fits on mobile, and displays `"Działa bez konta"`.
- [ ] **Spelling**: Verify there are no typos in benefits or target segments (e.g., target cards show `"Konsultanci i trenerzy AI"` and `"Marketerzy i copywriterzy"`).
- [ ] **Footer**: Confirm that Politika prywatności, Regulamin, and copyright display correctly.

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

## 3. Result page rendering & UI Polish
- [ ] **Seamless Redirect**: Confirm that the analysis completes and redirects cleanly to `/result/[id]`.
- [ ] **Privacy Integrity**: 
  - Ensure the header is cleanly titled `"Raport audytu promptu"` (in sentence case).
  - Check that **NO** database/internal UUID or audit ID is printed in the public breadcrumbs.
  - Confirm **NO** AI provider names (`DeepSeek`, `OpenRouter`, `deepseek-v4-flash`) are visible anywhere.
- [ ] **Criteria Breakdown**: Click details in the detailed criteria card, and ensure all explanations and critiques expand smoothly without breaking layouts.
- [ ] **Responsive Code block**: Verify that multi-line statement wraps are correctly aligned with line numbers, and there is no horizontal layout scroll on mobile devices.

---

## 4. Copy Prompt & Feedback Tracking
- [ ] **Copy Action**: Click `"Kopiuj prompt"` in the improved prompt box.
  - Confirm it changes to `"Skopiowano!"` / `"Skopiowano prompt!"`.
  - Paste the clipboard contents in a blank document to verify correct copying.
- [ ] **Rating Dispatch**: Click the `"👍 Tak, bardzo"` button.
  - Confirm it immediately displays the message: `"Dziękujemy za przesłanie opinii!"`.
  - Click `"👎 Nie, słaba jakość"`. Verify a comment textbox expands smoothly to collect further details.

---

## 5. Sharing Controls & Public Scrubbing
- [ ] **Sharing Toggle activation**: Toggle the share switch in `"Udostępnij raport"`.
  - Confirm it generates a public token url (e.g., `/share/[token]`).
- [ ] **Public View**: Copy the public URL, open a separate Incognito browser window, and access the link.
  - Confirm the page renders cleanly under `"Publiczny raport"` branding.
  - Confirm **NO** sharing controls, favorite flags, feedback forms, or private database IDs are printed.
- [ ] **Public Revocation**: Go back to the private owner tab, toggle public sharing **OFF**, and go back to the Incognito tab.
  - Refresh the page and confirm it immediately returns a **404 Not Found** page.

---

## 6. Server Observability & Logs (Vercel / Supabase Dashboard)
- [ ] **No Permission Denied Errors**: Open the Vercel Realtime Logs or Supabase RLS Logs, and confirm that there are no Postgres policy rejects. No client-side `anon` queries should trigger exceptions.
- [ ] **No Semantic Validation Failures**: Confirm that the OpenRouter completions do not trigger Zod parsing failures or repeat retries due to semantic schema structural drift.
- [ ] **Correct Event Counts**: Run `npx tsx scripts/get-mvp-metrics.ts` in your shell, and confirm that only successful runs add to `"Completed Analyses"`, while preflight blocks and page refreshes do not increment the count.
