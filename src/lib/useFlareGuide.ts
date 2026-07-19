import { useCallback, useEffect, useState } from 'react'
import { getFlareGuide } from './db'
import type { FlareGuide } from './flareGuide'

export function useFlareGuide() {
  const [guide, setGuide] = useState<FlareGuide | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const g = await getFlareGuide()
    setGuide(g)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { guide, loading, refresh }
}
