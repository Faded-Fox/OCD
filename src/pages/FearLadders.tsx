import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteFearLadder, saveFearLadder } from '../lib/db'
import { createEmptyLadder, createEmptyRung, type FearLadder, type FearLadderRung } from '../lib/fearLadder'
import { useFearLadders } from '../lib/useFearLadders'
import { useSessions } from '../lib/useSessions'
import { colorForHierarchy } from '../lib/colors'
import { Card, PrimaryButton, SecondaryButton, EmptyState } from '../components/ui'
import { inputBaseClass, inputClass, Field, TargetRangeInput } from '../components/SessionFields'

type Phase = 'landing' | 'form'

export default function FearLadders() {
  const { ladders, loading, refresh } = useFearLadders()
  const { sessions } = useSessions()
  const [phase, setPhase] = useState<Phase>('landing')
  const [activeLadder, setActiveLadder] = useState<FearLadder | null>(null)

  const startNew = () => {
    setActiveLadder(createEmptyLadder())
    setPhase('form')
  }

  const openLadder = (ladder: FearLadder) => {
    setActiveLadder(ladder)
    setPhase('form')
  }

  const remove = async (id: string) => {
    if (!confirm('Delete this fear ladder? Sessions already logged for this hierarchy are not affected.')) return
    await deleteFearLadder(id)
    refresh()
  }

  if (phase === 'form' && activeLadder) {
    return (
      <FearLadderForm
        ladder={activeLadder}
        existingHierarchies={ladders.filter((l) => l.id !== activeLadder.id).map((l) => l.hierarchy)}
        onDone={() => {
          setActiveLadder(null)
          setPhase('landing')
          refresh()
        }}
        onCancel={() => {
          setActiveLadder(null)
          setPhase('landing')
        }}
      />
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Fear Ladders</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            Plan a hierarchy's rungs before you've run any exposures in it — what each rung is, and roughly what
            target SUDs to expect. Once you start logging sessions against it, the per-hierarchy view merges this
            plan with your actual progress.
          </p>
        </div>
        <PrimaryButton onClick={startNew}>New ladder</PrimaryButton>
      </div>

      {loading ? (
        <p className="py-10 text-center text-sm text-slate-400">Loading…</p>
      ) : ladders.length === 0 ? (
        <EmptyState
          title="No fear ladders yet"
          body="Sketch out a hierarchy's rungs ahead of time, before you've logged a single session in it."
          action={<PrimaryButton onClick={startNew}>New ladder</PrimaryButton>}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {ladders.map((ladder) => {
            const color = colorForHierarchy(ladder.hierarchy)
            const sessionCount = sessions.filter((s) => (s.hierarchy || 'Unlabeled') === ladder.hierarchy).length
            return (
              <Card key={ladder.id} className="flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={() => openLadder(ladder)} className="flex flex-1 items-center gap-3 text-left">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color.hex }} />
                  <div>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                      {ladder.hierarchy.trim() || 'Untitled hierarchy'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {ladder.rungs.length} rung{ladder.rungs.length === 1 ? '' : 's'} planned · {sessionCount}{' '}
                      session{sessionCount === 1 ? '' : 's'} logged
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  {sessionCount > 0 && (
                    <Link
                      to={`/hierarchy/${encodeURIComponent(ladder.hierarchy)}`}
                      className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      View progress
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(ladder.id)}
                    className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FearLadderForm({
  ladder,
  existingHierarchies,
  onDone,
  onCancel,
}: {
  ladder: FearLadder
  existingHierarchies: string[]
  onDone: () => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(ladder)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const patch = (p: Partial<FearLadder>) => {
    setDraft((d) => ({ ...d, ...p }))
    setError(null)
  }

  const updateRung = (index: number, patch: Partial<FearLadderRung>) => {
    setDraft((d) => ({ ...d, rungs: d.rungs.map((r, i) => (i === index ? { ...r, ...patch } : r)) }))
  }

  const removeRung = (index: number) => {
    setDraft((d) => ({ ...d, rungs: d.rungs.filter((_, i) => i !== index) }))
  }

  const addRung = () => {
    setDraft((d) => ({ ...d, rungs: [...d.rungs, createEmptyRung(d.rungs)] }))
  }

  const save = async () => {
    const hierarchy = draft.hierarchy.trim()
    if (!hierarchy) {
      setError('Give this ladder a hierarchy name.')
      return
    }
    if (existingHierarchies.some((h) => h.toLowerCase() === hierarchy.toLowerCase())) {
      setError('There\'s already a fear ladder for this hierarchy — edit that one instead.')
      return
    }
    setSaving(true)
    await saveFearLadder({ ...draft, hierarchy, updatedAt: new Date().toISOString() })
    setSaving(false)
    onDone()
  }

  const sortedRungs = draft.rungs
    .map((r, i) => ({ ...r, index: i }))
    .sort((a, b) => a.rung - b.rung)

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          ← Fear Ladders
        </button>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">Fear Ladder</h1>
      </div>

      <Card className="flex flex-col gap-3">
        <Field label="Hierarchy">
          <input
            type="text"
            value={draft.hierarchy}
            onChange={(e) => patch({ hierarchy: e.target.value })}
            placeholder="e.g. Harm/Contamination"
            className={inputClass}
          />
        </Field>
        {error && <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Rungs</h2>
        {sortedRungs.length === 0 && (
          <p className="text-sm text-slate-400">No rungs yet — add the first one below.</p>
        )}
        <div className="flex flex-col gap-3">
          {sortedRungs.map((row) => (
            <div key={row.index} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <label className="flex flex-col gap-1 sm:w-20">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Rung
                  </span>
                  <input
                    type="number"
                    value={row.rung}
                    onChange={(e) => updateRung(row.index, { rung: Number(e.target.value) })}
                    className={inputBaseClass}
                  />
                </label>
                <label className="flex flex-1 flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Description
                  </span>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRung(row.index, { description: e.target.value })}
                    placeholder="e.g. Touch a doorknob without washing after"
                    className={inputBaseClass}
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Target SUDs
                  </span>
                  <TargetRangeInput
                    value={row.targetSudsRange}
                    onChange={(targetSudsRange) => updateRung(row.index, { targetSudsRange })}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeRung(row.index)}
                className="mt-2 text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addRung}
          className="self-start text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
        >
          + Add rung
        </button>
      </Card>

      <div className="flex gap-3">
        <SecondaryButton onClick={onCancel} disabled={saving}>
          Discard
        </SecondaryButton>
        <PrimaryButton onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save ladder'}
        </PrimaryButton>
      </div>
    </div>
  )
}
