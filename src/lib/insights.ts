import type { Session, SudsReading } from './types'

// All computations below are descriptive summaries of logged data — not clinical
// interpretation, diagnosis, or treatment recommendations.

export interface HabituationPoint {
  session_id: string
  date: string
  hierarchy: string
  rung: number | null
  minutesToHabituate: number | null
}

export interface PeakTrendPoint {
  session_id: string
  date: string
  hierarchy: string
  rung: number | null
  peak_suds: number | null
  target_suds_range: [number, number] | null
}

export interface ResistanceRate {
  total: number
  knownTotal: number
  fullyResistedCount: number
  rate: number | null
}

export interface TechniqueCorrelationRow {
  technique: string
  sessionsWithCount: number
  sessionsWithoutCount: number
  avgHabituationWith: number | null
  avgHabituationWithout: number | null
  avgDropWith: number | null
  avgDropWithout: number | null
}

export interface RungProgressionRow {
  hierarchy: string
  rung: number
  target_suds_range: [number, number] | null
  attempts: number
  lastAttemptDate: string | null
  fullResistanceStreak: number
  readySignal: boolean
}

export interface HierarchyGap {
  hierarchy: string
  gaps: { fromDate: string; toDate: string; days: number }[]
  avgGapDays: number | null
}

export interface VariationComparisonRow {
  hierarchy: string
  rung: number
  variation: string
  variationAvgPeak: number | null
  originalAvgPeak: number | null
  variationAvgHabituation: number | null
  originalAvgHabituation: number | null
}

function clockToMinutes(s: string): number | null {
  const m = s.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if (!m) return null
  let h = Number(m[1])
  const min = Number(m[2])
  const ampm = m[3]?.toLowerCase()
  if (ampm === 'pm' && h < 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  return h * 60 + min
}

function clockBaseFor(session: Session): number | null {
  const clockCandidates = session.readings
    .map((r) => (typeof r.time_or_minute === 'string' ? clockToMinutes(r.time_or_minute) : null))
    .filter((v): v is number => v !== null)
  return clockCandidates.length ? Math.min(...clockCandidates) : null
}

/** Best-effort mapping of a session's readings onto a common relative-minutes timeline.
 *  Only includes readings whose timing could actually be determined — used for cross-session
 *  timing math (habituation speed) where a wrong guess would be worse than a gap. */
export function timedReadings(session: Session): { minutes: number; suds: number; label: string }[] {
  const clockBase = clockBaseFor(session)
  const out: { minutes: number; suds: number; label: string }[] = []
  for (const r of session.readings) {
    const minutes = readingMinutes(r, clockBase)
    if (minutes !== null) out.push({ minutes, suds: r.suds, label: r.label })
  }
  return out.sort((a, b) => a.minutes - b.minutes)
}

/** Every reading placed on an x-axis for display purposes: real minutes where known, and
 *  evenly-spaced ordinal positions (preserving logged order) for the rest. Unlike
 *  timedReadings, this always returns one point per reading so the session curve chart has
 *  something to draw even when only labeled summary readings (e.g. pre/peak/end) exist. */
export function displayCurve(session: Session): {
  points: { x: number; suds: number; label: string }[]
  isTimeBased: boolean
} {
  const clockBase = clockBaseFor(session)
  const withMinutes = session.readings.map((r) => ({
    label: r.label,
    suds: r.suds,
    minutes: readingMinutes(r, clockBase),
  }))

  if (withMinutes.every((r) => r.minutes !== null)) {
    const points = withMinutes
      .map((r) => ({ x: r.minutes as number, suds: r.suds, label: r.label }))
      .sort((a, b) => a.x - b.x)
    return { points, isTimeBased: true }
  }

  return { points: withMinutes.map((r, i) => ({ x: i, suds: r.suds, label: r.label })), isTimeBased: false }
}

function readingMinutes(r: SudsReading, clockBase: number | null): number | null {
  if (typeof r.time_or_minute === 'number') return r.time_or_minute
  if (typeof r.time_or_minute === 'string') {
    const clock = clockToMinutes(r.time_or_minute)
    if (clock !== null) return clockBase === null ? 0 : clock - clockBase
    if (r.label === 'pre') return 0
    const numMatch = r.time_or_minute.match(/(\d+)/)
    if (numMatch) return Number(numMatch[1])
  }
  return null
}

/** Minutes from the session's peak SUDs reading until SUDs drops back within (or below) the target range. */
export function minutesToHabituation(session: Session): number | null {
  const timed = timedReadings(session)
  if (timed.length < 2) return null
  const peak = timed.reduce((a, b) => (b.suds > a.suds ? b : a))
  const upperBound = session.target_suds_range ? session.target_suds_range[1] : peak.suds * 0.5
  const after = timed.filter((t) => t.minutes >= peak.minutes)
  const habituated = after.find((t) => t.suds <= upperBound)
  if (!habituated || habituated.minutes === peak.minutes) return null
  return habituated.minutes - peak.minutes
}

export function habituationTrend(sessions: Session[]): HabituationPoint[] {
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      session_id: s.session_id,
      date: s.date,
      hierarchy: s.hierarchy,
      rung: s.rung,
      minutesToHabituate: minutesToHabituation(s),
    }))
}

export function peakSudsTrend(sessions: Session[]): PeakTrendPoint[] {
  return [...sessions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({
      session_id: s.session_id,
      date: s.date,
      hierarchy: s.hierarchy,
      rung: s.rung,
      peak_suds: s.peak_suds,
      target_suds_range: s.target_suds_range,
    }))
}

export function compulsionResistanceRate(sessions: Session[]): ResistanceRate {
  const known = sessions.filter((s) => s.compulsions_resisted !== null)
  const fully = known.filter((s) => s.compulsions_resisted === true)
  return {
    total: sessions.length,
    knownTotal: known.length,
    fullyResistedCount: fully.length,
    rate: known.length ? fully.length / known.length : null,
  }
}

export function compulsionResistanceRateByHierarchy(sessions: Session[]): Record<string, ResistanceRate> {
  const byHierarchy: Record<string, Session[]> = {}
  for (const s of sessions) {
    const key = s.hierarchy || 'Unlabeled'
    ;(byHierarchy[key] ??= []).push(s)
  }
  const out: Record<string, ResistanceRate> = {}
  for (const [hierarchy, list] of Object.entries(byHierarchy)) {
    out[hierarchy] = compulsionResistanceRate(list)
  }
  return out
}

function average(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

function peakToEndDrop(session: Session): number | null {
  if (session.peak_suds === null || session.end_suds === null) return null
  return session.peak_suds - session.end_suds
}

/** Descriptive comparison only — not a causal claim. */
export function techniqueCorrelation(sessions: Session[]): TechniqueCorrelationRow[] {
  const allTechniques = new Set<string>()
  for (const s of sessions) for (const t of s.techniques_used) allTechniques.add(t)

  return Array.from(allTechniques)
    .map((technique) => {
      const withTechnique = sessions.filter((s) => s.techniques_used.includes(technique))
      const withoutTechnique = sessions.filter((s) => !s.techniques_used.includes(technique))
      return {
        technique,
        sessionsWithCount: withTechnique.length,
        sessionsWithoutCount: withoutTechnique.length,
        avgHabituationWith: average(withTechnique.map(minutesToHabituation)),
        avgHabituationWithout: average(withoutTechnique.map(minutesToHabituation)),
        avgDropWith: average(withTechnique.map(peakToEndDrop)),
        avgDropWithout: average(withoutTechnique.map(peakToEndDrop)),
      }
    })
    .sort((a, b) => b.sessionsWithCount - a.sessionsWithCount)
}

export function rungProgression(sessions: Session[]): RungProgressionRow[] {
  const byKey = new Map<string, Session[]>()
  for (const s of sessions) {
    if (s.rung === null) continue
    const key = `${s.hierarchy}|||${s.rung}`
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key)!.push(s)
  }

  const rows: RungProgressionRow[] = []
  for (const [key, list] of byKey.entries()) {
    const [hierarchy, rungStr] = key.split('|||')
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date))
    const lastTwo = sorted.slice(-2)
    const readySignal =
      lastTwo.length === 2 &&
      lastTwo.every((s) => {
        const inRange = s.target_suds_range ? (s.end_suds ?? Infinity) <= s.target_suds_range[1] : true
        return s.compulsions_resisted === true && inRange
      })

    let streak = 0
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].compulsions_resisted === true) streak++
      else break
    }

    rows.push({
      hierarchy,
      rung: Number(rungStr),
      target_suds_range: sorted[sorted.length - 1]?.target_suds_range ?? null,
      attempts: sorted.length,
      lastAttemptDate: sorted[sorted.length - 1]?.date || null,
      fullResistanceStreak: streak,
      readySignal,
    })
  }

  return rows.sort((a, b) => a.hierarchy.localeCompare(b.hierarchy) || a.rung - b.rung)
}

export function sessionFrequency(sessions: Session[]): HierarchyGap[] {
  const byHierarchy: Record<string, Session[]> = {}
  for (const s of sessions) {
    if (!s.date) continue
    const key = s.hierarchy || 'Unlabeled'
    ;(byHierarchy[key] ??= []).push(s)
  }

  return Object.entries(byHierarchy).map(([hierarchy, list]) => {
    const dates = [...list].map((s) => s.date).sort()
    const gaps: { fromDate: string; toDate: string; days: number }[] = []
    for (let i = 1; i < dates.length; i++) {
      const days = Math.round(
        (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / (1000 * 60 * 60 * 24),
      )
      gaps.push({ fromDate: dates[i - 1], toDate: dates[i], days })
    }
    return {
      hierarchy,
      gaps,
      avgGapDays: gaps.length ? gaps.reduce((a, b) => a + b.days, 0) / gaps.length : null,
    }
  })
}

export function variationEffect(sessions: Session[]): VariationComparisonRow[] {
  const groups = new Map<string, Session[]>()
  for (const s of sessions) {
    if (s.rung === null) continue
    const key = `${s.hierarchy}|||${s.rung}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }

  const rows: VariationComparisonRow[] = []
  for (const [key, list] of groups.entries()) {
    const [hierarchy, rungStr] = key.split('|||')
    const originals = list.filter((s) => !s.variation)
    const variationNames = new Set(list.filter((s) => s.variation).map((s) => s.variation as string))
    for (const variation of variationNames) {
      const variants = list.filter((s) => s.variation === variation)
      rows.push({
        hierarchy,
        rung: Number(rungStr),
        variation,
        variationAvgPeak: average(variants.map((s) => s.peak_suds)),
        originalAvgPeak: average(originals.map((s) => s.peak_suds)),
        variationAvgHabituation: average(variants.map(minutesToHabituation)),
        originalAvgHabituation: average(originals.map(minutesToHabituation)),
      })
    }
  }
  return rows
}

export function computeInsights(sessions: Session[]) {
  return {
    habituationTrend: habituationTrend(sessions),
    peakSudsTrend: peakSudsTrend(sessions),
    resistanceRate: compulsionResistanceRate(sessions),
    resistanceRateByHierarchy: compulsionResistanceRateByHierarchy(sessions),
    techniqueCorrelation: techniqueCorrelation(sessions),
    rungProgression: rungProgression(sessions),
    sessionFrequency: sessionFrequency(sessions),
    variationEffect: variationEffect(sessions),
  }
}
