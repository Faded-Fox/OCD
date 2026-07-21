export type JournalType = 'morning' | 'evening'

export interface FeelingChartEntry {
  emotion: string
  related: string[]
}

/** From a hand-drawn "What Does the Fox Feel?" feelings wheel — a reference for
 *  naming an emotion while journaling, not a data field stored anywhere. Some
 *  emotions (Frustrated, Surprised) had no related words in the source chart,
 *  and a couple of words (e.g. Frustrated, Lonely) intentionally appear both as
 *  their own entry and as a related word under another, matching the original. */
export const FEELINGS_CHART: FeelingChartEntry[] = [
  {
    emotion: 'Angry',
    related: [
      'Hostile',
      'Hurt',
      'Rage',
      'Stressed',
      'Critical',
      'Annoyed',
      'Selfish',
      'Jealous',
      'Irritated',
      'Skeptical',
      'Frustrated',
    ],
  },
  {
    emotion: 'Calm',
    related: [
      'Connected',
      'Trusting',
      'Loving',
      'Thoughtful',
      'Secure',
      'Relaxed',
      'Safe',
      'Relief',
      'Thankful',
      'Belonging',
      'Serene',
      'Sensitive',
    ],
  },
  { emotion: 'Frustrated', related: [] },
  {
    emotion: 'Happy',
    related: ['Optimistic', 'Hopeful', 'Playful', 'Proud', 'Content', 'Joyful', 'Accepted', 'Valued', 'Interested', 'Curious'],
  },
  { emotion: 'Nervous', related: ['Threatened', 'Anxious', 'Worried'] },
  {
    emotion: 'Scared',
    related: ['Weak', 'Worthless', 'Insecure', 'Inferior', 'Confused', 'Perplexed', 'Rejected', 'Excluded'],
  },
  { emotion: 'Shy', related: ['Ashamed', 'Embarrassed'] },
  { emotion: 'Surprised', related: [] },
  {
    emotion: 'Sad',
    related: ['Guilty', 'Remorseful', 'Fragile', 'Vulnerable', 'Hopeless', 'Lonely', 'Miserable', 'Depressed'],
  },
  { emotion: 'Bored', related: ['Indifferent'] },
  { emotion: 'Lonely', related: ['Isolated'] },
  { emotion: 'Excited', related: ['Energetic'] },
]

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

export interface StructuredJournalEntry {
  id: string
  type: JournalType
  date: string
  createdAt: string
  fields: Record<string, string>
  /** Seconds actually spent, timed live while writing. Absent on entries saved
   *  before this was tracked — never backfilled or guessed. */
  durationSeconds?: number
}

/** A single random short prompt (as opposed to the timed, multi-section
 *  structured templates below) paired with one free-write response. */
export interface QuickPrompt {
  id: string
  category: string
  text: string
}

export interface QuickPromptEntry {
  id: string
  type: 'quick'
  date: string
  createdAt: string
  promptId: string
  promptCategory: string
  promptText: string
  response: string
}

export type JournalEntry = StructuredJournalEntry | QuickPromptEntry

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

// One entry per short prompt, grouped by `category`. Original wording covering
// the same OCD-subtype ground a specialist would (general intrusive thoughts,
// harm, sexual/SO-OCD, ROCD, postpartum, CBT/ACT reframing) — not sourced from
// any single outside article.
export const QUICK_PROMPTS: QuickPrompt[] = [
  {
    id: 'general-1',
    category: 'General',
    text: "State today's thought as plainly as you can, then add \"I'm noticing I'm having the thought that…\" in front of it. What changes when you frame it that way?",
  },
  {
    id: 'general-2',
    category: 'General',
    text: 'What did you do the last time this thought showed up — argue with it, push it away, ask for reassurance? How did that go?',
  },
  {
    id: 'general-3',
    category: 'General',
    text: 'Where does this thought land in your body? Track the sensation for a minute without trying to change it.',
  },
  {
    id: 'general-4',
    category: 'General',
    text: 'If this exact thought showed up in a friend\'s head instead of yours, what would you say to them?',
  },
  {
    id: 'general-5',
    category: 'General',
    text: 'Set a timer for two minutes and just let the thought sit there, unanswered. What happened when the timer went off?',
  },
  {
    id: 'general-6',
    category: 'General',
    text: "What's different in your day, week, or environment on days this thought shows up more?",
  },
  {
    id: 'general-7',
    category: 'General',
    text: "A thought crossing your mind and a thought being true are two different things. Where's the gap between those, for you, right now?",
  },
  {
    id: 'general-8',
    category: 'General',
    text: "If today's intrusive thought were weather, what would it be — and can you let it pass through without chasing it away?",
  },
  {
    id: 'harm-1',
    category: 'Harm OCD',
    text: "Write the general shape of the thought — no need for exact wording — then underneath it write: \"A thought arriving is not the same as a thought being wanted.\"",
  },
  {
    id: 'harm-2',
    category: 'Harm OCD',
    text: 'Has this thought ever actually turned into an action, across however long you\'ve had it? What does that track record tell you?',
  },
  {
    id: 'harm-3',
    category: 'Harm OCD',
    text: "Name one thing you're currently doing to feel safer around this thought — checking, avoiding, mentally reviewing. Is it shrinking the thought, or feeding it?",
  },
  {
    id: 'harm-4',
    category: 'Harm OCD',
    text: 'If someone else told you they had this exact fear about someone they love, what would that tell you about how much they cared?',
  },
  {
    id: 'harm-5',
    category: 'Harm OCD',
    text: 'Imagine this thought still visits sometimes ten years from now. Could your life still be full and worth living around it?',
  },
  {
    id: 'harm-6',
    category: 'Harm OCD',
    text: "What's it costing you to keep fighting this thought today — time, energy, presence with people you care about?",
  },
  {
    id: 'harm-7',
    category: 'Harm OCD',
    text: "Write one sentence about what you'd do right now if this thought had zero say over your next move.",
  },
  {
    id: 'sexual-1',
    category: 'Sexual Intrusive Thoughts',
    text: 'Describe the shape of the thought without narrating its content — is it an image, a flash, a question, a doubt?',
  },
  {
    id: 'sexual-2',
    category: 'Sexual Intrusive Thoughts',
    text: "Are you checking for a reaction to the thought right now? Notice that checking itself is a compulsion, not information.",
  },
  {
    id: 'sexual-3',
    category: 'Sexual Intrusive Thoughts',
    text: 'What does your actual life — your choices, your relationships, your track record — say about who you are, separate from what your mind hands you?',
  },
  {
    id: 'sexual-4',
    category: 'Sexual Intrusive Thoughts',
    text: "If you can name roughly when these thoughts started, what was happening then? Naming an origin doesn't make the thought true — it just makes it less mysterious.",
  },
  {
    id: 'sexual-5',
    category: 'Sexual Intrusive Thoughts',
    text: 'How much of today got handed over to this loop? What would you rather have spent that time on?',
  },
  {
    id: 'sexual-6',
    category: 'Sexual Intrusive Thoughts',
    text: "Write the thought you're most reluctant to name. You don't have to reread it — the writing itself is the exercise.",
  },
  {
    id: 'rocd-1',
    category: 'Relationship OCD (ROCD)',
    text: "What's the doubt today — about your partner's looks, personality, future, or your own feelings? Name it plainly.",
  },
  {
    id: 'rocd-2',
    category: 'Relationship OCD (ROCD)',
    text: 'How many times today have you mentally checked in on how you feel about your partner? What would one day without checking look like?',
  },
  {
    id: 'rocd-3',
    category: 'Relationship OCD (ROCD)',
    text: 'Is this doubt something you could actually investigate with real information, or is it the kind no amount of certainty would ever satisfy?',
  },
  {
    id: 'rocd-4',
    category: 'Relationship OCD (ROCD)',
    text: "What do you notice about the relationship in the moments you're not scanning it for problems?",
  },
  {
    id: 'rocd-5',
    category: 'Relationship OCD (ROCD)',
    text: 'If you never resolved this doubt one way or the other, what would you still be able to build together?',
  },
  {
    id: 'rocd-6',
    category: 'Relationship OCD (ROCD)',
    text: 'Write down three specific, concrete things your partner did this week that you appreciated — actions, not feelings.',
  },
  {
    id: 'rocd-7',
    category: 'Relationship OCD (ROCD)',
    text: 'Are you asking this relationship to prove something no relationship could ever fully prove?',
  },
  {
    id: 'postpartum-1',
    category: 'Postpartum',
    text: 'Write the general shape of the thought, then underneath it write: "My mind is scanning for threats to someone I love — that\'s a sign of care, not danger."',
  },
  {
    id: 'postpartum-2',
    category: 'Postpartum',
    text: "Who knows you're having thoughts like this? If no one yet, what's stopping you from telling one person?",
  },
  {
    id: 'postpartum-3',
    category: 'Postpartum',
    text: 'What are you doing right now to try to stay "safe" around this thought — and is it helping you rest, or adding to the exhaustion?',
  },
  {
    id: 'postpartum-4',
    category: 'Postpartum',
    text: 'How much sleep have you had this week? Notice whether these thoughts get louder as sleep gets shorter.',
  },
  {
    id: 'postpartum-5',
    category: 'Postpartum',
    text: 'If a friend who just had a baby told you this exact thought, what would you want them to know?',
  },
  {
    id: 'postpartum-6',
    category: 'Postpartum',
    text: "What's one thing you need — from a partner, a family member, a doctor, a therapist — that you haven't asked for yet?",
  },
  {
    id: 'postpartum-7',
    category: 'Postpartum',
    text: "If you're at all unsure whether what you're experiencing is more than intrusive thoughts, who's the one person you could call today to check?",
  },
  {
    id: 'reframe-1',
    category: 'Reframing (CBT/ACT)',
    text: 'Take a thought you had today and rewrite it starting with "I\'m having the thought that…" What\'s different about it on the page?',
  },
  {
    id: 'reframe-2',
    category: 'Reframing (CBT/ACT)',
    text: 'Picture the thought said aloud in a silly voice. Does it carry the same weight?',
  },
  {
    id: 'reframe-3',
    category: 'Reframing (CBT/ACT)',
    text: 'Name a time your mind was completely certain about something that turned out to be wrong. What does that do to how much you trust this thought?',
  },
  {
    id: 'reframe-4',
    category: 'Reframing (CBT/ACT)',
    text: 'What would it look like to greet the thought — "oh, you again" — instead of trying to shut the door on it?',
  },
  {
    id: 'reframe-5',
    category: 'Reframing (CBT/ACT)',
    text: "What's the difference between living alongside this thought and needing to defeat it before you can move on with your day?",
  },
  {
    id: 'reframe-6',
    category: 'Reframing (CBT/ACT)',
    text: 'How much attention does this thought actually deserve today, on a scale that has nothing to do with how loud it feels?',
  },
  {
    id: 'reframe-7',
    category: 'Reframing (CBT/ACT)',
    text: 'Name one value you want to move toward today regardless of what your mind hands you, and one small action that lives inside it.',
  },
  {
    id: 'reframe-8',
    category: 'Reframing (CBT/ACT)',
    text: "Write a short note to the part of you that's scared of your own thoughts. What does that part need to hear right now?",
  },
]

export function pickRandomQuickPrompt(excludeId?: string): QuickPrompt | null {
  if (QUICK_PROMPTS.length === 0) return null
  const pool = excludeId ? QUICK_PROMPTS.filter((p) => p.id !== excludeId) : QUICK_PROMPTS
  const candidates = pool.length > 0 ? pool : QUICK_PROMPTS
  return candidates[Math.floor(Math.random() * candidates.length)]
}
