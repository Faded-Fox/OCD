import { useCallback, useEffect, useState } from 'react'
import { getAllJournalEntries } from './db'
import type { JournalEntry } from './journal'

export function useJournalEntries() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const all = await getAllJournalEntries()
    setEntries(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { entries, loading, refresh }
}
