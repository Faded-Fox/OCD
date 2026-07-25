import { useCallback, useEffect, useState } from 'react'
import { isPersistenceSupported, isStoragePersisted, requestPersistentStorage } from './persistence'

export type PersistenceStatus = 'unsupported' | 'checking' | 'granted' | 'not-granted'

export function useStoragePersistence() {
  const [status, setStatus] = useState<PersistenceStatus>('checking')
  const [requesting, setRequesting] = useState(false)

  const refresh = useCallback(async () => {
    if (!isPersistenceSupported()) {
      setStatus('unsupported')
      return
    }
    setStatus((await isStoragePersisted()) ? 'granted' : 'not-granted')
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const request = useCallback(async () => {
    setRequesting(true)
    await requestPersistentStorage()
    await refresh()
    setRequesting(false)
  }, [refresh])

  return { status, request, requesting }
}
