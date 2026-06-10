import type { DBSchema, IDBPDatabase } from 'idb'
import { openDB } from 'idb'
import type { ClientItem, OfficeSettings, PropertyItem, RequestItem } from '../types/dashboard'

interface AlmarqabDB extends DBSchema {
  clients: { key: number; value: ClientItem }
  properties: { key: number; value: PropertyItem }
  requests: { key: number; value: RequestItem }
  settings: { key: string; value: { key: string; value: OfficeSettings } }
}

let dbPromise: Promise<IDBPDatabase<AlmarqabDB>> | null = null

function getDB(): Promise<IDBPDatabase<AlmarqabDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AlmarqabDB>('almarqab-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('clients')) db.createObjectStore('clients', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('properties')) db.createObjectStore('properties', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('requests')) db.createObjectStore('requests', { keyPath: 'id' })
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'key' })
      },
    })
  }
  return dbPromise
}

export async function isDBEmpty(): Promise<boolean> {
  const db = await getDB()
  const [c, p, r, s] = await Promise.all([db.count('clients'), db.count('properties'), db.count('requests'), db.count('settings')])
  return c === 0 && p === 0 && r === 0 && s === 0
}

export async function getAllClients(): Promise<ClientItem[]> {
  const db = await getDB(); return db.getAll('clients')
}
export async function getAllProperties(): Promise<PropertyItem[]> {
  const db = await getDB(); return db.getAll('properties')
}
export async function getAllRequests(): Promise<RequestItem[]> {
  const db = await getDB(); return db.getAll('requests')
}
export async function getSettings(): Promise<OfficeSettings | null> {
  const db = await getDB(); const entry = await db.get('settings', 'office')
  return entry?.value ?? null
}

export async function addClient(item: ClientItem): Promise<void> {
  const db = await getDB(); await db.put('clients', item)
}
export async function addProperty(item: PropertyItem): Promise<void> {
  const db = await getDB(); await db.put('properties', item)
}
export async function addRequest(item: RequestItem): Promise<void> {
  const db = await getDB(); await db.put('requests', item)
}
export async function saveSettings(value: OfficeSettings): Promise<void> {
  const db = await getDB(); await db.put('settings', { key: 'office', value })
}

export async function updateClient(id: number, data: Partial<Omit<ClientItem, 'id'>>): Promise<void> {
  const db = await getDB(); const existing = await db.get('clients', id)
  if (existing) await db.put('clients', { ...existing, ...data })
}
export async function updateProperty(id: number, data: Partial<PropertyItem>): Promise<void> {
  const db = await getDB(); const existing = await db.get('properties', id)
  if (existing) await db.put('properties', { ...existing, ...data })
}
export async function updateRequest(id: number, data: Partial<Omit<RequestItem, 'id'>>): Promise<void> {
  const db = await getDB(); const existing = await db.get('requests', id)
  if (existing) await db.put('requests', { ...existing, ...data })
}

export async function deleteClient(id: number): Promise<void> {
  const db = await getDB(); await db.delete('clients', id)
}
export async function deleteProperty(id: number): Promise<void> {
  const db = await getDB(); await db.delete('properties', id)
}
export async function deleteRequest(id: number): Promise<void> {
  const db = await getDB(); await db.delete('requests', id)
}

export async function clearAll(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['clients', 'properties', 'requests', 'settings'], 'readwrite')
  tx.objectStore('clients').clear()
  tx.objectStore('properties').clear()
  tx.objectStore('requests').clear()
  tx.objectStore('settings').clear()
  await tx.done
}

export async function populateAll(clients: ClientItem[], properties: PropertyItem[], requests: RequestItem[], settings: OfficeSettings): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(['clients', 'properties', 'requests', 'settings'], 'readwrite')
  for (const c of clients) tx.objectStore('clients').put(c)
  for (const p of properties) tx.objectStore('properties').put(p)
  for (const r of requests) tx.objectStore('requests').put(r)
  tx.objectStore('settings').put({ key: 'office', value: settings })
  await tx.done
}
