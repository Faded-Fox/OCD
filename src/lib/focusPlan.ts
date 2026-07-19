export interface FocusPlanTaskStep {
  step: string
  timeRequired: string
  whatYouNeed: string
}

export interface FocusPlanScheduleRow {
  schedule: string
  reminders: string
  rewards: string
}

export interface FocusPlanIntrusionRow {
  intrusion: string
  compulsion: string
  response: string
}

export interface FocusPlanEntry {
  id: string
  date: string
  createdAt: string
  updatedAt: string
  // Step 1 — the task and why it's hard
  taskDescription: string
  // Step 2 — smaller steps, time estimate, what's needed
  taskBreakdown: FocusPlanTaskStep[]
  // Step 3 — schedule, reminders, OCD-safe rewards
  schedule: FocusPlanScheduleRow[]
  // Step 4 — anticipated intrusions and planned ERP response
  intrusions: FocusPlanIntrusionRow[]
  // Step 5 — post-task debrief
  completed: 'yes' | 'no' | 'partial' | null
  intrusionsThatShowedUp: string
  compulsionsResisted: string
  compulsionsGaveInTo: string
  peakSuds: number | null
  endSuds: number | null
  whatWorked: string
  whatWouldDoDifferently: string
}

export const SUDS_SCALE: { range: string; label: string }[] = [
  { range: '0', label: 'No anxiety — completely calm' },
  { range: '1–3', label: 'Mild / barely noticeable' },
  { range: '4–5', label: 'Moderate / uncomfortable but manageable' },
  { range: '6–7', label: 'High / very uncomfortable' },
  { range: '8–9', label: 'Severe / barely tolerable' },
]

export const DEFUSION_TECHNIQUES: { name: string; description: string }[] = [
  {
    name: 'KOCD 101.3',
    description:
      "When intrusive thoughts are loud, tune them like a radio station — annoying background noise, not truth. You don't have to change the channel.",
  },
  {
    name: 'Silly Announcer Voice',
    description:
      "Replay the intrusive thought in an absurd announcer voice. It doesn't make it go away — it reminds you it's just a thought.",
  },
  {
    name: 'Label It',
    description: '"OCD is telling me ___. I notice that. I\'m going to continue anyway."',
  },
  {
    name: 'Ride the Wave',
    description:
      "Anxiety peaks and then falls. You don't have to make it stop — just let it crest. Keep working while it does.",
  },
  {
    name: 'Distraction is valid',
    description:
      "Focusing on the task itself is a legitimate strategy. You don't have to process the thought. Keep your hands busy.",
  },
]

export const FOCUS_PLAN_AFFIRMATION = 'I love you. This is just your brain, not you. Things are okay.'

export const THERAPIST_FLAGS: string[] = [
  "SUDs peaked above 8 and didn't come down within 45 minutes",
  'You completed a compulsion and the task still feels undone / not "right"',
  'Task avoidance is increasing despite repeated attempts',
  'This worksheet itself is starting to feel like a checking compulsion',
]

export function createEmptyFocusPlan(): FocusPlanEntry {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    date: now.slice(0, 10),
    createdAt: now,
    updatedAt: now,
    taskDescription: '',
    taskBreakdown: [],
    schedule: [],
    intrusions: [],
    completed: null,
    intrusionsThatShowedUp: '',
    compulsionsResisted: '',
    compulsionsGaveInTo: '',
    peakSuds: null,
    endSuds: null,
    whatWorked: '',
    whatWouldDoDifferently: '',
  }
}
