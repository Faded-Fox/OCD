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
  {
    name: 'Name the Story',
    description:
      'Give the pattern a title — e.g. "the not-good-enough story" — then say: "Ah, there\'s that story again." You don\'t have to argue with it or fix it. Naming creates space; just notice it and return to what you were doing.',
  },
  {
    name: 'Physicalise the Thought',
    description:
      "Ask what the thought would look like if it had a shape, color, texture, weight. Notice where you feel it in your body. Watching it with curiosity instead of alarm often shows it shifting on its own.",
  },
  {
    name: 'The Observer Self',
    description:
      'Say silently: "I notice I am having the thought that ___." There\'s a \'you\' doing the noticing, separate from the thought itself. You are not your thoughts — rest in being the noticer, not the thought.',
  },
  {
    name: 'Leaves on a Stream',
    description:
      "Picture a gentle stream. Place each thought on a leaf and watch it float past. You're standing on the bank, not in the water — you don't need to solve the thought, just watch it pass.",
  },
  {
    name: 'Thank Your Mind',
    description:
      'When a thought arrives, say (silently or aloud): "Thank you, mind — I see you\'re trying to protect me." You don\'t have to agree with it. Fighting a thought fuels it; thanking it defuses it.',
  },
  {
    name: 'Radio in the Background',
    description:
      "Imagine your thoughts as a radio playing in another room. You can hear it without listening to it — focus on what your hands or feet are doing right now. You can function even while the radio plays.",
  },
  {
    name: 'Slow It Down',
    description:
      'Notice a spiralling thought and repeat its core word slowly, ten times — e.g. "worthless… worthless… worthless…". Repetition dissolves the illusion of meaning; the words are just sounds, not facts.',
  },
  {
    name: 'Urge Surfing',
    description:
      "Notice the urge pulling you in and rate its intensity 1–10. Breathe and watch it rise, peak, and begin to fall like a wave, then re-rate it — it will have dropped. Every wave breaks; you don't have to act on it.",
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
