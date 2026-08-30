import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import { addJournalEntry, deleteJournalEntry } from '../lib/db'
import { newId } from '../lib/session'
import {
  FEELINGS_CHART,
  JOURNAL_TEMPLATES,
  QUICK_PROMPTS,
  THOUGHT_RECORD_HARD_CAP_MINUTES,
  THOUGHT_RECORD_SECTIONS,
  THOUGHT_THEMES,
  pickRandomQuickPrompt,
  type JournalType,
  type QuickPrompt,
  type QuickPromptEntry,
  type StructuredJournalEntry,
  type ThoughtEntry,
  type ThoughtRecordEntry,
  type ThoughtTheme,
} from '../lib/journal'
import { useJournalEntries } from '../lib/useJournalEntries'
import { Card, PrimaryButton, SecondaryButton, Badge } from '../components/ui'
import foxMorning from '../assets/fox-morning.webp'
import foxWindDown from '../assets/fox-wind-down.webp'
import foxQuickPrompt from '../assets/fox-quick-prompt.webp'
import foxIntrusiveThought from '../assets/fox-intrusive-thought.webp'
import foxObsessiveThought from '../assets/fox-obsessive-thought.webp'
import foxMoodAngry from '../assets/mood/fox-mood-angry.webp'
import foxMoodCalm from '../assets/mood/fox-mood-calm.webp'
import foxMoodFrustrated from '../assets/mood/fox-mood-frustrated.webp'
import foxMoodHappy from '../assets/mood/fox-mood-happy.webp'
import foxMoodNervous from '../assets/mood/fox-mood-nervous.webp'
import foxMoodScared from '../assets/mood/fox-mood-scared.webp'
import foxMoodShy from '../assets/mood/fox-mood-shy.webp'
import foxMoodSurprised from '../assets/mood/fox-mood-surprised.webp'
import foxMoodSad from '../assets/mood/fox-mood-sad.webp'
import foxMoodBored from '../assets/mood/fox-mood-bored.webp'
import foxMoodLonely from '../assets/mood/fox-mood-lonely.webp'
import foxMoodExcited from '../assets/mood/fox-mood-excited.webp'

const MOOD_IMAGES: Record<string, string> = {
  angry: foxMoodAngry,
  calm: foxMoodCalm,
  frustrated: foxMoodFrustrated,
  happy: foxMoodHappy,
  nervous: foxMoodNervous,
  scared: foxMoodScared,
  shy: foxMoodShy,
  surprised: foxMoodSurprised,
  sad: foxMoodSad,
  bored: foxMoodBored,
  lonely: foxMoodLonely,
  excited: foxMoodExcited,
}

type Phase = 'landing' | 'form' | 'saved' | 'history' | 'quick' | 'thought' | 'thought-record'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-amber-900'

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function Journal() {
  const [searchParams, setSearchParams] = useSearchParams()
  // Lets Dashboard's "Caught the fox" shortcut (/journal?start=thought) jump
  // straight into the capture screen instead of the landing page. Cleared
  // right away so reloading or navigating back to landing doesn't re-trigger it.
  const [phase, setPhase] = useState<Phase>(() => (searchParams.get('start') === 'thought' ? 'thought' : 'landing'))
  const [activeType, setActiveType] = useState<JournalType | null>(null)
  const [activePrompt, setActivePrompt] = useState<QuickPrompt | null>(null)
  const [lastSaved, setLastSaved] = useState<'thought' | 'other'>('other')
  const { entries: journalEntries, refresh: refreshJournalEntries } = useJournalEntries()

  useEffect(() => {
    if (searchParams.has('start')) {
      setSearchParams(
        (prev) => {
          prev.delete('start')
          return prev
        },
        { replace: true },
      )
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (phase === 'history') {
    return <HistoryView onBack={() => setPhase('landing')} />
  }

  if (phase === 'form' && activeType) {
    return (
      <JournalForm
        type={activeType}
        onDone={() => {
          setActiveType(null)
          setLastSaved('other')
          setPhase('saved')
        }}
        onCancel={() => {
          setActiveType(null)
          setPhase('landing')
        }}
      />
    )
  }

  if (phase === 'thought') {
    return (
      <ThoughtCaptureView
        onDone={async () => {
          setLastSaved('thought')
          await refreshJournalEntries()
          setPhase('saved')
        }}
        onCancel={() => setPhase('landing')}
      />
    )
  }

  if (phase === 'thought-record') {
    return (
      <ThoughtRecordView
        onDone={() => {
          setLastSaved('other')
          setPhase('saved')
        }}
        onCancel={() => setPhase('landing')}
      />
    )
  }

  if (phase === 'quick' && activePrompt) {
    return (
      <QuickPromptView
        prompt={activePrompt}
        onReroll={() => setActivePrompt(pickRandomQuickPrompt(activePrompt.id))}
        onDone={() => {
          setActivePrompt(null)
          setLastSaved('other')
          setPhase('saved')
        }}
        onCancel={() => {
          setActivePrompt(null)
          setPhase('landing')
        }}
      />
    )
  }

  if (phase === 'saved') {
    if (lastSaved === 'thought') {
      const caughtCount = journalEntries.filter((e) => e.type === 'thought').length
      return (
        <div className="flex flex-col gap-6 py-4">
          <Card className="flex flex-col items-center gap-3 py-14 text-center">
            <img src={foxIntrusiveThought} alt="" className="h-16 w-16" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Caught the fox!</h2>
            <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
              No action needed — noticing it without acting on it was the whole exercise.
            </p>
            {caughtCount > 0 && (
              <p className="text-xs text-slate-400">
                🦊 Caught {caughtCount} time{caughtCount === 1 ? '' : 's'} so far.
              </p>
            )}
            <PrimaryButton onClick={() => setPhase('landing')}>Done</PrimaryButton>
          </Card>
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-6 py-4">
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-emerald-500 text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Entry saved</h2>
          <p className="max-w-sm text-sm text-slate-500 dark:text-slate-400">
            That's it — no need to re-read it. Close this and go on with your day.
          </p>
          <PrimaryButton onClick={() => setPhase('landing')}>Done</PrimaryButton>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Journal</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Five short ways to journal — not free-form writing. Each is designed to stay brief and avoid
          becoming reassurance-seeking, and tells you what to watch for.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <JournalCard
          type="morning"
          icon={foxMorning}
          onStart={() => {
            setActiveType('morning')
            setPhase('form')
          }}
        />
        <JournalCard
          type="evening"
          icon={foxWindDown}
          onStart={() => {
            setActiveType('evening')
            setPhase('form')
          }}
        />
      </div>

      <Card className="flex flex-col gap-3">
        <img src={foxQuickPrompt} alt="" className="h-16 w-16 self-start" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick prompt</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            One short, random prompt — free write for as long or short as you want, then save it.
          </p>
        </div>
        <PrimaryButton
          onClick={() => {
            setActivePrompt(pickRandomQuickPrompt())
            setPhase('quick')
          }}
          disabled={QUICK_PROMPTS.length === 0}
          className="self-start"
        >
          Give me a prompt
        </PrimaryButton>
        {QUICK_PROMPTS.length === 0 && (
          <p className="text-xs text-slate-400">No prompts added yet.</p>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <img src={foxObsessiveThought} alt="" className="h-16 w-16 self-start" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Obsessive Thought</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A structured CBT worksheet for testing one intrusive thought — five timed sections (automatic
            thought, evidence for, evidence against, a balanced alternative, close), each with its own
            countdown, inside a 30-minute hard cap.
          </p>
        </div>
        <PrimaryButton onClick={() => setPhase('thought-record')} className="self-start">
          Start
        </PrimaryButton>
      </Card>

      <Card className="flex flex-col gap-3">
        <img src={foxIntrusiveThought} alt="" className="h-16 w-16 self-start" />
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Intrusive thought</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tag the theme and save — no writing, no explaining. Noticing it without acting on it is the exercise.
          </p>
        </div>
        <PrimaryButton onClick={() => setPhase('thought')} className="self-start">
          Log it
        </PrimaryButton>
      </Card>

      <button
        type="button"
        onClick={() => setPhase('history')}
        className="self-start text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        View saved entries
      </button>
    </div>
  )
}

function JournalCard({
  type,
  icon,
  onStart,
}: {
  type: JournalType
  icon: string
  onStart: () => void
}) {
  const template = JOURNAL_TEMPLATES[type]
  return (
    <Card className="flex flex-col gap-3">
      <img src={icon} alt="" className="h-16 w-16 self-start" />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{template.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{template.subtitle}</p>
      </div>
      <p className="text-xs text-slate-400">{template.instructions}</p>
      <PrimaryButton onClick={onStart} className="self-start">
        Start
      </PrimaryButton>
    </Card>
  )
}

function JournalForm({
  type,
  onDone,
  onCancel,
}: {
  type: JournalType
  onDone: () => void
  onCancel: () => void
}) {
  const template = JOURNAL_TEMPLATES[type]
  const [fields, setFields] = useState<Record<string, string>>({})
  const [mood, setMood] = useState<string | null>(null)
  const [startedAt] = useState(() => Date.now())
  const [nowTick, setNowTick] = useState(Date.now())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const elapsedMs = nowTick - startedAt
  const targetMs = template.timerMinutes * 60000
  const overTarget = elapsedMs > targetMs

  const setField = (key: string, value: string) => setFields((f) => ({ ...f, [key]: value }))

  const save = async () => {
    setSaving(true)
    const entry: StructuredJournalEntry = {
      id: newId(),
      type,
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      fields,
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
      mood: mood ?? undefined,
    }
    await addJournalEntry(entry)
    setSaving(false)
    onDone()
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← Journal
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{template.title}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{template.instructions}</p>
      </div>

      <Card className="flex flex-col items-center gap-1 py-5 text-center">
        <span className={`text-3xl font-semibold tabular-nums ${overTarget ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
          {formatElapsed(elapsedMs)}
        </span>
        <span className="text-xs text-slate-400">
          {overTarget ? `past the suggested ${template.timerMinutes} min — wrap up soon` : `suggested ${template.timerMinutes} min`}
        </span>
      </Card>

      {template.sections.map((section) => (
        <Card key={section.title} className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{section.title}</h2>
            {section.evidence && (
              <p className="mt-0.5 text-xs italic text-slate-400">{section.evidence}</p>
            )}
            {section.helper && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{section.helper}</p>
            )}
            {section.warning && (
              <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">⚠ {section.warning}</p>
            )}
          </div>

          {section.fields.length > 1 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {section.fields.map((f) => (
                <label key={f.key} className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    {f.label}
                  </span>
                  <input
                    type="text"
                    value={fields[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={inputClass}
                  />
                </label>
              ))}
            </div>
          ) : (
            section.fields.map((f) => (
              <div key={f.key} className="flex flex-col gap-1.5">
                {f.placeholder && (
                  <p className="text-sm italic text-slate-500 dark:text-slate-400">{f.placeholder}</p>
                )}
                {f.multiline ? (
                  <textarea
                    value={fields[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    rows={3}
                    className={inputClass}
                  />
                ) : (
                  <input
                    type="text"
                    value={fields[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    className={inputClass}
                  />
                )}
              </div>
            ))
          )}
        </Card>
      ))}

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-300">{template.compulsionWarning.heading}</h2>
        {template.compulsionWarning.intro && (
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{template.compulsionWarning.intro}</p>
        )}
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-amber-800 dark:text-amber-300">
          {template.compulsionWarning.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">{template.compulsionWarning.footer}</p>
      </Card>

      <MoodPicker value={mood} onChange={setMood} />

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Discard
        </SecondaryButton>
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save entry'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function QuickPromptView({
  prompt,
  onReroll,
  onDone,
  onCancel,
}: {
  prompt: QuickPrompt
  onReroll: () => void
  onDone: () => void
  onCancel: () => void
}) {
  const [response, setResponse] = useState('')
  const [mood, setMood] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const entry: QuickPromptEntry = {
      id: newId(),
      type: 'quick',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      promptId: prompt.id,
      promptCategory: prompt.category,
      promptText: prompt.text,
      response,
      mood: mood ?? undefined,
    }
    await addJournalEntry(entry)
    setSaving(false)
    onDone()
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← Journal
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Quick prompt</h1>
      </div>

      <Card className="flex flex-col gap-3">
        <Badge className="self-start bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {prompt.category}
        </Badge>
        <p className="text-lg text-slate-800 dark:text-slate-100">{prompt.text}</p>
        <button
          type="button"
          onClick={() => {
            setResponse('')
            onReroll()
          }}
          className="self-start text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          Give me a different one
        </button>
      </Card>

      <Card>
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          placeholder="Write whatever comes up…"
          rows={8}
          className={inputClass}
          autoFocus
        />
      </Card>

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          One pass is the exercise. If you notice yourself rerolling to find "the right" prompt, or rewriting
          until the answer feels complete, that's worth naming as the same loop this is meant to interrupt —
          not something to fix by writing more.
        </p>
      </Card>

      <MoodPicker value={mood} onChange={setMood} />

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Discard
        </SecondaryButton>
        <PrimaryButton onClick={save} disabled={saving || !response.trim()}>
          {saving ? 'Saving…' : 'Save entry'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function ThoughtCaptureView({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [theme, setTheme] = useState<ThoughtTheme | null>(null)
  const [mood, setMood] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!theme) return
    setSaving(true)
    const entry: ThoughtEntry = {
      id: newId(),
      type: 'thought',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      theme,
      mood: mood ?? undefined,
    }
    await addJournalEntry(entry)
    setSaving(false)
    onDone()
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← Journal
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Intrusive thought</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          What theme is this? Tap one, then save — that's the whole exercise.
        </p>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THOUGHT_THEMES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTheme(theme === t.key ? null : t.key)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                theme === t.key
                  ? 'border-amber-400 bg-amber-50 text-amber-900 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <p className="text-sm text-amber-800 dark:text-amber-300">
          No need to write it out, explain it, or figure out whether it's true. Naming the theme and moving on
          is the point — writing out the thought itself just re-engages with it.
        </p>
      </Card>

      <MoodPicker value={mood} onChange={setMood} />

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Discard
        </SecondaryButton>
        <PrimaryButton onClick={save} disabled={saving || !theme}>
          {saving ? 'Saving…' : 'Save'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function BelievabilitySlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{value}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500"
      />
      <div className="flex justify-between text-[11px] text-slate-400">
        <span>0% — don't believe it at all</span>
        <span>100% — completely believe it</span>
      </div>
    </div>
  )
}

/**
 * A fixed, timed sequence rather than the all-sections-at-once layout the
 * morning/evening templates use — the source worksheet's whole design is a
 * 30-minute hard cap with each section pacing itself, not a suggestion to
 * take as long as feels right. No back button, deliberately: section 1's own
 * instruction ("write once, do not refine") is really the ethos of the whole
 * thing, and the app's saved-entries view already stays low-key for the same
 * anti-reassurance-seeking reason.
 */
function ThoughtRecordView({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [phase, setPhase] = useState<'intro' | 'section'>('intro')
  const [situation, setSituation] = useState('')
  const [believabilityBefore, setBelievabilityBefore] = useState(50)
  const [believabilityAfter, setBelievabilityAfter] = useState(50)
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [sectionIndex, setSectionIndex] = useState(0)
  const [sectionStartedAt, setSectionStartedAt] = useState<number | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [mood, setMood] = useState<string | null>(null)
  const [nowTick, setNowTick] = useState(Date.now())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (phase !== 'section') return
    const interval = setInterval(() => setNowTick(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [phase])

  const start = () => {
    const now = Date.now()
    setStartedAt(now)
    setSectionStartedAt(now)
    setSectionIndex(0)
    setPhase('section')
  }

  const section = THOUGHT_RECORD_SECTIONS[sectionIndex]
  const isLastSection = sectionIndex === THOUGHT_RECORD_SECTIONS.length - 1
  const overallElapsedMs = startedAt ? nowTick - startedAt : 0
  const sectionElapsedMs = sectionStartedAt ? nowTick - sectionStartedAt : 0
  const sectionRemainingMs = Math.max(0, section.timerMinutes * 60000 - sectionElapsedMs)
  const sectionTimeUp = sectionRemainingMs <= 0
  const hardCapReached = overallElapsedMs >= THOUGHT_RECORD_HARD_CAP_MINUTES * 60000

  const goToSection = (index: number) => {
    setSectionIndex(index)
    setSectionStartedAt(Date.now())
  }

  const save = async () => {
    setSaving(true)
    const now = Date.now()
    const entry: ThoughtRecordEntry = {
      id: newId(),
      type: 'thought-record',
      date: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      situation,
      startTime: new Date(startedAt ?? now).toISOString(),
      stopTime: new Date(now).toISOString(),
      believabilityBefore,
      believabilityAfter,
      fields,
      durationSeconds: startedAt ? Math.round((now - startedAt) / 1000) : 0,
      mood: mood ?? undefined,
    }
    await addJournalEntry(entry)
    setSaving(false)
    onDone()
  }

  if (phase === 'intro') {
    return (
      <div className="flex flex-col gap-6 py-4">
        <div>
          <button type="button" onClick={onCancel} className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
            ← Journal
          </button>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Obsessive Thought</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            30-minute hard cap — stop at the timer, regardless of section.
          </p>
        </div>

        <Card className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Situation / obsession theme
            </span>
            <input
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="What's the thought or situation this record is about?"
              className={inputClass}
            />
          </label>
          <BelievabilitySlider
            label="Believability of the automatic thought, right now, before writing"
            value={believabilityBefore}
            onChange={setBelievabilityBefore}
          />
        </Card>

        <Card className="flex flex-col gap-1.5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">What's ahead</h2>
          {THOUGHT_RECORD_SECTIONS.map((s, i) => (
            <p key={s.key} className="text-sm text-slate-500 dark:text-slate-400">
              {i + 1}. {s.title} <span className="text-slate-400">— {s.timerLabel}</span>
            </p>
          ))}
        </Card>

        <div className="flex gap-3">
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <PrimaryButton onClick={start}>Start</PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Section {sectionIndex + 1} of {THOUGHT_RECORD_SECTIONS.length} · overall{' '}
          {formatElapsed(overallElapsedMs)} / {THOUGHT_RECORD_HARD_CAP_MINUTES} min cap
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{section.title}</h1>
      </div>

      <Card className="flex flex-col items-center gap-1 py-5 text-center">
        <span
          className={`text-3xl font-semibold tabular-nums ${
            sectionTimeUp ? 'text-amber-500' : 'text-slate-900 dark:text-white'
          }`}
        >
          {formatElapsed(sectionRemainingMs)}
        </span>
        <span className="text-xs text-slate-400">{section.timerLabel} — time left in this section</span>
      </Card>

      {sectionTimeUp && (
        <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            ⏰ Time's up for this section — move on when you're ready, whether or not it feels finished.
          </p>
        </Card>
      )}

      {hardCapReached && !isLastSection && (
        <Card className="border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-rose-800 dark:text-rose-300">
              You're at the 30-minute cap. Stop here regardless of section — head to Close.
            </p>
            <SecondaryButton onClick={() => goToSection(THOUGHT_RECORD_SECTIONS.length - 1)}>
              Skip to Close
            </SecondaryButton>
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">{section.helper}</p>
        {section.kind === 'text' ? (
          <textarea
            value={fields[section.key] ?? ''}
            onChange={(e) => setFields((f) => ({ ...f, [section.key]: e.target.value }))}
            rows={6}
            autoFocus
            className={inputClass}
          />
        ) : (
          <BelievabilitySlider
            label="Believability of original thought now"
            value={believabilityAfter}
            onChange={setBelievabilityAfter}
          />
        )}
      </Card>

      <MoodPicker value={mood} onChange={setMood} />

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Discard
        </SecondaryButton>
        {isLastSection ? (
          <PrimaryButton onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save entry'}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => goToSection(sectionIndex + 1)} className={sectionTimeUp ? 'animate-pulse' : ''}>
            Next section →
          </PrimaryButton>
        )}
      </div>
    </div>
  )
}

function MoodPicker({ value, onChange }: { value: string | null; onChange: (mood: string | null) => void }) {
  const selected = FEELINGS_CHART.find((f) => f.key === value)
  return (
    <Card>
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">How do you feel?</h2>
      <p className="mt-0.5 text-xs text-slate-400">Optional — tap a face to check in, tap it again to clear it.</p>
      <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {FEELINGS_CHART.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(value === f.key ? null : f.key)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition-colors ${
              value === f.key
                ? 'border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40'
                : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <img src={MOOD_IMAGES[f.key]} alt="" className="h-11 w-11 rounded-lg" />
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{f.emotion}</span>
          </button>
        ))}
      </div>
      {selected && selected.related.length > 0 && (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-medium text-slate-700 dark:text-slate-300">{selected.emotion}</span> can also feel
          like: {selected.related.join(', ')}
        </p>
      )}
    </Card>
  )
}

function MoodBadge({ moodKey }: { moodKey: string }) {
  const entry = FEELINGS_CHART.find((f) => f.key === moodKey)
  if (!entry) return null
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
      <img src={MOOD_IMAGES[moodKey]} alt="" className="h-5 w-5 rounded-full" />
      {entry.emotion}
    </span>
  )
}

function HistoryView({ onBack }: { onBack: () => void }) {
  const { entries, loading, refresh } = useJournalEntries()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const remove = async (id: string) => {
    if (!confirm('Delete this journal entry?')) return
    await deleteJournalEntry(id)
    refresh()
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <button type="button" onClick={onBack} className="text-sm text-emerald-700 hover:underline dark:text-emerald-400">
          ← Journal
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Saved entries</h1>
        <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-slate-400">
          Mainly here for export or to bring to your therapist. Re-reading past entries for reassurance is a
          compulsion warning sign flagged throughout Journal — worth keeping in mind while browsing.
        </p>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : entries.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500 dark:text-slate-400">No journal entries saved yet.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) =>
            entry.type === 'quick' ? (
              <QuickEntryCard
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onDelete={() => remove(entry.id)}
              />
            ) : entry.type === 'thought' ? (
              <ThoughtEntryCard
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onDelete={() => remove(entry.id)}
              />
            ) : entry.type === 'thought-record' ? (
              <ThoughtRecordEntryCard
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onDelete={() => remove(entry.id)}
              />
            ) : (
              <StructuredEntryCard
                key={entry.id}
                entry={entry}
                expanded={expandedId === entry.id}
                onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                onDelete={() => remove(entry.id)}
              />
            ),
          )}
        </div>
      )}
    </div>
  )
}

function EntryCardShell({
  badge,
  badgeClass,
  date,
  extra,
  expanded,
  onToggle,
  onDelete,
  children,
}: {
  badge: string
  badgeClass: string
  date: string
  extra?: ReactNode
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  children: ReactNode
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge className={badgeClass}>{badge}</Badge>
          <span className="text-sm text-slate-500 dark:text-slate-400">{date}</span>
          {extra}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
          >
            {expanded ? 'Collapse' : 'View'}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
          >
            Delete
          </button>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          {children}
        </div>
      )}
    </Card>
  )
}

function StructuredEntryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: StructuredJournalEntry
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const template = JOURNAL_TEMPLATES[entry.type]
  return (
    <EntryCardShell
      badge={template.title}
      badgeClass={
        entry.type === 'morning'
          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
      }
      date={entry.date}
      extra={
        <>
          {entry.durationSeconds !== undefined && (
            <span className="text-xs text-slate-400">· {formatElapsed(entry.durationSeconds * 1000)}</span>
          )}
          {entry.mood && <MoodBadge moodKey={entry.mood} />}
        </>
      }
      expanded={expanded}
      onToggle={onToggle}
      onDelete={onDelete}
    >
      {template.sections.map((section) => {
        const values = section.fields.map((f) => entry.fields[f.key]).filter((v) => v && v.trim())
        if (values.length === 0) return null
        return (
          <div key={section.title}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {section.title}
            </p>
            {section.fields.map((f) =>
              entry.fields[f.key]?.trim() ? (
                <p key={f.key} className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {section.fields.length > 1 ? `${f.label}: ` : ''}
                  {entry.fields[f.key]}
                </p>
              ) : null,
            )}
          </div>
        )
      })}
    </EntryCardShell>
  )
}

function QuickEntryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: QuickPromptEntry
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <EntryCardShell
      badge={`Quick prompt · ${entry.promptCategory}`}
      badgeClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
      date={entry.date}
      extra={entry.mood ? <MoodBadge moodKey={entry.mood} /> : undefined}
      expanded={expanded}
      onToggle={onToggle}
      onDelete={onDelete}
    >
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Prompt</p>
        <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-300">{entry.promptText}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Response</p>
        <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{entry.response}</p>
      </div>
    </EntryCardShell>
  )
}

function ThoughtEntryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: ThoughtEntry
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  const theme = THOUGHT_THEMES.find((t) => t.key === entry.theme)
  return (
    <EntryCardShell
      badge={`Intrusive thought · ${theme?.label ?? entry.theme}`}
      badgeClass="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
      date={entry.date}
      extra={entry.mood ? <MoodBadge moodKey={entry.mood} /> : undefined}
      expanded={expanded}
      onToggle={onToggle}
      onDelete={onDelete}
    >
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Noticed and tagged — no other detail was saved with this entry, by design.
      </p>
    </EntryCardShell>
  )
}

function ThoughtRecordEntryCard({
  entry,
  expanded,
  onToggle,
  onDelete,
}: {
  entry: ThoughtRecordEntry
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <EntryCardShell
      badge="Obsessive Thought"
      badgeClass="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
      date={entry.date}
      extra={
        <>
          <span className="text-xs text-slate-400">· {formatElapsed(entry.durationSeconds * 1000)}</span>
          {entry.mood && <MoodBadge moodKey={entry.mood} />}
        </>
      }
      expanded={expanded}
      onToggle={onToggle}
      onDelete={onDelete}
    >
      {entry.situation.trim() && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Situation / obsession theme
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{entry.situation}</p>
        </div>
      )}
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Believability {entry.believabilityBefore}% before → {entry.believabilityAfter}% after
      </p>
      {THOUGHT_RECORD_SECTIONS.filter((s) => s.kind === 'text').map((s) =>
        entry.fields[s.key]?.trim() ? (
          <div key={s.key}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{s.title}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{entry.fields[s.key]}</p>
          </div>
        ) : null,
      )}
    </EntryCardShell>
  )
}
