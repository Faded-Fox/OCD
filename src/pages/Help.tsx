import { Link } from 'react-router-dom'
import { APP_VERSION } from '../lib/version'

interface HelpTopic {
  title: string
  body: string[]
}

interface HelpGroup {
  title: string
  topics: HelpTopic[]
}

const GROUPS: HelpGroup[] = [
  {
    title: 'Getting started',
    topics: [
      {
        title: 'Dashboard',
        body: [
          'A summary of everything logged so far: peak-SUDS trend across hierarchies, rungs attempted, readiness signals, and the most recent sessions.',
          'If it\'s been about a week since your last export, a banner appears here nudging you to back up — "Remind me later" snoozes it for a few days, "Export now" downloads a backup and clears it.',
          'An "Elsewhere in the app" row surfaces what\'s happening outside of Sessions — journal entries logged this week, focus plans still awaiting a debrief, how many hierarchies have a planned ladder, and whether a Flare Guide has been set up. Each tile links straight to that tab.',
          'The small 🦊 next to "Start live session" jumps straight to the Journal tab\'s "Intrusive thought" capture screen — a shortcut for the moment it\'s actually useful in, without a label, since what it does is already explained there.',
        ],
      },
    ],
  },
  {
    title: 'ERP sessions',
    topics: [
      {
        title: 'Sessions',
        body: [
          'Search and filter every logged session at once — free text across notes, scenario, compulsions, and techniques, plus hierarchy, resistance, exposure type, and date-range filters. Sort by date or peak SUDS.',
          'The Dashboard only shows the latest few sessions; this is the full browsable history.',
        ],
      },
      {
        title: 'Live',
        body: [
          'Run an ERP exposure in real time. Set up the hierarchy, rung, and a pre-exposure SUDS rating, start the timer, and tap to log a SUDS reading anytime — the curve updates live.',
          'Progress saves locally as you go, so an accidental reload mid-session won\'t lose it — reopening the app picks the running session back up.',
          'If the hierarchy you type matches a planned Fear Ladder, its rungs show up as tappable rows — picking one fills in the rung number, scenario, and target SUDS range for you, though you can still edit any of it afterward.',
          'Hierarchy and Rung also suggest matches from your own past sessions as you type or focus the field (Rung narrows to whatever rungs you\'ve logged under the hierarchy you picked), and previously-used target SUDS ranges for that hierarchy show up as tappable chips under the range field — all drawn from sessions already on this device, nothing built in.',
          'Once running, "🦊 Rough stretch? Something to lean on" opens a card offering a random defusion technique or a fox fact — something to hold onto while riding the exposure out, not a suggestion to stop it, since leaving early because SUDS is high would just be another compulsion. It also opens on its own if SUDS peaks at 8+ and stays there for 15+ minutes; closing it only suppresses that one occurrence, not the next rough stretch.',
          'Stop the exposure to fill in the rest (compulsions, techniques, notes) and save — the SUDS curve stays visible on this wrap-up screen too, and updates live if you correct a reading before saving.',
          'Typing in "Techniques used" or "Compulsions targeted" suggests matches as you go — techniques from a small built-in starter list plus anything you\'ve typed before, compulsions purely from your own past sessions (too personal for a built-in list). Tap a suggestion or arrow-key to it and hit Enter; nothing is ever picked automatically.',
          'An optional "Exposure type" field tags the session as in-vivo, imaginal, or interoceptive — leave it as "Not specified" if that distinction doesn\'t matter for what you\'re tracking.',
          'If you\'ve written anything on the Values page, one is shown at random before you start — a quick reminder of why the exposure is worth doing, not just what it is.',
        ],
      },
      {
        title: 'Editing a saved session',
        body: [
          'Open any session\'s page and use "Edit session" to change anything — hierarchy, rung, SUDS, readings, compulsions, notes, all of it. Saved edits update the session in place.',
        ],
      },
    ],
  },
  {
    title: 'Journal',
    topics: [
      {
        title: 'Journal',
        body: [
          'Five ways to journal. "Morning Anchor" (5–10 min) and "OCD Wind Down" (10 min) are structured, timed prompts with built-in evidence citations and compulsion-warning signs.',
          '"Quick prompt" picks one short prompt at random from a pool spanning general intrusive thoughts, harm OCD, sexual intrusive thoughts, ROCD, postpartum, and CBT/ACT reframing — reroll for a different one, then free-write underneath.',
          '"Intrusive thought" is a one-tap capture for noticing a thought without engaging it: tag which theme it is (contamination, harm, relationship, moral, checking, health, existential, other) and save — there\'s no text field on purpose, since writing the thought out is still a way of engaging with it. Saving one shows a "Caught the fox!" moment instead of the usual confirmation, since noticing without acting is the whole point — plus a lifetime count of how many times that\'s happened, not a daily streak.',
          '"Obsessive Thought" is a structured CBT worksheet for testing one intrusive thought\'s believability, rating it before and after. Unlike the other timed journals, it moves through five fixed sections one at a time — Automatic Thought, Evidence For, Evidence Against, a Balanced/Alternative Thought, and Close — each with its own countdown that prompts you (without forcing you) to move on once it hits zero, all inside an overall 30-minute hard cap. There\'s no way back to an earlier section once you\'ve moved on, on purpose — the point is writing it once, not revising it.',
          'The saved-entries view is intentionally low-key: the structured templates and quick prompts flag re-reading past entries — or rerolling to find "the right" one — as a reassurance-seeking compulsion warning sign.',
          'Morning Anchor, OCD Wind Down, and Obsessive Thought entries show how long the entry actually took next to its date, timed live while writing. Quick prompts don\'t show a duration since that mode has no timer to begin with.',
          'A "How do you feel?" mood check-in — inside every entry mode — lets you tap one of 12 fox-illustrated emotions to save with the entry; tap it again to clear it. It\'s entirely optional, and picking one shows its related feeling words underneath (e.g. Happy also covers Optimistic, Proud, Content…). Whatever you pick shows up next to that entry in the saved-entries list.',
        ],
      },
    ],
  },
  {
    title: 'Planning & support',
    topics: [
      {
        title: 'Focus Plan',
        body: [
          'A 5-step worksheet for tasks OCD makes hard to start or finish: describe the task, break it into smaller parts with time estimates, schedule each part with OCD-safe rewards, then plan an ERP response to the intrusions and urges likely to show up.',
          'Step 5 (the debrief — peak/end SUDS, what worked, what to flag for your therapist) is meant to be filled in after you\'ve actually attempted the task, which might be hours or days later. Plans save with "Debrief pending" and reopen for editing at any time — you don\'t have to finish it in one sitting.',
          'A collapsible "ERP toolkit" card at the bottom (SUDS scale, defusion techniques) is meant to be handy to reopen during the task itself, not just while planning.',
        ],
      },
      {
        title: 'Fear Ladders',
        body: [
          'Plan a hierarchy\'s rungs — a number, a short description, and an optional target SUDS range each — before you\'ve ever logged a session in it. Normally a hierarchy only exists once a session references it; this is the way around that.',
          'Once you do start logging sessions, the per-hierarchy view (reached from the Dashboard or from a session\'s page) automatically merges the plan with actual progress: rungs you\'ve planned but not attempted yet sit alongside ones you\'ve already run, with attempt counts and readiness signals filled in as they happen.',
          'It also shows up on the Live tab: type a hierarchy that matches a planned ladder and its rungs appear as a pickable list, autofilling the scenario and target range.',
          'Rungs with a description already filled in start collapsed to a one-line summary when you reopen a ladder — tap one to expand it back to the editable fields.',
        ],
      },
      {
        title: 'Values',
        body: [
          "ERP isn't about feeling less anxious — it's about being able to live the life anxiety gets in the way of. This page is a short list of the reasons this is worth doing at all: people, hobbies, whatever actually matters to you.",
          'Each one is an icon or emoji, a short label, and an optional note on why it matters. Nothing is built in — every value starts blank and is written and stored entirely by you on this device.',
          'One is shown at random on the Live tab before you start an exposure ("Remember — you\'re doing this because ___ matters"), as a reminder of the actual point of the hard part that\'s about to happen.',
        ],
      },
      {
        title: 'Flare Guide',
        body: [
          "A guide for the people you trust — what a hard stretch looks like for you, what actually helps, what doesn't, and what to do if things feel really bad. Meant to be handed over: give someone your phone open to this page.",
          'Everything here, including a support contact\'s name and phone number if you add one, starts blank and is written and stored entirely by you on this device — none of it is built into the app itself.',
          'Use "Edit" to fill it in or update it any time; the reading view only shows sections you\'ve actually written something in.',
          '"Share" sends the filled-in sections as plain text to your phone\'s native share sheet (Messages, Mail, AirDrop, whatever you pick) — this is your device handing text to another app you choose, not this app sending anything anywhere on its own. If sharing isn\'t available, it copies the text to your clipboard instead so you can paste it in manually.',
        ],
      },
    ],
  },
  {
    title: 'Your data',
    topics: [
      {
        title: 'Privacy',
        body: [
          'Everything lives only in this browser\'s local storage — there\'s no account, no cloud sync, and nothing is ever uploaded anywhere. There\'s no recovery if the app is deleted or the browser clears its storage (which iOS can do on its own after a period of disuse), which is why exporting a backup matters.',
        ],
      },
      {
        title: 'Import',
        body: [
          '"Paste conversation text" extracts session data from plain pasted text or a JSON conversation export (including exports from Claude.ai) — everything happens on this device, nothing is uploaded. Every parsed session is shown for review before saving; anything the parser couldn\'t confidently extract is flagged rather than guessed.',
          '"Add from a photo" is for handwritten paper logs: take or upload a photo and it\'s shown right next to a blank form so you can transcribe it yourself. There\'s no automatic handwriting recognition — on-device OCR was tested and wasn\'t reliable enough to trust — so the original photo is kept with the session, in case a form field can\'t capture something like a hand-drawn SUDS curve.',
          'This screen is for bringing session data in, not for restoring a PocketFox backup — if you paste a backup file here by mistake, a notice points you to Settings instead. Restoring a backup lives entirely in Settings → "Backup & restore" now, alongside the export button.',
        ],
      },
      {
        title: 'Backup & restore',
        body: [
          'Settings → "Export all data as JSON" downloads everything (sessions, journal entries, focus plans, fear ladders, flare guide, values) into one file. Keep that file somewhere that survives an app deletion — the Files app, iCloud Drive, emailing it to yourself.',
          'To bring it back, paste or upload that same file in Settings → "Backup & restore." It restores by matching IDs, so restoring the same backup twice (or onto a device with some overlapping data) won\'t create duplicates.',
        ],
      },
      {
        title: 'Storage persistence & deleting data',
        body: [
          'Settings → "Storage persistence" asks the browser to mark this data as persistent, which can lower the odds of it being cleared automatically — but support and behavior vary by browser, and it\'s a best-effort signal, not a guarantee.',
          'Settings also shows how much is stored on this device, and a "Delete all data" option that permanently erases everything after typing "delete" to confirm.',
        ],
      },
    ],
  },
  {
    title: 'Therapist Summary',
    topics: [
      {
        title: 'Therapist Summary',
        body: [
          'A printable report to bring to a therapy session — rungs attempted by hierarchy, sessions in the selected period, Focus Plan debriefs, and planned fear ladders — separate from the raw JSON backup in Settings, which is for restoring the app rather than reading.',
          'From/To narrows it to a date range (e.g. since the last appointment); leave both blank for all-time. "Print / Save as PDF" opens the browser\'s print dialog with the rest of the app hidden, and "Share" sends a plain-text version through the native share sheet (or copies it to the clipboard if that\'s not available), the same pattern as the Flare Guide\'s Share button.',
          "Journal entries only ever show up here as a count, never their content, for the same reassurance-seeking reason the Journal tab's own saved-entries view stays low-key.",
        ],
      },
    ],
  },
]

export default function Help() {
  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <Link to="/" className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Help</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          What each tab does, and a few workflows that aren't obvious from the UI alone.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {GROUPS.map((group) => (
          <details key={group.title} className="group rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 open:pb-2 dark:bg-slate-900 dark:ring-slate-800">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800 marker:content-none dark:text-slate-100">
              <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>
              {group.title}
            </summary>
            <div className="flex flex-col gap-4 px-4 pb-2">
              {group.topics.map((topic) => (
                <div key={topic.title} className="flex flex-col gap-2">
                  {group.topics.length > 1 && (
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {topic.title}
                    </h3>
                  )}
                  {topic.body.map((p, i) => (
                    <p key={i} className="text-sm text-slate-600 dark:text-slate-300">
                      {p}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </details>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        This app is a descriptive tracking tool, not a diagnostic or treatment-decision tool. Bring what you log
        here to your OCD specialist rather than acting on it alone.
      </p>

      <p className="text-center text-xs text-slate-300 dark:text-slate-600">{APP_VERSION}</p>
    </div>
  )
}
