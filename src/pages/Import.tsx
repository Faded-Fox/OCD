import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addSessions, restoreBackup } from '../lib/db'
import { parseImportText } from '../lib/parser'
import { looksLikeBackup, countBackupEntries, parseBackup } from '../lib/backup'
import type { Session } from '../lib/types'
import { Card, PrimaryButton, SecondaryButton, Badge } from '../components/ui'
import HierarchyBadge from '../components/HierarchyBadge'
import PhotoEntry from '../components/PhotoEntry'
import SessionFields from '../components/SessionFields'

type Mode = 'text' | 'photo'

export default function Import() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>('text')
  const [raw, setRaw] = useState('')
  const [parsed, setParsed] = useState<Session[] | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [autoScrollPending, setAutoScrollPending] = useState(false)
  const [flagCursor, setFlagCursor] = useState(0)
  const [restoring, setRestoring] = useState(false)
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

  const isBackup = useMemo(() => looksLikeBackup(raw), [raw])
  const backupCounts = useMemo(() => (isBackup ? countBackupEntries(raw) : null), [isBackup, raw])

  const runRestore = async () => {
    if (!backupCounts || backupCounts.sessions + backupCounts.journalEntries === 0) return
    const confirmed = confirm(
      `Restore ${backupCounts.sessions} session${backupCounts.sessions === 1 ? '' : 's'} and ${backupCounts.journalEntries} journal entr${backupCounts.journalEntries === 1 ? 'y' : 'ies'} to this device? Anything already here with a matching ID will be overwritten.`,
    )
    if (!confirmed) return
    setRestoring(true)
    const data = await parseBackup(raw)
    await restoreBackup(data)
    setRestoring(false)
    navigate('/')
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

  const savePhotoSession = async (session: Session) => {
    await addSessions([session])
    navigate('/')
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
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Import a session</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Everything below happens entirely on this device — nothing is ever uploaded anywhere.
        </p>
      </div>

      <div className="inline-flex w-fit rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <ModeButton active={mode === 'text'} onClick={() => setMode('text')}>
          Paste conversation text
        </ModeButton>
        <ModeButton active={mode === 'photo'} onClick={() => setMode('photo')}>
          Add from a photo
        </ModeButton>
      </div>

      {mode === 'text' ? (
        <Card className="flex flex-col gap-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Paste a Claude.ai conversation export (JSON) or plain conversation text containing ERP session
            logs, and this device will pick out the structured session data automatically. You can also paste
            in a backup file from this app's own Settings → Export to restore it.
          </p>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Paste conversation export JSON, session text, or a previously exported backup here…"
            rows={14}
            className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-violet-900"
          />

          {isBackup && backupCounts && (
            <Card className="border-teal-300 bg-teal-50 dark:border-teal-900 dark:bg-teal-950/40">
              <p className="text-sm text-teal-800 dark:text-teal-300">
                This looks like an ERP Insights backup — {backupCounts.sessions} session
                {backupCounts.sessions === 1 ? '' : 's'} and {backupCounts.journalEntries} journal entr
                {backupCounts.journalEntries === 1 ? 'y' : 'ies'} found. Restoring adds them to this device;
                anything already here with a matching ID gets overwritten.
              </p>
            </Card>
          )}

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
            {isBackup ? (
              <PrimaryButton onClick={runRestore} disabled={!raw.trim() || restoring}>
                {restoring ? 'Restoring…' : 'Restore backup'}
              </PrimaryButton>
            ) : (
              <PrimaryButton onClick={runParse} disabled={!raw.trim()}>
                Parse
              </PrimaryButton>
            )}
          </div>
        </Card>
      ) : (
        <PhotoEntry onSave={savePhotoSession} />
      )}
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
          : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
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

  const resistedText =
    session.compulsions_resisted === true
      ? 'Fully resisted'
      : session.compulsions_resisted === false
        ? 'Partial resistance'
        : null

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

      {!expanded && (session.peak_suds !== null || session.end_suds !== null || resistedText) && (
        <p className="mt-1.5 text-xs text-slate-400">
          {(session.peak_suds !== null || session.end_suds !== null) && (
            <span>
              Peak {session.peak_suds ?? '—'} → End {session.end_suds ?? '—'}
            </span>
          )}
          {resistedText && <span>{session.peak_suds !== null || session.end_suds !== null ? ' · ' : ''}{resistedText}</span>}
        </p>
      )}

      {session.flags.length > 0 && (
        <ul className="mt-3 list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
          {session.flags.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}

      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
          <SessionFields session={session} onChange={onChange} />
        </div>
      )}
    </Card>
  )
}
