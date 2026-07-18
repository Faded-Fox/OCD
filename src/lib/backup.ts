import type { Session } from './types'
import type { JournalEntry } from './journal'

export interface BackupData {
  sessions: Session[]
  journalEntries: JournalEntry[]
}

interface RawBackupSession extends Omit<Session, 'photo'> {
  photo: string | null
}

interface RawBackup {
  sessions?: RawBackupSession[]
  journalEntries?: JournalEntry[]
}

/** True if the pasted/uploaded text is this app's own export shape, not a Claude
 *  conversation export — used to route it to restore instead of the text parser. */
export function looksLikeBackup(raw: string): boolean {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{')) return false
  try {
    const data = JSON.parse(trimmed) as unknown
    if (!data || typeof data !== 'object' || Array.isArray(data)) return false
    const obj = data as Record<string, unknown>
    return Array.isArray(obj.sessions) || Array.isArray(obj.journalEntries)
  } catch {
    return false
  }
}

export function countBackupEntries(raw: string): { sessions: number; journalEntries: number } {
  try {
    const data = JSON.parse(raw) as RawBackup
    return {
      sessions: Array.isArray(data.sessions) ? data.sessions.length : 0,
      journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries.length : 0,
    }
  } catch {
    return { sessions: 0, journalEntries: 0 }
  }
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

/** Parses an exported backup back into restorable records, decoding each
 *  session's photo from the data URL used for JSON export back into a Blob. */
export async function parseBackup(raw: string): Promise<BackupData> {
  const data = JSON.parse(raw) as RawBackup
  const sessions = await Promise.all(
    (data.sessions ?? []).map(async (s): Promise<Session> => ({
      ...s,
      photo: s.photo ? await dataUrlToBlob(s.photo) : null,
    })),
  )
  return { sessions, journalEntries: data.journalEntries ?? [] }
}
