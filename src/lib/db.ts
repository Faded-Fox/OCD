import Dexie, { type Table } from 'dexie'
import type { Session } from './types'
import type { JournalEntry } from './journal'

class ErpInsightsDb extends Dexie {
  sessions!: Table<Session, string>
  journalEntries!: Table<JournalEntry, string>

  constructor() {
    super('erp-insights')
    this.version(1).stores({
      // indexed by internal id; secondary indexes for common queries
      sessions: 'id, date, hierarchy, rung',
    })
    this.version(2).stores({
      sessions: 'id, date, hierarchy, rung',
      journalEntries: 'id, date, type',
    })
  }
}

export const db = new ErpInsightsDb()

export async function getAllSessions(): Promise<Session[]> {
  const sessions = await db.sessions.toArray()
  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

export async function addSessions(sessions: Session[]): Promise<void> {
  await db.sessions.bulkAdd(sessions)
}

export async function updateSession(session: Session): Promise<void> {
  await db.sessions.put(session)
}

export async function deleteSession(id: string): Promise<void> {
  await db.sessions.delete(id)
}

export async function deleteAllSessions(): Promise<void> {
  await db.sessions.clear()
}

export async function getAllJournalEntries(): Promise<JournalEntry[]> {
  const entries = await db.journalEntries.toArray()
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function addJournalEntry(entry: JournalEntry): Promise<void> {
  await db.journalEntries.add(entry)
}

export async function deleteJournalEntry(id: string): Promise<void> {
  await db.journalEntries.delete(id)
}

export async function deleteAllJournalEntries(): Promise<void> {
  await db.journalEntries.clear()
}

export async function deleteAllData(): Promise<void> {
  await Promise.all([deleteAllSessions(), deleteAllJournalEntries()])
}

/** Restores sessions/journal entries from a parsed backup. Uses put (upsert) rather
 *  than add, so re-restoring the same backup — or restoring onto a device that
 *  already has some overlapping records — replaces matching ids instead of erroring. */
export async function restoreBackup(data: { sessions: Session[]; journalEntries: JournalEntry[] }): Promise<void> {
  await Promise.all([
    data.sessions.length ? db.sessions.bulkPut(data.sessions) : undefined,
    data.journalEntries.length ? db.journalEntries.bulkPut(data.journalEntries) : undefined,
  ])
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function exportAllAsJson(): Promise<string> {
  const [sessions, journalEntries] = await Promise.all([getAllSessions(), getAllJournalEntries()])
  const exportableSessions = await Promise.all(
    sessions.map(async (s) => ({
      ...s,
      photo: s.photo ? await blobToDataUrl(s.photo) : null,
    })),
  )
  return JSON.stringify({ sessions: exportableSessions, journalEntries }, null, 2)
}
