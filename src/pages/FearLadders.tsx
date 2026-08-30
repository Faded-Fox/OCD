import { useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteFearLadder, saveFearLadder } from '../lib/db'
import { createEmptyLadder, createEmptyRung, type FearLadder, type FearLadderRung } from '../lib/fearLadder'
import { useFearLadders } from '../lib/useFearLadders'
import { useSessions } from '../lib/useSessions'
import { colorForHierarchy } from '../lib/colors'
import { Card, PrimaryButton, SecondaryButton, EmptyState } from '../components/ui'
import { inputBaseClass, Field, TargetRangeInput, TextSuggestInput } from '../components/SessionFields'
import { sudsRangeError } from '../lib/suds'
import { hierarchyKey } from '../lib/hierarchy'

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
    const seenKeys = new Set<string>()
    const hierarchySuggestions = [
      ...[...sessions].sort((a, b) => b.date.localeCompare(a.date)).map((s) => s.hierarchy),
      ...ladders.map((l) => l.hierarchy),
    ]
      .filter((h) => h.trim() !== '')
      .filter((h) => {
        const key = hierarchyKey(h)
        if (seenKeys.has(key)) return false
        seenKeys.add(key)
        return true
      })
      .sort((a, b) => a.localeCompare(b))

    return (
      <FearLadderForm
        ladder={activeLadder}
        existingHierarchies={ladders.filter((l) => l.id !== activeLadder.id).map((l) => l.hierarchy)}
        hierarchySuggestions={hierarchySuggestions}
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
            target SUDS to expect. Once you start logging sessions against it, the per-hierarchy view merges this
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
  hierarchySuggestions,
  onDone,
  onCancel,
}: {
  ladder: FearLadder
  existingHierarchies: string[]
  hierarchySuggestions: string[]
  onDone: () => void
  onCancel: () => void
}) {
  const [draft, setDraft] = useState(ladder)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Rungs that already have a description start collapsed, so opening a ladder with
  // many planned/attempted rungs doesn't mean scrolling past all of them to add a new
  // one — a newly-added rung (no description yet) is never in this set, so it always
  // opens expanded. Keyed by object identity, which stays stable across edits to
  // *other* rungs and across removals.
  const [collapsed, setCollapsed] = useState<Set<FearLadderRung>>(
    () => new Set(ladder.rungs.filter((r) => r.description.trim() !== '')),
  )

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

  const toggleCollapsed = (rung: FearLadderRung) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(rung)) next.delete(rung)
      else next.add(rung)
      return next
    })
  }

  const rungRangeError = draft.rungs.map((r) => sudsRangeError(r.targetSudsRange)).find((e) => e !== null) ?? null
  const hasInvalidRung = rungRangeError !== null

  const save = async () => {
    const hierarchy = draft.hierarchy.trim()
    if (!hierarchy) {
      setError('Give this ladder a hierarchy name.')
      return
    }
    if (existingHierarchies.some((h) => hierarchyKey(h) === hierarchyKey(hierarchy))) {
      setError('There\'s already a fear ladder for this hierarchy — edit that one instead.')
      return
    }
    if (hasInvalidRung) {
      setError(rungRangeError)
      return
    }
    setSaving(true)
    await saveFearLadder({ ...draft, hierarchy, updatedAt: new Date().toISOString() })
    setSaving(false)
    onDone()
  }

  const sortedRungs = draft.rungs
    .map((r, i) => ({ r, index: i }))
    .sort((a, b) => a.r.rung - b.r.rung)

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
          <TextSuggestInput
            value={draft.hierarchy}
            onChange={(hierarchy) => patch({ hierarchy })}
            suggestions={hierarchySuggestions}
            placeholder="e.g. Harm/Contamination"
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
          {sortedRungs.map(({ r: row, index }) => {
            const isCollapsed = collapsed.has(row) && row.description.trim() !== ''
            if (isCollapsed) {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => toggleCollapsed(row)}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left dark:border-slate-800"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {row.rung}
                  </span>
                  <span className="flex-1 truncate text-sm text-slate-700 dark:text-slate-300">
                    {row.description}
                  </span>
                  {row.targetSudsRange && (
                    <span className="shrink-0 text-xs text-slate-400">
                      target {row.targetSudsRange[0]}–{row.targetSudsRange[1]}
                    </span>
                  )}
                </button>
              )
            }
            return (
              <div key={index} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <label className="flex flex-col gap-1 sm:w-20">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Rung
                    </span>
                    <input
                      type="number"
                      value={row.rung}
                      onChange={(e) => updateRung(index, { rung: Number(e.target.value) })}
                      className={inputBaseClass}
                    />
                  </label>
                  <label className="flex flex-1 flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Description
                    </span>
                    <textarea
                      value={row.description}
                      onChange={(e) => updateRung(index, { description: e.target.value })}
                      placeholder="e.g. Touch a doorknob without washing after"
                      rows={2}
                      className={`${inputBaseClass} w-full resize-none`}
                    />
                  </label>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Target SUDS
                    </span>
                    <TargetRangeInput
                      value={row.targetSudsRange}
                      onChange={(targetSudsRange) => updateRung(index, { targetSudsRange })}
                    />
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => removeRung(index)}
                    className="text-xs font-medium text-rose-600 hover:underline dark:text-rose-400"
                  >
                    Remove
                  </button>
                  {row.description.trim() !== '' && (
                    <button
                      type="button"
                      onClick={() => toggleCollapsed(row)}
                      className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                    >
                      Collapse
                    </button>
                  )}
                </div>
              </div>
            )
          })}
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
        <PrimaryButton onClick={save} disabled={saving || hasInvalidRung}>
          {saving ? 'Saving…' : 'Save ladder'}
        </PrimaryButton>
      </div>
    </div>
  )
}
