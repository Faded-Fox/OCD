import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { addSessions } from '../lib/db'
import { parseImportText } from '../lib/parser'
import type { Session } from '../lib/types'
import { Card, PrimaryButton, SecondaryButton, Badge } from '../components/ui'
import HierarchyBadge from '../components/HierarchyBadge'

export default function Import() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<Session[] | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [autoScrollPending, setAutoScrollPending] = useState(false)
  const [flagCursor, setFlagCursor] = useState(0)
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleFile = async (file: File) => {
    const text = await file.text()
    setRaw(text)
  }

  const runParse = () => {
    const result = parseImportText(raw)
    setParsed(result.sessions)
    setWarnings(result.warnings)
    setFlagCursor(0)
    setAutoScrollPending(true)
  }

  const flaggedIds = useMemo(
    () => (parsed ? parsed.filter((s) => s.flags.length > 0).map((s) => s.id) : []),
    [parsed],
  )

  const scrollToCard = (id: string) => {
    cardRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // Jump straight to the first flagged session as soon as parsing finishes —
  // runs once per parse via the pending flag rather than on every edit.
  useEffect(() => {
    if (!autoScrollPending || !parsed) return
    if (flaggedIds.length > 0) {
      scrollToCard(flaggedIds[0])
      setFlagCursor(1 % flaggedIds.length)
    }
    setAutoScrollPending(false)
  }, [autoScrollPending, parsed, flaggedIds])

  const jumpToNextFlag = () => {
    if (flaggedIds.length === 0) return
    const id = flaggedIds[flagCursor % flaggedIds.length]
    scrollToCard(id)
    setFlagCursor((c) => (c + 1) % flaggedIds.length)
  }

  const updateSession = (id: string, patch: Partial<Session>) => {
    setParsed((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, ...patch } : s)) : prev))
  }

  const discardSession = (id: string) => {
    setParsed((prev) => (prev ? prev.filter((s) => s.id !== id) : prev))
  }

  const confirmSave = async () => {
    if (!parsed || parsed.length === 0) return
    setSaving(true)
    await addSessions(parsed)
    setSaving(false)
    navigate('/')
  }

  const startOver = () => {
    setParsed(null)
    setWarnings([])
  }

  if (parsed) {
    return (
      <div className="flex flex-col gap-6 py-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Review before saving</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Nothing is saved yet. Check the fields the parser flagged, fix anything wrong, then confirm.
          </p>
        </div>

        {warnings.length > 0 && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
            <ul className="list-inside list-disc space-y-1 text-sm text-amber-800 dark:text-amber-300">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </Card>
        )}

        {parsed.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No sessions survived review. Go back and try different input.
            </p>
          </Card>
        )}

        {flaggedIds.length > 0 && (
          <div className="sticky top-2 z-10 flex items-center justify-between gap-3 rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
            <span>
              {flaggedIds.length} session{flaggedIds.length === 1 ? '' : 's'} need review
            </span>
            <button
              type="button"
              onClick={jumpToNextFlag}
              className="rounded-full bg-white/20 px-3 py-1 font-semibold hover:bg-white/30"
            >
              Jump to next ↓
            </button>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {parsed.map((session) => (
            <div
              key={session.id}
              ref={(el) => {
                cardRefs.current[session.id] = el
              }}
              className="scroll-mt-16"
            >
              <SessionEditCard
                session={session}
                onChange={(patch) => updateSession(session.id, patch)}
                onDiscard={() => discardSession(session.id)}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <SecondaryButton onClick={startOver}>Back</SecondaryButton>
          <PrimaryButton onClick={confirmSave} disabled={saving || parsed.length === 0}>
            {saving ? 'Saving…' : `Save ${parsed.length} session${parsed.length === 1 ? '' : 's'}`}
          </PrimaryButton>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Import a session export</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Paste a Claude.ai conversation export (JSON) or plain conversation text containing ERP session
          logs. Parsing happens entirely on this device — nothing is uploaded anywhere.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder="Paste conversation export JSON or session text here…"
          rows={14}
          className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-violet-900"
        />
        <div className="flex flex-wrap items-center gap-3">
          <SecondaryButton onClick={() => fileInputRef.current?.click()}>Upload file…</SecondaryButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
          <PrimaryButton onClick={runParse} disabled={!raw.trim()}>
            Parse
          </PrimaryButton>
        </div>
      </Card>
    </div>
  )
}

function SessionEditCard({
  session,
  onChange,
  onDiscard,
}: {
  session: Session
  onChange: (patch: Partial<Session>) => void
  onDiscard: () => void
}) {
  const [expanded, setExpanded] = useState(session.flags.length > 0)

  return (
    <Card className={session.flags.length ? 'border-amber-300 dark:border-amber-900' : ''}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <HierarchyBadge hierarchy={session.hierarchy} />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {session.rung !== null ? `Rung ${session.rung}` : 'Rung unknown'}
          </span>
          <span className="text-sm text-slate-400">·</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{session.date || 'no date'}</span>
          {session.flags.length > 0 && (
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              {session.flags.length} to review
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
          >
            {expanded ? 'Collapse' : 'Edit'}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="text-sm font-medium text-rose-600 hover:underline dark:text-rose-400"
          >
            Discard
          </button>
        </div>
      </div>

      {session.flags.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
          {session.flags.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}

      {expanded && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800">
          <Field label="Date">
            <input
              type="date"
              value={session.date}
              onChange={(e) => onChange({ date: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Hierarchy">
            <input
              type="text"
              value={session.hierarchy}
              onChange={(e) => onChange({ hierarchy: e.target.value })}
              placeholder="e.g. Harm/Contamination"
              className={inputClass}
            />
          </Field>
          <Field label="Rung">
            <input
              type="number"
              value={session.rung ?? ''}
              onChange={(e) => onChange({ rung: e.target.value === '' ? null : Number(e.target.value) })}
              className={inputClass}
            />
          </Field>
          <Field label="Variation">
            <input
              type="text"
              value={session.variation ?? ''}
              onChange={(e) => onChange({ variation: e.target.value || null })}
              className={inputClass}
            />
          </Field>
          <Field label="Target SUDs range">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={session.target_suds_range?.[0] ?? ''}
                onChange={(e) =>
                  onChange({
                    target_suds_range: [
                      e.target.value === '' ? 0 : Number(e.target.value),
                      session.target_suds_range?.[1] ?? 0,
                    ],
                  })
                }
                className={inputClass}
              />
              <span className="text-slate-400">–</span>
              <input
                type="number"
                value={session.target_suds_range?.[1] ?? ''}
                onChange={(e) =>
                  onChange({
                    target_suds_range: [
                      session.target_suds_range?.[0] ?? 0,
                      e.target.value === '' ? 0 : Number(e.target.value),
                    ],
                  })
                }
                className={inputClass}
              />
            </div>
          </Field>
          <Field label="Peak / End SUDs">
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={session.peak_suds ?? ''}
                onChange={(e) => onChange({ peak_suds: e.target.value === '' ? null : Number(e.target.value) })}
                className={inputClass}
              />
              <span className="text-slate-400">/</span>
              <input
                type="number"
                value={session.end_suds ?? ''}
                onChange={(e) => onChange({ end_suds: e.target.value === '' ? null : Number(e.target.value) })}
                className={inputClass}
              />
            </div>
          </Field>
          <Field label="Compulsions resisted">
            <select
              value={session.compulsions_resisted === null ? 'unknown' : session.compulsions_resisted ? 'yes' : 'partial'}
              onChange={(e) =>
                onChange({
                  compulsions_resisted: e.target.value === 'unknown' ? null : e.target.value === 'yes',
                })
              }
              className={inputClass}
            >
              <option value="yes">Fully resisted</option>
              <option value="partial">Partial / completed</option>
              <option value="unknown">Unknown</option>
            </select>
          </Field>
          <Field label="Techniques used (comma separated)">
            <input
              type="text"
              value={session.techniques_used.join(', ')}
              onChange={(e) =>
                onChange({ techniques_used: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Notes" full>
            <textarea
              value={session.notes}
              onChange={(e) => onChange({ notes: e.target.value })}
              rows={2}
              className={inputClass}
            />
          </Field>

          {session.readings.length > 0 && (
            <div className="sm:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Readings detected
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {session.readings.map((r, i) => (
                  <Badge key={i} className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {r.label}: {r.suds}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-violet-900'

function Field({ label, children, full }: { label: string; children: ReactNode; full?: boolean }) {
  return (
    <label className={`flex flex-col gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      {children}
    </label>
  )
}
