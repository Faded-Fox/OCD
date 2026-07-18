import { exportAllAsJson } from './db'
import { recordExported } from './exportReminder'

export async function downloadBackup(): Promise<void> {
  const json = await exportAllAsJson()
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `erp-sessions-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  recordExported()
}
