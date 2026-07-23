import { describe, expect, it } from 'vitest'
import {
  compulsionResistanceRate,
  compulsionResistanceRateByHierarchy,
  displayCurve,
  habituationTrend,
  minutesToHabituation,
  peakSudsTrend,
  rungProgression,
  sessionFrequency,
  techniqueCorrelation,
  timedReadings,
  variationEffect,
} from './insights'
import type { Session, SudsReading } from './types'

let nextId = 0

/** Minimal Session fixture with sane defaults, so each test only spells out what it cares about. */
function makeSession(overrides: Partial<Session> = {}): Session {
  nextId += 1
  return {
    id: `id-${nextId}`,
    session_id: `session-${nextId}`,
    date: '2026-01-01',
    hierarchy: 'Contamination',
    rung: 1,
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
    ...overrides,
  }
}

function reading(label: string, time_or_minute: SudsReading['time_or_minute'], suds: number): SudsReading {
  return { label, time_or_minute, suds }
}

describe('timedReadings', () => {
  it('passes numeric time_or_minute through and sorts by minutes', () => {
    const session = makeSession({
      readings: [reading('10min', 10, 4), reading('pre', 0, 6), reading('5min', 5, 8)],
    })
    expect(timedReadings(session).map((r) => r.minutes)).toEqual([0, 5, 10])
  })

  it('converts clock-time readings to minutes relative to the earliest clock reading', () => {
    const session = makeSession({
      readings: [reading('start', '10:00am', 6), reading('later', '10:15am', 3)],
    })
    expect(timedReadings(session)).toEqual([
      { minutes: 0, suds: 6, label: 'start' },
      { minutes: 15, suds: 3, label: 'later' },
    ])
  })

  it('treats a "pre" labeled reading with unparsable timing as minute 0', () => {
    const session = makeSession({ readings: [reading('pre', 'baseline', 5)] })
    expect(timedReadings(session)).toEqual([{ minutes: 0, suds: 5, label: 'pre' }])
  })

  it('falls back to a bare digit inside the time string when not a clock time', () => {
    const session = makeSession({ readings: [reading('reread', '5min', 7)] })
    expect(timedReadings(session)).toEqual([{ minutes: 5, suds: 7, label: 'reread' }])
  })

  it('drops readings whose timing cannot be determined at all', () => {
    const session = makeSession({
      readings: [reading('pre', 0, 5), reading('end', 'end', 2)],
    })
    expect(timedReadings(session)).toEqual([{ minutes: 0, suds: 5, label: 'pre' }])
  })
})

describe('displayCurve', () => {
  it('is time-based when every reading resolves to a minute, sorted by x', () => {
    const session = makeSession({
      readings: [reading('5min', 5, 8), reading('pre', 0, 5)],
    })
    const { points, isTimeBased } = displayCurve(session)
    expect(isTimeBased).toBe(true)
    expect(points).toEqual([
      { x: 0, suds: 5, label: 'pre' },
      { x: 5, suds: 8, label: '5min' },
    ])
  })

  it('falls back to ordinal positions for every point if even one reading has no resolvable minute', () => {
    const session = makeSession({
      readings: [reading('pre', 0, 5), reading('mystery', 'unresolvable', 8), reading('end', 'end', 3)],
    })
    const { points, isTimeBased } = displayCurve(session)
    expect(isTimeBased).toBe(false)
    // Falls back to logged order, not just for the unresolvable one — all three.
    expect(points).toEqual([
      { x: 0, suds: 5, label: 'pre' },
      { x: 1, suds: 8, label: 'mystery' },
      { x: 2, suds: 3, label: 'end' },
    ])
  })

  it('returns an empty curve for a session with no readings', () => {
    const session = makeSession({ readings: [] })
    expect(displayCurve(session)).toEqual({ points: [], isTimeBased: true })
  })
})

describe('minutesToHabituation', () => {
  it('returns null with fewer than two timeable readings', () => {
    expect(minutesToHabituation(makeSession({ readings: [reading('pre', 0, 5)] }))).toBeNull()
  })

  it('measures minutes from peak until SUDs drops to the target range upper bound', () => {
    const session = makeSession({
      target_suds_range: [0, 3],
      readings: [reading('pre', 0, 5), reading('5min', 5, 8), reading('10min', 10, 3)],
    })
    expect(minutesToHabituation(session)).toBe(5)
  })

  it('defaults the habituation threshold to exactly half the peak when there is no target range', () => {
    // peak is 10 (at 5min), so the threshold is 5. The 10min reading (suds 6) is above
    // that threshold and must NOT count — only the 15min reading (suds 4) qualifies.
    // A wider threshold (e.g. accidentally using 0.9x instead of 0.5x) would wrongly
    // let the 10min reading count instead, changing the result from 10 to 5.
    const session = makeSession({
      readings: [
        reading('pre', 0, 3),
        reading('5min', 5, 10),
        reading('10min', 10, 6),
        reading('15min', 15, 4),
      ],
    })
    expect(minutesToHabituation(session)).toBe(10)
  })

  it('returns null when SUDs never comes back down after the peak', () => {
    const session = makeSession({
      target_suds_range: [0, 3],
      readings: [reading('pre', 0, 5), reading('5min', 5, 8)],
    })
    expect(minutesToHabituation(session)).toBeNull()
  })

  it('returns null when the only reading that qualifies is the peak reading itself', () => {
    // Target range is wide enough that the peak reading's own SUDs value already
    // satisfies "<= upper bound" — the match must come strictly after the peak, not be it.
    const session = makeSession({
      target_suds_range: [0, 10],
      readings: [reading('pre', 0, 5), reading('5min', 5, 8)], // 5min is the peak
    })
    expect(minutesToHabituation(session)).toBeNull()
  })
})

describe('habituationTrend / peakSudsTrend', () => {
  it('sorts sessions by date ascending', () => {
    const s1 = makeSession({ date: '2026-02-01', session_id: 'later' })
    const s2 = makeSession({ date: '2026-01-01', session_id: 'earlier' })
    expect(habituationTrend([s1, s2]).map((p) => p.session_id)).toEqual(['earlier', 'later'])
    expect(peakSudsTrend([s1, s2]).map((p) => p.session_id)).toEqual(['earlier', 'later'])
  })

  it('peakSudsTrend passes through peak and target range untouched', () => {
    const s = makeSession({ peak_suds: 7, target_suds_range: [2, 4] })
    expect(peakSudsTrend([s])[0]).toMatchObject({ peak_suds: 7, target_suds_range: [2, 4] })
  })
})

describe('compulsionResistanceRate', () => {
  it('handles an empty session list', () => {
    expect(compulsionResistanceRate([])).toEqual({ total: 0, knownTotal: 0, fullyResistedCount: 0, rate: null })
  })

  it('excludes unknown (null) sessions from the rate but counts them in total', () => {
    const sessions = [
      makeSession({ compulsions_resisted: true }),
      makeSession({ compulsions_resisted: false }),
      makeSession({ compulsions_resisted: null }),
    ]
    expect(compulsionResistanceRate(sessions)).toEqual({
      total: 3,
      knownTotal: 2,
      fullyResistedCount: 1,
      rate: 0.5,
    })
  })
})

describe('compulsionResistanceRateByHierarchy', () => {
  it('groups by hierarchy and buckets blank hierarchies as Unlabeled', () => {
    const sessions = [
      makeSession({ hierarchy: 'Contamination', compulsions_resisted: true }),
      makeSession({ hierarchy: 'Contamination', compulsions_resisted: false }),
      makeSession({ hierarchy: '', compulsions_resisted: true }),
    ]
    const byHierarchy = compulsionResistanceRateByHierarchy(sessions)
    expect(byHierarchy['Contamination'].rate).toBe(0.5)
    expect(byHierarchy['Unlabeled'].rate).toBe(1)
  })
})

describe('techniqueCorrelation', () => {
  it('splits sessions by whether they used each technique and averages both groups', () => {
    const withBreathing = makeSession({
      techniques_used: ['breathing'],
      peak_suds: 8,
      end_suds: 2,
      readings: [reading('pre', 0, 8), reading('5min', 5, 2)],
    })
    const withoutBreathing = makeSession({
      techniques_used: [],
      peak_suds: 8,
      end_suds: 6,
      readings: [reading('pre', 0, 8), reading('5min', 5, 6)],
    })
    const rows = techniqueCorrelation([withBreathing, withoutBreathing])
    const breathingRow = rows.find((r) => r.technique === 'breathing')!
    expect(breathingRow.sessionsWithCount).toBe(1)
    expect(breathingRow.sessionsWithoutCount).toBe(1)
    expect(breathingRow.avgDropWith).toBe(6)
    expect(breathingRow.avgDropWithout).toBe(2)
  })

  it('sorts techniques by how many sessions used them, descending', () => {
    const common = makeSession({ techniques_used: ['breathing', 'grounding'] })
    const alsoCommon = makeSession({ techniques_used: ['breathing'] })
    const rows = techniqueCorrelation([common, alsoCommon])
    expect(rows[0].technique).toBe('breathing')
    expect(rows[0].sessionsWithCount).toBe(2)
  })

  it('returns an empty array when no session logged any technique', () => {
    expect(techniqueCorrelation([makeSession()])).toEqual([])
  })
})

describe('rungProgression', () => {
  it('ignores sessions with no rung set', () => {
    expect(rungProgression([makeSession({ rung: null })])).toEqual([])
  })

  it('groups by hierarchy + rung and reports attempts and last attempt date', () => {
    const rows = rungProgression([
      makeSession({ hierarchy: 'Contamination', rung: 2, date: '2026-01-01' }),
      makeSession({ hierarchy: 'Contamination', rung: 2, date: '2026-01-05' }),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ hierarchy: 'Contamination', rung: 2, attempts: 2, lastAttemptDate: '2026-01-05' })
  })

  it('signals readiness only when the last two attempts were both fully resisted and within target range', () => {
    const ready = rungProgression([
      makeSession({
        rung: 3,
        date: '2026-01-01',
        compulsions_resisted: true,
        target_suds_range: [0, 3],
        end_suds: 2,
      }),
      makeSession({
        rung: 3,
        date: '2026-01-02',
        compulsions_resisted: true,
        target_suds_range: [0, 3],
        end_suds: 3,
      }),
    ])
    expect(ready[0].readySignal).toBe(true)

    const notReady = rungProgression([
      makeSession({
        rung: 3,
        date: '2026-01-01',
        compulsions_resisted: true,
        target_suds_range: [0, 3],
        end_suds: 2,
      }),
      makeSession({
        rung: 3,
        date: '2026-01-02',
        compulsions_resisted: true,
        target_suds_range: [0, 3],
        end_suds: 5, // outside the target range
      }),
    ])
    expect(notReady[0].readySignal).toBe(false)
  })

  it('does not signal readiness with only a single attempt', () => {
    const rows = rungProgression([makeSession({ rung: 1, compulsions_resisted: true })])
    expect(rows[0].readySignal).toBe(false)
  })

  it('counts the full-resistance streak back from the most recent attempt only', () => {
    const rows = rungProgression([
      makeSession({ rung: 1, date: '2026-01-01', compulsions_resisted: false }),
      makeSession({ rung: 1, date: '2026-01-02', compulsions_resisted: true }),
      makeSession({ rung: 1, date: '2026-01-03', compulsions_resisted: true }),
    ])
    expect(rows[0].fullResistanceStreak).toBe(2)
  })

  it('sorts rows by hierarchy then rung number', () => {
    const rows = rungProgression([
      makeSession({ hierarchy: 'Harm', rung: 1 }),
      makeSession({ hierarchy: 'Contamination', rung: 5 }),
      makeSession({ hierarchy: 'Contamination', rung: 2 }),
    ])
    expect(rows.map((r) => `${r.hierarchy}-${r.rung}`)).toEqual(['Contamination-2', 'Contamination-5', 'Harm-1'])
  })
})

describe('sessionFrequency', () => {
  it('ignores sessions with no date', () => {
    const gaps = sessionFrequency([makeSession({ date: '' })])
    expect(gaps).toEqual([])
  })

  it('computes day gaps between consecutive sessions per hierarchy', () => {
    const gaps = sessionFrequency([
      makeSession({ hierarchy: 'Contamination', date: '2026-01-01' }),
      makeSession({ hierarchy: 'Contamination', date: '2026-01-04' }),
      makeSession({ hierarchy: 'Contamination', date: '2026-01-10' }),
    ])
    expect(gaps).toHaveLength(1)
    expect(gaps[0].gaps.map((g) => g.days)).toEqual([3, 6])
    expect(gaps[0].avgGapDays).toBe(4.5)
  })

  it('reports null avgGapDays for a hierarchy with only one session', () => {
    const gaps = sessionFrequency([makeSession({ hierarchy: 'Contamination', date: '2026-01-01' })])
    expect(gaps[0].avgGapDays).toBeNull()
  })
})

describe('variationEffect', () => {
  it('compares variant sessions against original (no-variation) sessions at the same rung', () => {
    const original = makeSession({ hierarchy: 'Contamination', rung: 2, variation: null, peak_suds: 8 })
    const variant = makeSession({ hierarchy: 'Contamination', rung: 2, variation: 'in public', peak_suds: 6 })
    const rows = variationEffect([original, variant])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ variation: 'in public', variationAvgPeak: 6, originalAvgPeak: 8 })
  })

  it('produces no rows when no session has a variation', () => {
    expect(variationEffect([makeSession({ variation: null })])).toEqual([])
  })

  it('ignores sessions with no rung set', () => {
    expect(variationEffect([makeSession({ rung: null, variation: 'x' })])).toEqual([])
  })
})
