export interface HierarchyColor {
  name: string
  hex: string
  text: string
  bg: string
  border: string
  ring: string
  chipBg: string
}

// A wider, colorful palette; a hierarchy hashes to one of these unless explicitly
// pinned below. Order matters for the explicit spec examples.
const PALETTE: Omit<HierarchyColor, 'name'>[] = [
  { hex: '#14b8a6', text: 'text-teal-700 dark:text-teal-300', bg: 'bg-teal-500', border: 'border-teal-400', ring: 'ring-teal-400', chipBg: 'bg-teal-100 dark:bg-teal-950' },
  { hex: '#fb7185', text: 'text-rose-700 dark:text-rose-300', bg: 'bg-rose-500', border: 'border-rose-400', ring: 'ring-rose-400', chipBg: 'bg-rose-100 dark:bg-rose-950' },
  { hex: '#f59e0b', text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-500', border: 'border-amber-400', ring: 'ring-amber-400', chipBg: 'bg-amber-100 dark:bg-amber-950' },
  { hex: '#8b5cf6', text: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-500', border: 'border-violet-400', ring: 'ring-violet-400', chipBg: 'bg-violet-100 dark:bg-violet-950' },
  { hex: '#0ea5e9', text: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-500', border: 'border-sky-400', ring: 'ring-sky-400', chipBg: 'bg-sky-100 dark:bg-sky-950' },
  { hex: '#10b981', text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-500', border: 'border-emerald-400', ring: 'ring-emerald-400', chipBg: 'bg-emerald-100 dark:bg-emerald-950' },
  { hex: '#d946ef', text: 'text-fuchsia-700 dark:text-fuchsia-300', bg: 'bg-fuchsia-500', border: 'border-fuchsia-400', ring: 'ring-fuchsia-400', chipBg: 'bg-fuchsia-100 dark:bg-fuchsia-950' },
  { hex: '#fb923c', text: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-500', border: 'border-orange-400', ring: 'ring-orange-400', chipBg: 'bg-orange-100 dark:bg-orange-950' },
]

// Spec's suggested reference mapping, matched loosely by keyword so close variants
// of the example hierarchy names still land on the intended color.
const PINNED: { match: RegExp; paletteIndex: number }[] = [
  { match: /harm|contamination/i, paletteIndex: 0 }, // teal
  { match: /fraud|responsibility/i, paletteIndex: 1 }, // coral/rose
  { match: /environmental|catastrophic/i, paletteIndex: 2 }, // amber
  { match: /predatory/i, paletteIndex: 3 }, // violet
]

function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

const cache = new Map<string, HierarchyColor>()

export function colorForHierarchy(name: string): HierarchyColor {
  const key = name.trim().toLowerCase() || 'unlabeled'
  const cached = cache.get(key)
  if (cached) return cached

  const pinned = PINNED.find((p) => p.match.test(name))
  const index = pinned ? pinned.paletteIndex : hashString(key) % PALETTE.length
  const color: HierarchyColor = { name, ...PALETTE[index] }
  cache.set(key, color)
  return color
}
