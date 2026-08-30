import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAllData, restoreBackup } from '../lib/db'
import { downloadBackup } from '../lib/export'
import { useSessions } from '../lib/useSessions'
import { useJournalEntries } from '../lib/useJournalEntries'
import { useFocusPlanEntries } from '../lib/useFocusPlanEntries'
import { useFearLadders } from '../lib/useFearLadders'
import { useFlareGuide } from '../lib/useFlareGuide'
import { isFlareGuideEmpty } from '../lib/flareGuide'
import { useValuesGuide } from '../lib/useValuesGuide'
import { isValuesGuideEmpty } from '../lib/values'
import { countBackupEntries, describeBackupCounts, looksLikeBackup, parseBackup } from '../lib/backup'
import { useStoragePersistence } from '../lib/useStoragePersistence'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'

export default function Settings() {
  const { sessions } = useSessions()
  const { entries: journalEntries } = useJournalEntries()
  const { entries: focusPlans } = useFocusPlanEntries()
  const { ladders: fearLadders } = useFearLadders()
  const { guide: flareGuide } = useFlareGuide()
  const { guide: valuesGuide } = useValuesGuide()
  const { status: persistenceStatus, request: requestPersistence, requesting: requestingPersistence } =
    useStoragePersistence()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)
  const [restoreRaw, setRestoreRaw] = useState('')
  const [restoring, setRestoring] = useState(false)
  const restoreFileInputRef = useRef<HTMLInputElement>(null)

  const hasFlareGuide = Boolean(flareGuide && !isFlareGuideEmpty(flareGuide))
  const hasValuesGuide = Boolean(valuesGuide && !isValuesGuideEmpty(valuesGuide))

  const handleExport = async () => {
    setExporting(true)
    await downloadBackup()
    setExporting(false)
  }

  const handleDeleteAll = async () => {
    await deleteAllData()
    setConfirmText('')
    navigate('/')
  }

  const handleRestoreFile = async (file: File) => {
    setRestoreRaw(await file.text())
  }

  const isBackup = useMemo(() => looksLikeBackup(restoreRaw), [restoreRaw])
  const backupCounts = useMemo(() => (isBackup ? countBackupEntries(restoreRaw) : null), [isBackup, restoreRaw])

  const runRestore = async () => {
    if (!backupCounts || backupCounts.sessions + backupCounts.journalEntries + backupCounts.focusPlans === 0) return
    const confirmed = confirm(
      `Restore ${describeBackupCounts(backupCounts)} to this device? Anything already here with a matching ID will be overwritten.`,
    )
    if (!confirmed) return
    setRestoring(true)
    const data = await parseBackup(restoreRaw)
    await restoreBackup(data)
    setRestoring(false)
    navigate('/')
  }

  const hasData =
    sessions.length > 0 ||
    journalEntries.length > 0 ||
    focusPlans.length > 0 ||
    fearLadders.length > 0 ||
    hasFlareGuide ||
    hasValuesGuide

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {describeBackupCounts({
            sessions: sessions.length,
            journalEntries: journalEntries.length,
            focusPlans: focusPlans.length,
            fearLadders: fearLadders.length,
            flareGuide: hasFlareGuide ? 1 : 0,
            valuesGuide: hasValuesGuide ? 1 : 0,
          })}{' '}
          stored on this device.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Privacy</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This app runs entirely on your device. Session, journal, focus plan, fear ladder, flare guide, and values
          data is stored locally in your browser's IndexedDB. There is no backend, no account, no analytics, and
          nothing is ever transmitted off this device. Uninstalling the app, clearing site data, or (on iPhone) not
          opening it for a while can all remove everything — export a backup below so a reinstall isn't a data loss.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Storage persistence</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {persistenceStatus === 'unsupported' &&
            "This browser doesn't support requesting persistent storage — regular backups (below) are the reliable way to protect your data here."}
          {persistenceStatus === 'checking' && 'Checking…'}
          {persistenceStatus === 'granted' &&
            "Granted — this browser has marked PocketFox's storage as persistent, making it less likely to be cleared automatically if the device is low on space or the app goes unused for a while."}
          {persistenceStatus === 'not-granted' &&
            "Not currently granted. Requesting it won't change anything you do day to day, but it may lower the odds of the browser silently clearing this app's data."}
        </p>
        {persistenceStatus === 'not-granted' && (
          <SecondaryButton onClick={requestPersistence} disabled={requestingPersistence} className="mt-3">
            {requestingPersistence ? 'Requesting…' : 'Request persistent storage'}
          </SecondaryButton>
        )}
        <p className="mt-3 text-xs text-slate-400">
          This is a best-effort browser signal, not a guarantee — it doesn't replace exporting a backup.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Backup &amp; restore</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Download every logged session, journal entry, focus plan, fear ladder, flare guide, and your values list as
          a single JSON file. Keep it somewhere that survives an app deletion — Files app, iCloud Drive, email to
          yourself — so that if this app ever gets deleted and reinstalled (or iOS clears its storage from disuse),
          you can bring everything back.
        </p>
        <PrimaryButton onClick={handleExport} disabled={exporting || !hasData} className="mt-3">
          {exporting ? 'Preparing…' : 'Export all data as JSON'}
        </PrimaryButton>
        <p className="mt-5 text-sm text-slate-600 dark:text-slate-300">
          To restore, paste or upload a previously exported backup file below.
        </p>
        <textarea
          value={restoreRaw}
          onChange={(e) => setRestoreRaw(e.target.value)}
          placeholder="Paste a backup file exported from this screen…"
          rows={6}
          className="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:focus:ring-amber-900"
        />
        {isBackup && backupCounts && (
          <Card className="mt-3 border-emerald-300 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/40">
            <p className="text-sm text-emerald-800 dark:text-emerald-300">
              This looks like a PocketFox Companion backup — {describeBackupCounts(backupCounts)} found. Restoring
              adds them to this device; anything already here with a matching ID gets overwritten.
            </p>
          </Card>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SecondaryButton onClick={() => restoreFileInputRef.current?.click()}>Upload file…</SecondaryButton>
          <input
            ref={restoreFileInputRef}
            type="file"
            accept=".json,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleRestoreFile(file)
              e.target.value = ''
            }}
          />
          <PrimaryButton onClick={runRestore} disabled={!isBackup || restoring}>
            {restoring ? 'Restoring…' : 'Restore backup'}
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Therapist summary</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          A separate, printable report — resistance rates by hierarchy, recent sessions, focus plan debriefs — for
          bringing to a session, rather than handing over the raw backup file above.
        </p>
        <Link to="/summary">
          <PrimaryButton className="mt-3">Open therapist summary</PrimaryButton>
        </Link>
      </Card>

      <Card className="border-rose-200 dark:border-rose-900">
        <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Delete all data</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Permanently erases every session, journal entry, focus plan, fear ladder, flare guide, and your values
          list stored on this device. This cannot be undone — export a backup first if you want to keep a copy.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "delete" to confirm'
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-rose-900"
          />
          <SecondaryButton
            onClick={handleDeleteAll}
            disabled={confirmText.toLowerCase() !== 'delete' || !hasData}
            className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
          >
            Delete all local data
          </SecondaryButton>
        </div>
      </Card>
    </div>
  )
}
