export interface FearLadderRung {
  rung: number
  description: string
  targetSudsRange: [number, number] | null
}

export interface FearLadder {
  id: string
  hierarchy: string
  rungs: FearLadderRung[]
  createdAt: string
  updatedAt: string
}

export function createEmptyLadder(hierarchy = ''): FearLadder {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    hierarchy,
    rungs: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function createEmptyRung(rungs: FearLadderRung[]): FearLadderRung {
  const nextRung = rungs.length === 0 ? 1 : Math.max(...rungs.map((r) => r.rung)) + 1
  return { rung: nextRung, description: '', targetSudsRange: null }
}
