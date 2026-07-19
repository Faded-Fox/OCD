# PocketFox Companion

A private, installable PWA that turns exported ERP (Exposure and Response Prevention)
session logs into trend charts and patterns — for the person doing the exposures and
their specialist to review together.

Everything runs on-device. There is no backend, no account, and no analytics; session
data lives only in this browser's IndexedDB until you export or delete it.

## What it does

- **Live session**: run an ERP exposure in real time — set up the hierarchy/rung and
  a pre-exposure SUDs rating, start the timer, tap to log a SUDs reading anytime
  (with a live-updating curve, visible from the very first reading), then stop and
  fill in the rest to save — the curve stays on that wrap-up screen too, updating
  live if a reading gets corrected before saving. Progress is saved locally as you
  go, so an accidental reload mid-session doesn't lose it. If the hierarchy matches
  a planned Fear Ladder, its rungs appear as a tappable list that autofills the
  scenario and target SUDs range.
- **Journal**: two structured, timed prompts — a "Morning Anchor" (5–10 min) and an
  "OCD Wind Down" bedtime practice (10 min) — each with the sections, evidence
  citations, and compulsion-warning signs from their source templates built in. A
  third "Quick prompt" mode picks one short prompt at random from a pool spanning
  general intrusive thoughts, harm OCD, sexual intrusive thoughts, ROCD, postpartum,
  and CBT/ACT reframing, with a free-write box underneath. The saved-entries view is
  intentionally low-key (mainly for export or bringing to a therapist) since these
  prompts flag re-reading past entries — or rerolling to find "the right" one — for
  reassurance as a compulsion warning sign.
- **Focus Plan**: a 5-step worksheet for tasks OCD makes hard to start or finish —
  describe the task, break it into smaller parts with time estimates, schedule each
  part with OCD-safe rewards, plan an ERP response to the intrusions/urges likely to
  show up, then come back after attempting the task for a no-judgment debrief (peak
  and end SUDs, what worked, what to flag for your therapist). Includes a collapsible
  reference card with the SUDs scale and defusion techniques for use during the task
  itself. Plans can be started, saved, and edited later once the debrief is ready.
- **Import** a Claude.ai conversation export (JSON) or pasted conversation text
  containing ERP session logs. Parsing happens entirely client-side.
- **Review** every parsed session before it's saved — fields the parser couldn't
  confidently extract are flagged for manual correction rather than guessed.
- **Add from a photo**: for handwritten paper logs, take or upload a photo and it's
  shown right next to a blank session form so you can quickly transcribe it yourself.
  There's no automatic handwriting recognition (on-device OCR was tested and isn't
  reliable enough to trust with real data) — the original photo is kept with the
  session instead, so anything a form field can't capture (like a hand-drawn SUDs
  curve) isn't lost.
- **Dashboard**: peak-SUDs trend across hierarchies, full-resistance rate, readiness
  signals, recent sessions. An "Elsewhere in the app" row ties in everything else —
  journal entries this week, focus plans awaiting a debrief, hierarchies with a
  planned ladder, and whether a Flare Guide has been set up — since otherwise
  those only show up once you go looking for them.
- **Fear Ladders**: plan a hierarchy's rungs — a number, a short description, and an
  optional target SUDs range for each — before you've ever run a session in it, since
  otherwise a hierarchy only exists once a session references it. Reachable from its
  own tab, not just from an existing hierarchy's page.
- **Per-hierarchy view**: rung ladder, attempt counts, resistance streaks, peak-SUDs
  and habituation-speed trends. Merges a planned Fear Ladder (if one exists) with
  actual logged progress — rungs you've planned but not attempted yet show up
  alongside ones you've already run sessions on, and the page itself works with zero
  sessions logged as long as a ladder is planned.
- **Per-session view**: the full SUDs curve, compulsions targeted/resisted, techniques
  used, and notes. Every field is editable in place after saving — fixing a wrong
  hierarchy, rung, or SUDs reading no longer means deleting and re-importing.
- **Sessions**: search and filter every logged session at once, across all
  hierarchies — free text (notes, scenario, compulsions, techniques), hierarchy,
  resistance, and date range, with sort by date or peak SUDs. The Dashboard's
  "Recent sessions" only shows the latest few; this is the full browsable list.
- **Backup & restore**: export all data as JSON from Settings, then bring it back
  any time by pasting or uploading that same file on the Import screen — it's
  detected automatically and offered as a restore instead of parsed as a new
  import. This is what makes data survive deleting and reinstalling the app (e.g.
  on iPhone, or if iOS clears storage from disuse): export before you lose the
  app, restore after. A dashboard banner nudges you to export if it's been
  about a week since your last one (dismissible for a few days at a time) — all
  tracked locally, no notifications or background sync involved.
- **Therapist summary**: a printable, human-readable report — resistance rates by
  hierarchy, sessions in a chosen date range, Focus Plan debriefs, planned fear
  ladders — separate from the raw JSON backup, which is for restoring the app
  rather than reading. "Print / Save as PDF" opens the browser's print dialog
  with the rest of the app hidden; "Share" sends a plain-text version through
  the native share sheet (or copies it to the clipboard), the same pattern as
  the Flare Guide. Journal entries only ever appear as a count, never their
  content, for the same reassurance-seeking reason the Journal tab itself stays
  low-key about past entries.
- **Flare Guide**: a guide for the people you trust — what a hard stretch looks
  like, what actually helps and what doesn't, what to do if things feel really
  bad, and a support contact if you want one. Meant to be handed over (give
  someone your phone, open to this page, or tap "Share" to send the filled-in
  sections as plain text through your phone's native share sheet — falls back
  to copying to the clipboard if the Web Share API isn't available). None of
  it is templated in the app's own source — every field starts blank and is
  written and stored entirely on this device, since unlike the SUDs scale or
  defusion techniques this content is inherently personal (and a real
  contact's name and phone number should never end up in a public repo).
- **Settings**: export all data as JSON, or permanently delete everything on this
  device.
- **Help**: a "?" icon in the header links to a single reference page summarizing
  what every tab does and a few workflows that aren't obvious from the UI alone
  (e.g. Focus Plan debriefs being meant for later, or the Import screen doubling
  as the restore-a-backup screen). The bottom of the page shows the app version,
  bumped with each shipped change, as a quick way to confirm a fix actually landed.

This is a descriptive tracking tool, not a diagnostic or treatment-decision tool — see
`ERPInsightsPWASpec.pdf` for the full spec this app was built from.

## Development

```bash
npm install
npm run dev        # start the dev server
npm run build      # type-check and build for production
npm run lint       # oxlint
npm test           # run the unit test suite once
npm run test:watch # re-run tests on file changes
```

Stack: React + Vite + TypeScript, Tailwind CSS v4, Recharts, Dexie (IndexedDB),
vite-plugin-pwa for the installable/offline app shell. Unit tests (Vitest) cover
`src/lib/parser.ts` (conversation/text import parsing), `src/lib/insights.ts`
(resistance rates, habituation timing, readiness signals, and the other derived
stats), and `src/lib/backup.ts` (backup detection, entry counting, and restoring
a session's photo from its exported data URL back into a Blob) — the parts most
likely to silently break as the app grows, since they're pure logic with a lot
of edge cases and no UI to visually catch a regression in. The GitHub Pages
deploy workflow runs lint and tests before
building, so a broken change won't reach the deployed app.

Every page except Dashboard is code-split (`React.lazy` in `App.tsx`) so a
first visit only pays for the JS the current route actually needs, and
Recharts specifically is deferred out of Dashboard itself into
`components/DashboardPeakChart.tsx` — a brand-new install has zero sessions,
so the Dashboard's empty state never needs a charting library at all. This
cut the JS a fresh install has to parse before first paint from ~868KB to
~354KB. The service worker still precaches every chunk in the background
regardless of whether it's been visited yet, so offline support isn't
affected.
