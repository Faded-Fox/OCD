import { useCallback, useEffect, useState } from 'react'
import { getAllFearLadders } from './db'
import type { FearLadder } from './fearLadder'

export function useFearLadders() {
  const [ladders, setLadders] = useState<FearLadder[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    const all = await getAllFearLadders()
    setLadders(all)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { ladders, loading, refresh }
}
