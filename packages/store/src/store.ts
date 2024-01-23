import { openDB, type IDBPDatabase } from 'idb'

export class KVStore {
  private static storeName = 'KV'
  private db: Promise<IDBPDatabase>

  constructor(dbName: string) {
    if (!dbName.trim()) {
      throw new Error('dbName is required')
    }
    this.db = openDB(dbName, 1, {
      upgrade(db) {
        db.createObjectStore(KVStore.storeName)
      },
    })
  }

  async getItem<T>(key: string): Promise<T | null> {
    const db = await this.db
    return (await db.get(KVStore.storeName, key)) || null
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const db = await this.db
    const tx = db.transaction(KVStore.storeName, 'readwrite')
    await Promise.all([tx.store.put(value, key), tx.done])
  }

  async removeItem(key: string): Promise<void> {
    const db = await this.db
    const tx = db.transaction(KVStore.storeName, 'readwrite')
    await Promise.all([tx.store.delete(key), tx.done])
  }
}

export const authStore = new KVStore('ns:passkey')
