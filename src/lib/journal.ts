export type JournalType = 'morning' | 'evening'

export interface JournalField {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
}

export interface JournalSection {
  title: string
  helper?: string
  evidence?: string
  warning?: string
  fields: JournalField[]
}

export interface JournalCompulsionWarning {
  heading: string
  intro?: string
  items: string[]
  footer: string
}

export interface JournalTemplate {
  type: JournalType
  title: string
  subtitle: string
  instructions: string
  timerMinutes: number
  sections: JournalSection[]
  compulsionWarning: JournalCompulsionWarning
}

export interface JournalEntry {
  id: string
  type: JournalType
  date: string
  createdAt: string
  fields: Record<string, string>
}

export const JOURNAL_TEMPLATES: Record<JournalType, JournalTemplate> = {
  morning: {
    type: 'morning',
    title: 'Morning Anchor',
    subtitle: 'A journal prompt for OCD mornings',
    instructions: '5–10 minutes. Set a timer. Write quickly, without editing. No grammar required.',
    timerMinutes: 5,
    sections: [
      {
        title: 'Part 1 — Body & Present Moment',
        helper: 'Gets you out of your head. Write whatever comes, even one word per blank.',
        fields: [
          {
            key: 'body_present_moment',
            label: 'Fill in the blanks',
            placeholder:
              'Right now, my body feels ______. The first thing I notice in this room is ______. Today I am physically located in ______.',
            multiline: true,
          },
        ],
      },
      {
        title: 'Part 2 — Acknowledge Without Analysing',
        helper: "Name the OCD spike. Don't engage it. Pivot.",
        fields: [
          {
            key: 'acknowledge',
            label: 'Fill in the blanks',
            placeholder:
              "OCD is handing me [thought / feeling / theme] this morning. I notice it. I'm not going to solve it right now. What I'm actually doing today is ______.",
            multiline: true,
          },
        ],
      },
      {
        title: 'Part 3 — One Values-Based Intention',
        helper: 'Keep it concrete and singular — one thing only.',
        fields: [
          {
            key: 'intention',
            label: 'Fill in the blank',
            placeholder: 'One thing I want to move toward today, regardless of how I feel, is ______.',
            multiline: true,
          },
        ],
      },
    ],
    compulsionWarning: {
      heading: 'What to watch for',
      intro: 'Journaling can become a compulsion. Stop if you notice:',
      items: [
        "Rewriting until the entry 'feels right'",
        'Analysing the intrusive thought in detail',
        'Using the entry to seek reassurance or certainty',
        "Asking 'why do I feel this way?' on a loop",
      ],
      footer:
        'If a morning is too activated to write, Part 1 alone is enough. Run this with your provider to confirm it fits your current ERP work.',
    },
  },
  evening: {
    type: 'evening',
    title: 'OCD Wind Down Journal',
    subtitle: 'A structured 10-minute bedtime practice',
    instructions: 'Close this journal when the timer ends. Do not re-read, edit, or add.',
    timerMinutes: 10,
    sections: [
      {
        title: "Section 1 — Offload: Tomorrow's Tasks",
        evidence: 'Scullin et al., 2018 — polysomnographic RCT (NIH-funded)',
        helper:
          'Write 3–5 specific tasks for tomorrow. Be brief and concrete. This is not planning — it is permission to stop thinking about them tonight.',
        fields: [1, 2, 3, 4, 5].map((n) => ({ key: `offload_${n}`, label: `Task ${n}` })),
      },
      {
        title: 'Section 2 — Anchor: Three Things I Noticed Today',
        evidence: 'Digdon & Koble RCT (2011) — gratitude reduces pre-sleep arousal',
        helper:
          'Name three things from today — specific, sensory, concrete. Not "I\'m grateful for my family." Something you actually noticed.',
        fields: [1, 2, 3].map((n) => ({ key: `anchor_${n}`, label: `Thing ${n}` })),
      },
      {
        title: "Section 3 — Observe, Don't Analyze: Thoughts as Weather",
        evidence: 'ACT defusion framework — Twohig et al. (2015); anti-rumination design',
        helper:
          'If any intrusive thoughts, obsessions, or compulsive urges showed up today, note them like a scientist logging data — not problems to solve.',
        warning: 'Do NOT write about what the thought means. Do NOT write about whether it is true or false.',
        fields: [
          {
            key: 'observe',
            label: 'Log it',
            placeholder: 'The [thought] showed up. I noticed it. I did / did not act on it. I move on.',
            multiline: true,
          },
        ],
      },
      {
        title: 'Section 4 — Values Compass',
        evidence: 'ACT values + committed action — Twohig et al. (2015)',
        helper:
          'One sentence: did my actions today move toward something that matters to me, or away from it? No judgment. Just a compass reading.',
        fields: [{ key: 'values_compass', label: 'Compass reading', multiline: true }],
      },
      {
        title: 'Section 5 — Close',
        evidence: 'Worry postponement / cognitive containment — Borkovec framework',
        helper: 'Write these words, then close the journal:',
        fields: [
          {
            key: 'close',
            label: 'Closing line',
            placeholder: 'Do not re-open this journal tonight.',
          },
        ],
      },
    ],
    compulsionWarning: {
      heading: 'Red flags: signs this journal may be becoming a compulsion',
      items: [
        'Needing to write "until it feels right" rather than stopping at the timer',
        'Re-reading previous entries for reassurance',
        'Writing the same thought multiple times or in different ways',
        "Feeling that if you don't journal, something bad will happen",
        'Distress when the entry doesn\'t feel "complete"',
      ],
      footer:
        'If any of the above apply, bring this journal to your next session with your OCD therapist. This template is an adjunct to, not a replacement for, ERP/CBT/ACT treatment. IOCDF therapist directory: iocdf.org/find-help',
    },
  },
}
