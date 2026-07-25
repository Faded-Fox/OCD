/**
 * A short, personal list of the reasons ERP is worth doing at all — not reducing
 * anxiety, but living the life it's in the way of. Like the Flare Guide, none of
 * this is templated in source: every value starts blank and is written and
 * stored entirely on this device, since there's no universal answer for what
 * someone's values are.
 */
export interface ValueItem {
  id: string
  /** Freeform — usually a single emoji, but not validated as one. */
  icon: string
  label: string
  /** Optional — why this one matters, in the person's own words. */
  note: string
}

export interface ValuesGuide {
  id: string
  updatedAt: string
  values: ValueItem[]
}

export const VALUES_GUIDE_ID = 'singleton'

export function createEmptyValuesGuide(): ValuesGuide {
  return { id: VALUES_GUIDE_ID, updatedAt: new Date().toISOString(), values: [] }
}

export function isValuesGuideEmpty(guide: ValuesGuide): boolean {
  return guide.values.length === 0
}

/** Picks one value at random to surface as a reminder — e.g. before starting a
 *  live exposure. Returns null if nothing's been set up yet. */
export function pickRandomValue(guide: ValuesGuide | undefined): ValueItem | null {
  if (!guide || guide.values.length === 0) return null
  return guide.values[Math.floor(Math.random() * guide.values.length)]
}
