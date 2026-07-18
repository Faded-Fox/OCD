import Dexie, { type Table } from 'dexie'
import type { Session } from './types'

class ErpInsightsDb extends Dexie {
  sessions!: Table<Session, string>

  constructor() {
    super('erp-insights')
    this.version(1).stores({
      // indexed by internal id; secondary indexes for common queries
      sessions: 'id, date, hierarchy, rung',
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

export async function exportAllAsJson(): Promise<string> {
  const sessions = await getAllSessions()
  return JSON.stringify(sessions, null, 2)
}
