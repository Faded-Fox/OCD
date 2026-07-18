# ERP Session Insights

A private, installable PWA that turns exported ERP (Exposure and Response Prevention)
session logs into trend charts and patterns — for the person doing the exposures and
their specialist to review together.

Everything runs on-device. There is no backend, no account, and no analytics; session
data lives only in this browser's IndexedDB until you export or delete it.

## What it does

- **Live session**: run an ERP exposure in real time — set up the hierarchy/rung and
  a pre-exposure SUDs rating, start the timer, tap to log a SUDs reading anytime
  (with a live-updating curve), then stop and fill in the rest to save. Progress is
  saved locally as you go, so an accidental reload mid-session doesn't lose it.
- **Journal**: two structured, timed prompts — a "Morning Anchor" (5–10 min) and an
  "OCD Wind Down" bedtime practice (10 min) — each with the sections, evidence
  citations, and compulsion-warning signs from their source templates built in. A
  third "Quick prompt" mode picks one short prompt at random from a pool spanning
  general intrusive thoughts, harm OCD, sexual intrusive thoughts, ROCD, postpartum,
  and CBT/ACT reframing, with a free-write box underneath. The saved-entries view is
  intentionally low-key (mainly for export or bringing to a therapist) since these
  prompts flag re-reading past entries — or rerolling to find "the right" one — for
  reassurance as a compulsion warning sign.
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
  signals, recent sessions.
- **Per-hierarchy view**: rung ladder, attempt counts, resistance streaks, peak-SUDs
  and habituation-speed trends.
- **Per-session view**: the full SUDs curve, compulsions targeted/resisted, techniques
  used, and notes.
- **Backup & restore**: export all data as JSON from Settings, then bring it back
  any time by pasting or uploading that same file on the Import screen — it's
  detected automatically and offered as a restore instead of parsed as a new
  import. This is what makes data survive deleting and reinstalling the app (e.g.
  on iPhone, or if iOS clears storage from disuse): export before you lose the
  app, restore after. A dashboard banner nudges you to export if it's been
  about a week since your last one (dismissible for a few days at a time) — all
  tracked locally, no notifications or background sync involved.
- **Settings**: export all data as JSON, or permanently delete everything on this
  device.

This is a descriptive tracking tool, not a diagnostic or treatment-decision tool — see
`ERPInsightsPWASpec.pdf` for the full spec this app was built from.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # type-check and build for production
npm run lint      # oxlint
```

Stack: React + Vite + TypeScript, Tailwind CSS v4, Recharts, Dexie (IndexedDB),
vite-plugin-pwa for the installable/offline app shell.
