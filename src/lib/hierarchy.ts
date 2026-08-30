import type { Session } from './types'

/** Case/whitespace-insensitive grouping key for a hierarchy name, so
 *  "Harm/Contamination", "Harm/contamination", and "  Harm/Contamination  "
 *  are treated as the same hierarchy for grouping and matching purposes —
 *  without merging genuinely different names like "Harm" or "Fraud". Callers
 *  pass the same `name || 'Unlabeled'` fallback already used everywhere a
 *  session's hierarchy is displayed, so blank hierarchies keep grouping the
 *  same way they already did. */
export function hierarchyKey(name: string): string {
  return name.trim().toLowerCase()
}

/** One canonical display label per distinct hierarchy — whichever exact
 *  spelling was used most recently, so a stray older typo/casing variant
 *  doesn't linger as the label once someone's settled on one. Sorted
 *  alphabetically by that label. */
export function distinctHierarchies(sessions: Session[]): string[] {
  const latestByKey = new Map<string, { label: string; date: string }>()
  for (const s of sessions) {
    const label = s.hierarchy || 'Unlabeled'
    const key = hierarchyKey(label)
    const existing = latestByKey.get(key)
    if (!existing || s.date > existing.date) {
      latestByKey.set(key, { label, date: s.date })
    }
  }
  return Array.from(latestByKey.values())
    .map((v) => v.label)
    .sort((a, b) => a.localeCompare(b))
}

/** Every session belonging to the same hierarchy as `hierarchy`, matched
 *  case/whitespace-insensitively. */
export function sessionsForHierarchy(sessions: Session[], hierarchy: string): Session[] {
  const key = hierarchyKey(hierarchy)
  return sessions.filter((s) => hierarchyKey(s.hierarchy || 'Unlabeled') === key)
}
