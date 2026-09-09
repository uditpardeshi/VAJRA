import { useEffect, useCallback } from 'react'
import { openDB } from 'idb'
import { useAuthStore } from '@/store/authStore'

const DB_NAME = 'sovereign-offline'
const DB_VERSION = 1
const STORES = ['pendingInspections', 'pendingChats', 'pendingAgentRuns'] as const

export function useOfflineSync() {
  const { apiBase } = useAuthStore()

  const getDB = useCallback(async () => openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      STORES.forEach(s => {
        if (!db.objectStoreNames.contains(s)) {
          db.createObjectStore(s, { keyPath: 'id', autoIncrement: true })
        }
      })
    }
  }), [])

  const queue = useCallback(async (store: typeof STORES[number], data: any) => {
    const db = await getDB()
    await db.add(store, { ...data, timestamp: Date.now() })
  }, [getDB])

  const flush = useCallback(async () => {
    const db = await getDB()
    for (const store of STORES) {
      const items = await db.getAll(store)
      for (const item of items) {
        try {
          await fetch(`${apiBase}/${store.replace('pending', '').toLowerCase()}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.data)
          })
          await db.delete(store, item.id)
        } catch {
          // Retry on next sync
        }
      }
    }
  }, [apiBase, getDB])

  useEffect(() => {
    window.addEventListener('online', flush)
    if (navigator.onLine) flush()
    return () => window.removeEventListener('online', flush)
  }, [flush])

  return { queue, flush }
}
