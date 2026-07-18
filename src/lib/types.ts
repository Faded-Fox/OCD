export type ReadingLabel = 'pre' | 'reread' | 'end' | string

export interface SudsReading {
  label: ReadingLabel
  /** Free-form: a clock time ("10:42am"), a minute offset (5), or a descriptive label ("reread") */
  time_or_minute: string | number
  suds: number
}

export interface Session {
  /** internal unique key (uuid), independent of the human-readable session_id */
  id: string
  /** date + rung, e.g. "2026-07-15-rung5" (spec'd shape; not guaranteed unique) */
  session_id: string
  /** ISO 8601 date, e.g. "2026-07-15" */
  date: string
  hierarchy: string
  rung: number | null
  rung_description: string
  target_suds_range: [number, number] | null
  variation: string | null
  planned_duration_minutes: number | null
  readings: SudsReading[]
  peak_suds: number | null
  end_suds: number | null
  compulsions_targeted: string[]
  compulsions_completed: string[]
  /** true = all targeted compulsions fully resisted; false = at least one completed/partial */
  compulsions_resisted: boolean | null
  techniques_used: string[]
  notes: string
  /** fields the parser could not confidently extract; surfaced for manual review on import */
  flags: string[]
  /** raw source text this session was parsed from, kept for reference/re-parsing */
  source_excerpt: string
}
