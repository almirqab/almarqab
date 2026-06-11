interface SyncPayload {
  clients?: unknown[]
  properties?: unknown[]
  requests?: unknown[]
  settings?: unknown
  version: number
}

const API_KEY = import.meta.env.VITE_SYNC_API_KEY || ''
const CONTENT_JSON = { 'Content-Type': 'application/json', 'x-api-key': API_KEY } as const

export async function pullFromCloud(): Promise<SyncPayload | null> {
  try {
    const res = await fetch(`/api/sync?_=${Date.now()}`, { headers: CONTENT_JSON, cache: 'no-store' })
    if (!res.ok) return null
    const body = await res.json()
    return body.data ?? null
  } catch {
    return null
  }
}

export async function pushToCloud(payload: SyncPayload): Promise<boolean> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: CONTENT_JSON,
      body: JSON.stringify(payload),
    })
    return res.ok
  } catch {
    return false
  }
}
