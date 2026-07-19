import { useCallback, useEffect, useState } from 'react'
import { getAllFocusPlanEntries } from './db'
import type { FocusPlanEntry } from './focusPlan'

export function useFocusPlanEntries() {
  const [entries, setEntries] = useState<FocusPlanEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const all = await getAllFocusPlanEntries()
    setEntries(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entries, loading, refresh }
}
