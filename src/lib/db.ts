import Dexie, { type Table } from 'dexie'
import type { Session } from './types'
import type { JournalEntry } from './journal'
import type { FocusPlanEntry } from './focusPlan'
import type { FearLadder } from './fearLadder'
import { FLARE_GUIDE_ID, type FlareGuide } from './flareGuide'

class ErpInsightsDb extends Dexie {
  sessions!: Table<Session, string>
  journalEntries!: Table<JournalEntry, string>
  focusPlans!: Table<FocusPlanEntry, string>
  fearLadders!: Table<FearLadder, string>
  flareGuide!: Table<FlareGuide, string>

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
    this.version(3).stores({
      sessions: 'id, date, hierarchy, rung',
      journalEntries: 'id, date, type',
      focusPlans: 'id, date',
    })
    this.version(4).stores({
      sessions: 'id, date, hierarchy, rung',
      journalEntries: 'id, date, type',
      focusPlans: 'id, date',
      fearLadders: 'id, hierarchy',
    })
    this.version(5).stores({
      sessions: 'id, date, hierarchy, rung',
      journalEntries: 'id, date, type',
      focusPlans: 'id, date',
      fearLadders: 'id, hierarchy',
      flareGuide: 'id',
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

export async function getAllFocusPlanEntries(): Promise<FocusPlanEntry[]> {
  const entries = await db.focusPlans.toArray()
  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function saveFocusPlanEntry(entry: FocusPlanEntry): Promise<void> {
  await db.focusPlans.put(entry)
}

export async function deleteFocusPlanEntry(id: string): Promise<void> {
  await db.focusPlans.delete(id)
}

export async function deleteAllFocusPlanEntries(): Promise<void> {
  await db.focusPlans.clear()
}

export async function getAllFearLadders(): Promise<FearLadder[]> {
  const ladders = await db.fearLadders.toArray()
  return ladders.sort((a, b) => a.hierarchy.localeCompare(b.hierarchy))
}

export async function getFearLadderForHierarchy(hierarchy: string): Promise<FearLadder | undefined> {
  return db.fearLadders.where('hierarchy').equals(hierarchy).first()
}

export async function saveFearLadder(ladder: FearLadder): Promise<void> {
  await db.fearLadders.put(ladder)
}

export async function deleteFearLadder(id: string): Promise<void> {
  await db.fearLadders.delete(id)
}

export async function deleteAllFearLadders(): Promise<void> {
  await db.fearLadders.clear()
}

export async function getFlareGuide(): Promise<FlareGuide | undefined> {
  return db.flareGuide.get(FLARE_GUIDE_ID)
}

export async function saveFlareGuide(guide: FlareGuide): Promise<void> {
  await db.flareGuide.put({ ...guide, id: FLARE_GUIDE_ID })
}

export async function deleteAllFlareGuide(): Promise<void> {
  await db.flareGuide.clear()
}

export async function deleteAllData(): Promise<void> {
  await Promise.all([
    deleteAllSessions(),
    deleteAllJournalEntries(),
    deleteAllFocusPlanEntries(),
    deleteAllFearLadders(),
    deleteAllFlareGuide(),
  ])
}

/** Restores sessions/journal/focus-plan/fear-ladder/flare-guide data from a parsed
 *  backup. Uses put (upsert) rather than add, so re-restoring the same backup — or
 *  restoring onto a device that already has some overlapping records — replaces
 *  matching ids instead of erroring. */
export async function restoreBackup(data: {
  sessions: Session[]
  journalEntries: JournalEntry[]
  focusPlans: FocusPlanEntry[]
  fearLadders: FearLadder[]
  flareGuide: FlareGuide | null
}): Promise<void> {
  await Promise.all([
    data.sessions.length ? db.sessions.bulkPut(data.sessions) : undefined,
    data.journalEntries.length ? db.journalEntries.bulkPut(data.journalEntries) : undefined,
    data.focusPlans.length ? db.focusPlans.bulkPut(data.focusPlans) : undefined,
    data.fearLadders.length ? db.fearLadders.bulkPut(data.fearLadders) : undefined,
    data.flareGuide ? db.flareGuide.put(data.flareGuide) : undefined,
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
  const [sessions, journalEntries, focusPlans, fearLadders, flareGuide] = await Promise.all([
    getAllSessions(),
    getAllJournalEntries(),
    getAllFocusPlanEntries(),
    getAllFearLadders(),
    getFlareGuide(),
  ])
  const exportableSessions = await Promise.all(
    sessions.map(async (s) => ({
      ...s,
      photo: s.photo ? await blobToDataUrl(s.photo) : null,
    })),
  )
  return JSON.stringify(
    { sessions: exportableSessions, journalEntries, focusPlans, fearLadders, flareGuide: flareGuide ?? null },
    null,
    2,
  )
}
