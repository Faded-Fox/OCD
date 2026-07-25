import { useCallback, useEffect, useState } from 'react'
import { getValuesGuide } from './db'
import type { ValuesGuide } from './values'

export function useValuesGuide() {
  const [guide, setGuide] = useState<ValuesGuide | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const g = await getValuesGuide()
    setGuide(g)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { guide, loading, refresh }
}
