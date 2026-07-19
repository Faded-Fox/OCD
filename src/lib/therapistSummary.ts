import type { Session } from './types'
import type { JournalEntry } from './journal'
import type { FocusPlanEntry } from './focusPlan'
import type { FearLadder } from './fearLadder'
import { compulsionResistanceRate, compulsionResistanceRateByHierarchy, rungProgression, sessionFrequency } from './insights'

export interface TherapistSummaryHierarchyRow {
  hierarchy: string
  sessionCount: number
  resistanceRate: number | null
  avgPeakSuds: number | null
  lastSessionDate: string | null
  readySignalCount: number
  avgGapDays: number | null
}

export interface TherapistSummarySessionRow {
  date: string
  hierarchy: string
  rung: number | null
  variation: string | null
  peakSuds: number | null
  endSuds: number | null
  resisted: boolean | null
}

export interface TherapistSummaryFocusPlanRow {
  date: string
  taskDescription: string
  completed: FocusPlanEntry['completed']
  peakSuds: number | null
  endSuds: number | null
  whatWorked: string
  whatWouldDoDifferently: string
}

export interface TherapistSummaryLadderRow {
  hierarchy: string
  rungCount: number
}

export interface TherapistSummary {
  from: string | null
  to: string | null
  generatedAt: string
  totalSessions: number
  hierarchyCount: number
  overallResistanceRate: number | null
  hierarchyRows: TherapistSummaryHierarchyRow[]
  sessionRows: TherapistSummarySessionRow[]
  focusPlanRows: TherapistSummaryFocusPlanRow[]
  ladderRows: TherapistSummaryLadderRow[]
  journalEntryCount: number
}

function inRange(date: string, from: string, to: string): boolean {
  if (!date) return false
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function average(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n !== null)
  if (!valid.length) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

/** Filters everything to the given date range and reshapes it into a flat, printable
 *  structure — separate from the raw JSON backup, and from the day-to-day Dashboard,
 *  because a therapist needs a readable report, not a data dump or a live trend view. */
export function buildTherapistSummary(
  input: {
    sessions: Session[]
    journalEntries: JournalEntry[]
    focusPlans: FocusPlanEntry[]
    fearLadders: FearLadder[]
  },
  range: { from: string; to: string },
): TherapistSummary {
  const { from, to } = range
  const sessions = input.sessions.filter((s) => inRange(s.date, from, to))
  const focusPlans = input.focusPlans.filter((p) => p.completed !== null && inRange(p.date, from, to))
  const journalEntries = input.journalEntries.filter((e) => inRange(e.date, from, to))

  const hierarchies = Array.from(new Set(sessions.map((s) => s.hierarchy || 'Unlabeled'))).sort()
  const rateByHierarchy = compulsionResistanceRateByHierarchy(sessions)
  const progression = rungProgression(sessions)
  const gaps = sessionFrequency(sessions)

  const hierarchyRows: TherapistSummaryHierarchyRow[] = hierarchies.map((h) => {
    const list = sessions.filter((s) => (s.hierarchy || 'Unlabeled') === h)
    const gapInfo = gaps.find((g) => g.hierarchy === h)
    return {
      hierarchy: h,
      sessionCount: list.length,
      resistanceRate: rateByHierarchy[h]?.rate ?? null,
      avgPeakSuds: average(list.map((s) => s.peak_suds)),
      lastSessionDate: [...list].map((s) => s.date).sort().slice(-1)[0] ?? null,
      readySignalCount: progression.filter((r) => r.hierarchy === h && r.readySignal).length,
      avgGapDays: gapInfo?.avgGapDays ?? null,
    }
  })

  const sessionRows: TherapistSummarySessionRow[] = [...sessions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((s) => ({
      date: s.date,
      hierarchy: s.hierarchy || 'Unlabeled',
      rung: s.rung,
      variation: s.variation,
      peakSuds: s.peak_suds,
      endSuds: s.end_suds,
      resisted: s.compulsions_resisted,
    }))

  const focusPlanRows: TherapistSummaryFocusPlanRow[] = [...focusPlans]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((p) => ({
      date: p.date,
      taskDescription: p.taskDescription,
      completed: p.completed,
      peakSuds: p.peakSuds,
      endSuds: p.endSuds,
      whatWorked: p.whatWorked,
      whatWouldDoDifferently: p.whatWouldDoDifferently,
    }))

  const ladderRows: TherapistSummaryLadderRow[] = [...input.fearLadders]
    .filter((l) => l.hierarchy.trim() !== '')
    .sort((a, b) => a.hierarchy.localeCompare(b.hierarchy))
    .map((l) => ({ hierarchy: l.hierarchy, rungCount: l.rungs.length }))

  return {
    from: from || null,
    to: to || null,
    generatedAt: new Date().toISOString(),
    totalSessions: sessions.length,
    hierarchyCount: hierarchies.length,
    overallResistanceRate: compulsionResistanceRate(sessions).rate,
    hierarchyRows,
    sessionRows,
    focusPlanRows,
    ladderRows,
    journalEntryCount: journalEntries.length,
  }
}

function fmtPct(rate: number | null): string {
  return rate !== null ? `${Math.round(rate * 100)}%` : '—'
}

function fmtSuds(n: number | null): string {
  return n !== null ? String(Math.round(n * 10) / 10) : '—'
}

export function rangeLabel(summary: TherapistSummary): string {
  if (summary.from && summary.to) return `${summary.from} to ${summary.to}`
  if (summary.from) return `since ${summary.from}`
  if (summary.to) return `through ${summary.to}`
  return 'All time'
}

/** Plain-text rendering for Share/clipboard/download — mirrors the on-screen report. */
export function buildTherapistSummaryText(summary: TherapistSummary): string {
  const lines: string[] = ['ERP Therapy Summary', '']
  lines.push(`Covering: ${rangeLabel(summary)}`, `Generated: ${summary.generatedAt.slice(0, 10)}`, '')

  lines.push('OVERVIEW')
  lines.push(
    `${summary.totalSessions} session${summary.totalSessions === 1 ? '' : 's'} across ${summary.hierarchyCount} hierarch${summary.hierarchyCount === 1 ? 'y' : 'ies'}. Overall full-resistance rate: ${fmtPct(summary.overallResistanceRate)}.`,
    '',
  )

  if (summary.hierarchyRows.length) {
    lines.push('BY HIERARCHY')
    for (const r of summary.hierarchyRows) {
      const bits = [
        `${r.sessionCount} session${r.sessionCount === 1 ? '' : 's'}`,
        `${fmtPct(r.resistanceRate)} full resistance`,
        `avg peak ${fmtSuds(r.avgPeakSuds)} SUDs`,
        `last attempted ${r.lastSessionDate ?? '—'}`,
      ]
      if (r.avgGapDays !== null) bits.push(`~${Math.round(r.avgGapDays)} day avg gap`)
      if (r.readySignalCount) bits.push(`${r.readySignalCount} rung${r.readySignalCount === 1 ? '' : 's'} showing readiness to progress`)
      lines.push(`${r.hierarchy} — ${bits.join(', ')}.`)
    }
    lines.push('')
  }

  if (summary.sessionRows.length) {
    lines.push('SESSIONS IN THIS PERIOD')
    for (const s of summary.sessionRows) {
      const resisted = s.resisted === true ? 'fully resisted' : s.resisted === false ? 'partial resistance' : 'resistance unknown'
      lines.push(
        `${s.date}  ${s.hierarchy}  Rung ${s.rung ?? '—'}${s.variation ? ` (${s.variation})` : ''}  Peak ${s.peakSuds ?? '—'} -> End ${s.endSuds ?? '—'}  ${resisted}`,
      )
    }
    lines.push('')
  }

  if (summary.focusPlanRows.length) {
    lines.push('FOCUS PLAN DEBRIEFS')
    for (const p of summary.focusPlanRows) {
      lines.push(`${p.date} — ${p.taskDescription || 'Untitled task'} (${p.completed ?? 'not debriefed'})`)
      if (p.peakSuds !== null || p.endSuds !== null) lines.push(`  Peak ${p.peakSuds ?? '—'} -> End ${p.endSuds ?? '—'}`)
      if (p.whatWorked.trim()) lines.push(`  What worked: ${p.whatWorked.trim()}`)
      if (p.whatWouldDoDifferently.trim()) lines.push(`  Would do differently: ${p.whatWouldDoDifferently.trim()}`)
    }
    lines.push('')
  }

  if (summary.ladderRows.length) {
    lines.push('PLANNED FEAR LADDERS')
    for (const l of summary.ladderRows) {
      lines.push(`${l.hierarchy} — ${l.rungCount} rung${l.rungCount === 1 ? '' : 's'} planned`)
    }
    lines.push('')
  }

  lines.push('JOURNALING')
  lines.push(`${summary.journalEntryCount} entr${summary.journalEntryCount === 1 ? 'y' : 'ies'} logged in this period.`, '')

  lines.push('This is a descriptive summary of self-reported data — not a diagnosis or treatment recommendation.')

  return lines.join('\n')
}
