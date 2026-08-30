import type { Session } from './types'

export const SUDS_MIN = 0
export const SUDS_MAX = 10

export function isValidSudsValue(n: number): boolean {
  return Number.isFinite(n) && n >= SUDS_MIN && n <= SUDS_MAX
}

export function sudsRangeError(range: [number, number] | null): string | null {
  if (range === null) return null
  const [low, high] = range
  if (!isValidSudsValue(low) || !isValidSudsValue(high)) {
    return `SUDS values must be between ${SUDS_MIN} and ${SUDS_MAX}.`
  }
  if (low > high) return 'Low end of the range must not be greater than the high end.'
  return null
}

/** Aggregate check across every SUDS-bearing field on a Session — used to gate
 *  Save buttons on the session edit / live-session wrap-up forms in one call. */
export function sessionSudsError(session: Session): string | null {
  const rangeErr = sudsRangeError(session.target_suds_range)
  if (rangeErr) return rangeErr
  if (session.peak_suds !== null && !isValidSudsValue(session.peak_suds)) {
    return `Peak SUDS must be between ${SUDS_MIN} and ${SUDS_MAX}.`
  }
  if (session.end_suds !== null && !isValidSudsValue(session.end_suds)) {
    return `End SUDS must be between ${SUDS_MIN} and ${SUDS_MAX}.`
  }
  const bad = session.readings.find((r) => !isValidSudsValue(r.suds))
  if (bad) return `Reading "${bad.label || 'unlabeled'}" has a SUDS value out of range.`
  return null
}
