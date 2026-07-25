/**
 * Asks the browser to treat this origin's storage as "persistent" — exempt from
 * best-effort eviction under storage pressure — rather than the default
 * "best-effort" bucket, which browsers can clear (along with everything else in
 * it) without warning if the device is low on space or the site goes unused.
 *
 * This is a best-effort signal, not a guarantee, and support/behavior varies by
 * browser (notably on iOS Safari). It doesn't replace exporting a backup —
 * see lib/exportReminder.ts — it just lowers the odds of ever needing one.
 */

function getStorageManager(): StorageManager | null {
  if (typeof navigator === 'undefined' || !navigator.storage) return null
  return navigator.storage
}

export function isPersistenceSupported(): boolean {
  const storage = getStorageManager()
  return Boolean(storage && typeof storage.persist === 'function')
}

export async function isStoragePersisted(): Promise<boolean> {
  const storage = getStorageManager()
  if (!storage) return false
  try {
    return await storage.persisted()
  } catch {
    return false
  }
}

export async function requestPersistentStorage(): Promise<boolean> {
  const storage = getStorageManager()
  if (!storage) return false
  try {
    return await storage.persist()
  } catch {
    return false
  }
}
