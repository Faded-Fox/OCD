import type { Session } from './types'
import type { JournalEntry } from './journal'
import type { FocusPlanEntry } from './focusPlan'
import type { FearLadder } from './fearLadder'
import type { FlareGuide } from './flareGuide'

export interface BackupData {
  sessions: Session[]
  journalEntries: JournalEntry[]
  focusPlans: FocusPlanEntry[]
  fearLadders: FearLadder[]
  flareGuide: FlareGuide | null
}

interface RawBackupSession extends Omit<Session, 'photo'> {
  photo: string | null
}

interface RawBackup {
  sessions?: RawBackupSession[]
  journalEntries?: JournalEntry[]
  focusPlans?: FocusPlanEntry[]
  fearLadders?: FearLadder[]
  flareGuide?: FlareGuide | null
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
    return (
      Array.isArray(obj.sessions) ||
      Array.isArray(obj.journalEntries) ||
      Array.isArray(obj.focusPlans) ||
      Array.isArray(obj.fearLadders) ||
      Boolean(obj.flareGuide)
    )
  } catch {
    return false
  }
}

export interface BackupCounts {
  sessions: number
  journalEntries: number
  focusPlans: number
  fearLadders: number
  flareGuide: number
}

export function countBackupEntries(raw: string): BackupCounts {
  try {
    const data = JSON.parse(raw) as RawBackup
    return {
      sessions: Array.isArray(data.sessions) ? data.sessions.length : 0,
      journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries.length : 0,
      focusPlans: Array.isArray(data.focusPlans) ? data.focusPlans.length : 0,
      fearLadders: Array.isArray(data.fearLadders) ? data.fearLadders.length : 0,
      flareGuide: data.flareGuide ? 1 : 0,
    }
  } catch {
    return { sessions: 0, journalEntries: 0, focusPlans: 0, fearLadders: 0, flareGuide: 0 }
  }
}

/** Human-readable "3 sessions, 2 journal entries, and 1 focus plan" — omits any
 *  category that's zero, and scales cleanly as more categories get added. */
export function describeBackupCounts(counts: BackupCounts): string {
  const parts: string[] = []
  if (counts.sessions > 0) parts.push(`${counts.sessions} session${counts.sessions === 1 ? '' : 's'}`)
  if (counts.journalEntries > 0)
    parts.push(`${counts.journalEntries} journal entr${counts.journalEntries === 1 ? 'y' : 'ies'}`)
  if (counts.focusPlans > 0) parts.push(`${counts.focusPlans} focus plan${counts.focusPlans === 1 ? '' : 's'}`)
  if (counts.fearLadders > 0) parts.push(`${counts.fearLadders} fear ladder${counts.fearLadders === 1 ? '' : 's'}`)
  if (counts.flareGuide > 0) parts.push('a flare guide')
  if (parts.length === 0) return 'nothing'
  if (parts.length === 1) return parts[0]
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`
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
  return {
    sessions,
    journalEntries: data.journalEntries ?? [],
    focusPlans: data.focusPlans ?? [],
    fearLadders: data.fearLadders ?? [],
    flareGuide: data.flareGuide ?? null,
  }
}
