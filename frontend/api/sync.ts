import { put, get, list, del } from '@vercel/blob'


function checkAuth(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  const expected = process.env.SYNC_API_KEY || 'c4K8aBJHfnsCR7DxziLqt6rI2ZXEbPuhyFgwdASO'
  if (key !== expected) {
    console.error('AUTH FAIL', { key: key?.slice(0, 10), expected: expected.slice(0, 10) })
    return false
  }
  return true
}

function requireAuth(req: Request): Response | null {
  if (!checkAuth(req)) {
    const expected = process.env.SYNC_API_KEY || 'c4K8aBJHfnsCR7DxziLqt6rI2ZXEbPuhyFgwdASO'
    return Response.json({ ok: false, error: 'Unauthorized', _debug: { expectedPrefix: expected.slice(0, 10), hasEnvVar: !!process.env.SYNC_API_KEY } }, { status: 401 })
  }
  return null
}

const BLOB_PATH = 'almarqab-data.json'

interface SyncData {
  clients?: unknown[]
  properties?: unknown[]
  requests?: unknown[]
  settings?: unknown
  version: number
  updatedAt: string
  _processedSubmissions?: string[]
}

async function readBlob(): Promise<SyncData | null> {
  try {
    const result = await get(BLOB_PATH, { access: 'private' })
    if (!result || result.statusCode !== 200) return null
    const reader = result.stream.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }) }
    text += decoder.decode()
    return JSON.parse(text)
  } catch { return null }
}

const now = () => new Date().toISOString().slice(0, 10)
const nextId = () => Number(crypto.randomUUID().replace(/\D/g, '').slice(0, 15)) || Date.now()

function submissionToRequestItem(sub: Record<string, unknown>) {
  const t = (sub.propertyType as string) || ''
  const city = (sub.propertyCity as string) || ''
  const district = (sub.propertyDistrict as string) || ''
  const title = `${t} - ${city} ${district}`.trim()
  return {
    id: nextId(),
    clientName: (sub.clientName as string) || (sub.name as string) || '',
    clientPhone: (sub.clientPhone as string) || (sub.phone as string) || '',
    clientType: (sub.clientType as string) || 'مالك',
    type: 'إضافة عقار' as const,
    status: 'جديد' as const,
    date: (sub._submittedAt as string)?.slice(0, 10) || now(),
    propertyTitle: (sub.propertyTitle as string) || title,
    propertyCity: (sub.propertyCity as string) || (sub.city as string) || '',
    propertyDistrict: (sub.propertyDistrict as string) || (sub.district as string) || '',
    propertyPrice: (sub.propertyPrice as string) || (sub.price as string) || '',
    propertyType: t || (sub.type as string) || '',
    propertyArea: (sub.propertyArea as string) || (sub.area as string) || '',
    propertyRooms: (sub.propertyRooms as string) || (sub.rooms as string) || '',
    propertyLocationUrl: (sub.propertyLocationUrl as string) || (sub.locationUrl as string) || '',
    propertyOrientation: (sub.propertyOrientation as string) || (sub.orientation as string) || '',
    propertyStreetWidth: (sub.propertyStreetWidth as string) || (sub.streetWidth as string) || '',
    propertyFloor: (sub.propertyFloor as string) || (sub.floor as string) || '',
    propertyFloors: (sub.propertyFloors as string) || (sub.floors as string) || '',
    propertyPool: (sub.propertyPool as string) || (sub.pool as string) || '',
    propertyFinishing: (sub.propertyFinishing as string) || (sub.finishing as string) || '',
    propertyParking: (sub.propertyParking as string) || (sub.parking as string) || '',
    propertyDescription: (sub.propertyDescription as string) || (sub.description as string) || '',
    propertyPhotos: (sub.propertyPhotos as string[]) || undefined,
  }
}

async function loadUnprocessedSubmissions(processed: Set<string>): Promise<unknown[]> {
  try {
    const { blobs } = await list({ prefix: 'submissions/' })
    const results = await Promise.all(blobs.map(async (info) => {
      const id = info.pathname.replace('submissions/', '').replace('.json', '')
      if (processed.has(id)) return null
      const res = await fetch(info.url)
      if (!res.ok) return null
      const sub = await res.json()
      return submissionToRequestItem(sub)
    }))
    return results.filter(Boolean) as unknown[]
  } catch { return [] }
}

async function cleanupProcessedSubmissions(processed: Set<string>): Promise<void> {
  try {
    const { blobs } = await list({ prefix: 'submissions/' })
    for (const info of blobs) {
      const id = info.pathname.replace('submissions/', '').replace('.json', '')
      if (processed.has(id)) {
        try { await del(info.url) } catch {}
      }
    }
  } catch {}
}

export async function GET(req: Request) {
  const authErr = requireAuth(req)
  if (authErr) return authErr
  try {
    const data = await readBlob()
    const processed = new Set<string>(data?._processedSubmissions || [])
    const submissions = await loadUnprocessedSubmissions(processed)
    const merged = {
      ...data,
      clients: data?.clients ?? [],
      properties: data?.properties ?? [],
      requests: [...(data?.requests || []), ...submissions],
      settings: data?.settings ?? {},
    }
    return Response.json({ ok: true, data: merged }, { headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' } })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const authErr = requireAuth(req)
  if (authErr) return authErr
  try {
    const body: SyncData = await req.json()
    const current = await readBlob()
    const merged: SyncData = {
      clients: body.clients ?? current?.clients ?? [],
      properties: body.properties ?? current?.properties ?? [],
      requests: body.requests ?? current?.requests ?? [],
      settings: (body.settings as any) ?? (current?.settings as any) ?? {},
      version: (current?.version || 0) + 1,
      updatedAt: new Date().toISOString(),
      _processedSubmissions: current?._processedSubmissions || [],
    }

    // Mark submission blobs as processed if their data is now in the main blob
    try {
      const { blobs } = await list({ prefix: 'submissions/' })
      const pendingIds: string[] = []
      for (const info of blobs) {
        const id = info.pathname.replace('submissions/', '').replace('.json', '')
        if (merged._processedSubmissions!.includes(id)) continue
        pendingIds.push(id)
      }
      if (pendingIds.length > 0) {
        const allRequests = [...(merged.requests || [])] as Record<string, unknown>[]
        const allProperties = [...(merged.properties || [])] as Record<string, unknown>[]
        for (const subId of pendingIds) {
          try {
            const info = blobs.find(b => b.pathname === `submissions/${subId}.json`)
            if (!info) { merged._processedSubmissions!.push(subId); continue }
            const res = await fetch(info.url)
            if (!res.ok) { merged._processedSubmissions!.push(subId); continue }
            const sub = await res.json()
            const phone = (sub.clientPhone as string) || (sub.phone as string) || ''
            const title = (sub.propertyTitle as string) || ''
            const city = (sub.propertyCity as string) || (sub.city as string) || ''
            const matched = allRequests.some((r: any) =>
              r.clientPhone === phone && r.propertyTitle === title && r.propertyCity === city
            ) || allProperties.some((p: any) =>
              p.ownerPhone === phone && p.title === title && p.city === city
            )
            if (matched) merged._processedSubmissions!.push(subId)
          } catch { merged._processedSubmissions!.push(subId) }
        }
      }
    } catch {}

    await put(BLOB_PATH, JSON.stringify(merged), { access: 'private', addRandomSuffix: false, allowOverwrite: true })

    // Periodically remove processed submission blobs (every 5th write)
    if (merged.version % 5 === 0) {
      cleanupProcessedSubmissions(new Set(merged._processedSubmissions))
    }

    return Response.json({ ok: true, version: merged.version })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
