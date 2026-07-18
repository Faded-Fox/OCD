import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteAllSessions, exportAllAsJson } from '../lib/db'
import { useSessions } from '../lib/useSessions'
import { Card, PrimaryButton, SecondaryButton } from '../components/ui'

export default function Settings() {
  const { sessions } = useSessions()
  const navigate = useNavigate()
  const [confirmText, setConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    const json = await exportAllAsJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `erp-sessions-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const handleDeleteAll = async () => {
    await deleteAllSessions()
    setConfirmText('')
    navigate('/')
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {sessions.length} session{sessions.length === 1 ? '' : 's'} stored on this device.
        </p>
      </div>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Privacy</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          This app runs entirely on your device. Session data is stored locally in your browser's IndexedDB.
          There is no backend, no account, no analytics, and nothing is ever transmitted off this device.
          Uninstalling the app or clearing site data will remove everything.
        </p>
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Export data</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Download every logged session as a single JSON file — useful as a backup, or to bring structured data
          to a specialist appointment.
        </p>
        <PrimaryButton onClick={handleExport} disabled={exporting || sessions.length === 0} className="mt-3">
          {exporting ? 'Preparing…' : 'Export all data as JSON'}
        </PrimaryButton>
      </Card>

      <Card className="border-rose-200 dark:border-rose-900">
        <h2 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Delete all data</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Permanently erases every session stored on this device. This cannot be undone — export a backup first
          if you want to keep a copy.
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
            disabled={confirmText.toLowerCase() !== 'delete' || sessions.length === 0}
            className="border-rose-300 text-rose-600 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 dark:hover:bg-rose-950"
          >
            Delete all local data
          </SecondaryButton>
        </div>
      </Card>
    </div>
  )
}
