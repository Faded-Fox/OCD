import { useEffect, useState, type ReactNode } from 'react'
import { addJournalEntry, deleteJournalEntry } from '../lib/db'
import { newId } from '../lib/session'
import {
  FEELINGS_CHART,
  JOURNAL_TEMPLATES,
  QUICK_PROMPTS,
  pickRandomQuickPrompt,
  type JournalType,
  type QuickPrompt,
  type QuickPromptEntry,
  type StructuredJournalEntry,
} from '../lib/journal'
import { useJournalEntries } from '../lib/useJournalEntries'
import { Card, PrimaryButton, SecondaryButton, Badge } from '../components/ui'
import foxMorning from '../assets/fox-morning.webp'
import foxWindDown from '../assets/fox-wind-down.webp'
import foxQuickPrompt from '../assets/fox-quick-prompt.webp'
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

type Phase = 'landing' | 'form' | 'saved' | 'history' | 'quick'

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-amber-900'

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export default function Journal() {
  const [phase, setPhase] = useState<Phase>('landing')
  const [activeType, setActiveType] = useState<JournalType | null>(null)
  const [activePrompt, setActivePrompt] = useState<QuickPrompt | null>(null)

  if (phase === 'history') {
    return <HistoryView onBack={() => setPhase('landing')} />
  }

  if (phase === 'form' && activeType) {
    return (
      <JournalForm
        type={activeType}
        onDone={() => {
          setActiveType(null)
          setPhase('saved')
        }}
        onCancel={() => {
          setActiveType(null)
          setPhase('landing')
        }}
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
          Two short, structured prompts — not free-form journaling. Both are designed to stay brief and avoid
          becoming reassurance-seeking; each one tells you what to watch for.
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
          Mainly here for export or to bring to your therapist. Both prompts flag re-reading past entries for
          reassurance as a compulsion warning sign — worth keeping in mind while browsing.
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
