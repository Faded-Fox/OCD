import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { deleteAllData } from '../lib/db'
import { downloadBackup } from '../lib/export'
import { useSessions } from '../lib/useSessions'
import { useJournalEntries } from '../lib/useJournalEntries'
import { useFocusPlanEntries } from '../lib/useFocusPlanEntries'
import { useFearLadders } from '../lib/useFearLadders'
import { useFlareGuide } from '../lib/useFlareGuide'
import { isFlareGuideEmpty } from '../lib/flareGuide'
import { describeBackupCounts } from '../lib/backup'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'

export default function Settings() {
  const { sessions } = useSessions()
  const { entries: journalEntries } = useJournalEntries()
  const { entries: focusPlans } = useFocusPlanEntries()
  const { ladders: fearLadders } = useFearLadders()
  const { guide: flareGuide } = useFlareGuide()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)

  const hasFlareGuide = Boolean(flareGuide && !isFlareGuideEmpty(flareGuide))

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

  const hasData =
    sessions.length > 0 ||
    journalEntries.length > 0 ||
    focusPlans.length > 0 ||
    fearLadders.length > 0 ||
    hasFlareGuide

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
          })}{' '}
          stored on this device.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Privacy</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This app runs entirely on your device. Session, journal, focus plan, fear ladder, and flare guide data is
          stored locally in your browser's IndexedDB. There is no backend, no account, no analytics, and nothing is
          ever transmitted off this device. Uninstalling the app, clearing site data, or (on iPhone) not opening it
          for a while can all remove everything — export a backup below so a reinstall isn't a data loss.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Backup &amp; restore</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Download every logged session, journal entry, focus plan, fear ladder, and your flare guide as a single
          JSON file. Keep it somewhere that survives an app deletion — Files app, iCloud Drive, email to yourself —
          so that if this app ever gets deleted and reinstalled (or iOS clears its storage from disuse), you can
          bring everything back.
        </p>
        <PrimaryButton onClick={handleExport} disabled={exporting || !hasData} className="mt-3">
          {exporting ? 'Preparing…' : 'Export all data as JSON'}
        </PrimaryButton>
        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          To restore, go to <Link to="/import" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">Import</Link> and
          paste in or upload that same backup file — it's detected automatically and offered back as a
          restore rather than parsed as a new import.
        </p>
      </Card>

      <Card className="border-rose-200 dark:border-rose-900">
        <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Delete all data</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Permanently erases every session, journal entry, focus plan, fear ladder, and your flare guide stored on
          this device. This cannot be undone — export a backup first if you want to keep a copy.
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
