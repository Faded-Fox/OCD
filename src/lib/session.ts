import type { Session } from './types'

/** Observational, non-grade-like label for a session's stored `compulsions_resisted`
 *  value — kept as a boolean|null for compatibility, but described to the user as a
 *  response to the urge rather than a pass/fail score. */
export function urgeResponseLabel(resisted: boolean | null): string {
  if (resisted === true) return 'No compulsion done'
  if (resisted === false) return 'Did the compulsion'
  return 'Not sure / not tracked'
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

/** A blank session for manual entry (e.g. transcribing a photo of a handwritten log). */
export function createEmptySession(): Session {
  const today = new Date().toISOString().slice(0, 10)
  return {
    id: newId(),
    session_id: `${today}-manual`,
    date: today,
    hierarchy: '',
    rung: null,
    rung_description: '',
    target_suds_range: null,
    variation: null,
    exposure_type: null,
    planned_duration_minutes: null,
    readings: [],
    peak_suds: null,
    end_suds: null,
    compulsions_targeted: [],
    compulsions_completed: [],
    compulsions_resisted: null,
    techniques_used: [],
    notes: '',
    flags: [],
    source_excerpt: '',
    photo: null,
  }
}
