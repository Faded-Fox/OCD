# ERP Session Insights

A private, installable PWA that turns exported ERP (Exposure and Response Prevention)
session logs into trend charts and patterns — for the person doing the exposures and
their specialist to review together.

Everything runs on-device. There is no backend, no account, and no analytics; session
data lives only in this browser's IndexedDB until you export or delete it.

## What it does

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
