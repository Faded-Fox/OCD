import { useState } from 'react'
import { deleteFocusPlanEntry, saveFocusPlanEntry } from '../lib/db'
import {
  createEmptyFocusPlan,
  DEFUSION_TECHNIQUES,
  FOCUS_PLAN_AFFIRMATION,
  SUDS_SCALE,
  THERAPIST_FLAGS,
  type FocusPlanEntry,
} from '../lib/focusPlan'
import { useFocusPlanEntries } from '../lib/useFocusPlanEntries'
import { Card, PrimaryButton, SecondaryButton, Badge, EmptyState } from '../components/ui'
import { inputClass, inputBaseClass, Field } from '../components/SessionFields'

type Phase = 'landing' | 'form'

export default function FocusPlan() {
  const { entries, loading, refresh } = useFocusPlanEntries()
  const [phase, setPhase] = useState<Phase>('landing')
  const [activeEntry, setActiveEntry] = useState<FocusPlanEntry | null>(null)

  const startNew = () => {
    setActiveEntry(createEmptyFocusPlan())
    setPhase('form')
  }

  const openEntry = (entry: FocusPlanEntry) => {
    setActiveEntry(entry)
    setPhase('form')
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this focus plan?')) return
    await deleteFocusPlanEntry(id)
    refresh()
  }

  if (phase === 'form' && activeEntry) {
    return (
      <FocusPlanForm
        entry={activeEntry}
        onDone={() => {
          setActiveEntry(null)
          setPhase('landing')
          refresh()
        }}
        onCancel={() => {
          setActiveEntry(null)
          setPhase('landing')
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Focus Plan</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Break a task that OCD makes difficult into smaller steps, plan for the intrusions and urges likely to
            show up, and debrief afterward. Start the plan before the task, come back to fill in the debrief once
            you've attempted it.
          </p>
        </div>
        <PrimaryButton onClick={startNew}>New focus plan</PrimaryButton>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : entries.length === 0 ? (
        <EmptyState
          title="No focus plans yet"
          body="Pick a task that's hard to start because of OCD, and build a plan for it."
          action={<PrimaryButton onClick={startNew}>New focus plan</PrimaryButton>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={() => openEntry(entry)} className="flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className={
                      entry.completed === null
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    }
                  >
                    {entry.completed === null ? 'Debrief pending' : 'Debriefed'}
                  </Badge>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{entry.date}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-100">
                  {entry.taskDescription.trim() || 'Untitled task'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => remove(entry.id)}
                className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
              >
                Delete
              </button>
            </Card>
          ))}
        </div>
      )}

      <ErpToolkit />
    </div>
  )
}

function FocusPlanForm({
  entry,
  onDone,
  onCancel,
}: {
  entry: FocusPlanEntry
  onDone: () => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(entry)
  const [saving, setSaving] = useState(false)

  const patch = (p: Partial<FocusPlanEntry>) => setDraft((d) => ({ ...d, ...p }))

  const save = async () => {
    setSaving(true)
    await saveFocusPlanEntry({ ...draft, updatedAt: new Date().toISOString() })
    setSaving(false)
    onDone()
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-violet-600 hover:underline dark:text-violet-400"
        >
          ← Focus Plan
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Focus Plan</h1>
      </div>

      <Card className="flex flex-col gap-3">
        <StepLabel n={1} title="Describe the task" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          What do you need to get done, and why has OCD made it hard?
        </p>
        <textarea
          value={draft.taskDescription}
          onChange={(e) => patch({ taskDescription: e.target.value })}
          placeholder="e.g. Complete the weekly expense report — I keep avoiding it because I'm afraid I'll make an error and something bad will happen."
          rows={3}
          className={inputClass}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <StepLabel n={2} title="Break it into smaller parts" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Estimate how long each part will realistically take, and note what you'll need.
        </p>
        <RowsEditor
          rows={draft.taskBreakdown}
          onChange={(taskBreakdown) => patch({ taskBreakdown })}
          columns={[
            { key: 'step', label: 'Step', placeholder: 'Gather receipts and open the spreadsheet' },
            { key: 'timeRequired', label: 'Time', placeholder: '10 min' },
            { key: 'whatYouNeed', label: 'What you need', placeholder: 'Laptop, receipts folder' },
          ]}
          emptyRow={{ step: '', timeRequired: '', whatYouNeed: '' }}
          addLabel="+ Add step"
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <StepLabel n={3} title="Schedule it" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          When will you do each part, how will you remind yourself, and how will you reward finishing? Keep rewards
          OCD-safe — avoid checking-based rewards.
        </p>
        <RowsEditor
          rows={draft.schedule}
          onChange={(schedule) => patch({ schedule })}
          columns={[
            { key: 'schedule', label: 'Schedule', placeholder: 'Gather receipts — Mon 2PM' },
            { key: 'reminders', label: 'Reminder', placeholder: 'Phone alarm at 1:50PM' },
            { key: 'rewards', label: 'Reward', placeholder: '10 min of a show' },
          ]}
          emptyRow={{ schedule: '', reminders: '', rewards: '' }}
          addLabel="+ Add row"
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <StepLabel n={4} title="Plan your ERP response" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          What will OCD tell you, what compulsion will you feel pulled toward, and what will you do instead — decided
          now, not in the moment.
        </p>
        <RowsEditor
          rows={draft.intrusions}
          onChange={(intrusions) => patch({ intrusions })}
          columns={[
            { key: 'intrusion', label: 'Likely intrusion / urge', placeholder: '"I made an error — something bad will happen."' },
            { key: 'compulsion', label: 'Compulsion OCD wants', placeholder: 'Recheck every line multiple times' },
            { key: 'response', label: 'My ERP response', placeholder: 'Enter once, move on' },
          ]}
          emptyRow={{ intrusion: '', compulsion: '', response: '' }}
          addLabel="+ Add row"
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <StepLabel n={5} title="Post-task debrief" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Fill this out after completing the task (or attempting it). This is data for you and your therapist — not a
          place to judge yourself.
        </p>

        <Field label="Did I complete the task?">
          <select
            value={draft.completed ?? ''}
            onChange={(e) => patch({ completed: e.target.value === '' ? null : (e.target.value as FocusPlanEntry['completed']) })}
            className={inputClass}
          >
            <option value="">Not yet debriefed</option>
            <option value="yes">Yes</option>
            <option value="partial">Partially</option>
            <option value="no">No</option>
          </select>
        </Field>

        <Field label="What intrusions showed up? (list as weather — no analysis)">
          <textarea
            value={draft.intrusionsThatShowedUp}
            onChange={(e) => patch({ intrusionsThatShowedUp: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Compulsions I resisted">
            <textarea
              value={draft.compulsionsResisted}
              onChange={(e) => patch({ compulsionsResisted: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </Field>
          <Field label="Compulsions I gave in to (no judgment — just data)">
            <textarea
              value={draft.compulsionsGaveInTo}
              onChange={(e) => patch({ compulsionsGaveInTo: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SudsPicker label="Peak SUDs during the task" value={draft.peakSuds} onChange={(peakSuds) => patch({ peakSuds })} />
          <SudsPicker label="SUDs at the end (did it come down?)" value={draft.endSuds} onChange={(endSuds) => patch({ endSuds })} />
        </div>

        <Field label="What worked? What helped me stay on task?">
          <textarea
            value={draft.whatWorked}
            onChange={(e) => patch({ whatWorked: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>
        <Field label="What would I do differently next time?">
          <textarea
            value={draft.whatWouldDoDifferently}
            onChange={(e) => patch({ whatWouldDoDifferently: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>
      </Card>

      <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
        <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-300">Flag for your OCD therapist if</h2>
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-sm text-amber-800 dark:text-amber-300">
          {THERAPIST_FLAGS.map((flag, i) => (
            <li key={i}>{flag}</li>
          ))}
        </ul>
      </Card>

      <ErpToolkit />

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Discard
        </SecondaryButton>
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save focus plan'}
        </PrimaryButton>
      </div>
    </div>
  )
}

function StepLabel({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-white dark:text-slate-900">
        {n}
      </span>
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</h2>
    </div>
  )
}

function SudsPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (n: number | null) => void
}) {
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-1">
        {Array.from({ length: 10 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            className={`h-8 w-8 rounded-full text-xs font-semibold transition-colors ${
              value === n
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </Field>
  )
}

/**
 * A generic add/remove table editor for the three parallel-structured lists in
 * a focus plan (task breakdown, schedule, intrusions) — each is a list of rows
 * with a fixed set of short text columns, so one component covers all three
 * instead of triplicating near-identical add/remove/render logic.
 */
function RowsEditor<T extends Record<string, string>>({
  rows,
  onChange,
  columns,
  emptyRow,
  addLabel,
}: {
  rows: T[]
  onChange: (rows: T[]) => void
  columns: { key: keyof T; label: string; placeholder?: string }[]
  emptyRow: T
  addLabel: string
}) {
  const updateRow = (index: number, patch: Partial<T>) => {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const removeRow = (index: number) => {
    onChange(rows.filter((_, i) => i !== index))
  }

  const addRow = () => {
    onChange([...rows, { ...emptyRow }])
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <div key={i} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {columns.map((col) => (
              <label key={String(col.key)} className="flex flex-col gap-1">
                <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {col.label}
                </span>
                <input
                  type="text"
                  value={row[col.key]}
                  onChange={(e) => updateRow(i, { [col.key]: e.target.value } as Partial<T>)}
                  placeholder={col.placeholder}
                  className={inputBaseClass}
                />
              </label>
            ))}
          </div>
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="mt-2 text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
          >
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="self-start text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
      >
        {addLabel}
      </button>
    </div>
  )
}

function ErpToolkit() {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">ERP toolkit for this task</h2>
        <span className="text-sm text-violet-600 dark:text-violet-400">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && (
        <div className="mt-4 flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              SUDs scale
            </h3>
            <div className="mt-2 flex flex-col gap-1">
              {SUDS_SCALE.map((s) => (
                <div key={s.range} className="flex items-baseline gap-2 text-sm">
                  <span className="w-10 shrink-0 font-semibold text-slate-800 dark:text-slate-100">{s.range}</span>
                  <span className="text-slate-600 dark:text-slate-300">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Defusion techniques to use during the task
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              {DEFUSION_TECHNIQUES.map((t) => (
                <div key={t.name} className="text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{t.name}: </span>
                  <span className="text-slate-600 dark:text-slate-300">{t.description}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-sm italic text-slate-500 dark:text-slate-400">{FOCUS_PLAN_AFFIRMATION}</p>
          <p className="text-xs text-slate-400">
            This worksheet is an adjunct to ERP/CBT/ACT treatment with a trained OCD specialist. If it itself begins
            to feel compulsive, bring it to your next session. IOCDF therapist directory: iocdf.org/find-help
          </p>
        </div>
      )}
    </Card>
  )
}
