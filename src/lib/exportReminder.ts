const LAST_EXPORT_KEY = 'erp-insights:last-export-at'
const FIRST_DATA_KEY = 'erp-insights:first-data-at'
const SNOOZE_KEY = 'erp-insights:export-reminder-snoozed-until'

const REMINDER_INTERVAL_DAYS = 7
const SNOOZE_DAYS = 3
const DAY_MS = 24 * 60 * 60 * 1000

export function recordExported(): void {
  localStorage.setItem(LAST_EXPORT_KEY, new Date().toISOString())
  localStorage.removeItem(SNOOZE_KEY)
}

export function snoozeExportReminder(): void {
  localStorage.setItem(SNOOZE_KEY, new Date(Date.now() + SNOOZE_DAYS * DAY_MS).toISOString())
}

/** Anchors the first-ever reminder to roughly a week after data shows up,
 *  rather than to install time, so a brand-new user isn't nagged immediately. */
function ensureFirstDataAt(): string {
  const existing = localStorage.getItem(FIRST_DATA_KEY)
  if (existing) return existing
  const now = new Date().toISOString()
  localStorage.setItem(FIRST_DATA_KEY, now)
  return now
}

export function isExportOverdue(hasData: boolean): boolean {
  if (!hasData) return false

  const snoozedUntil = localStorage.getItem(SNOOZE_KEY)
  if (snoozedUntil && new Date(snoozedUntil).getTime() > Date.now()) return false

  const anchor = localStorage.getItem(LAST_EXPORT_KEY) ?? ensureFirstDataAt()
  return Date.now() - new Date(anchor).getTime() >= REMINDER_INTERVAL_DAYS * DAY_MS
}
