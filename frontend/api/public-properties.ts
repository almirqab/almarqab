import { get } from '@vercel/blob'

const BLOB_PATH = 'almarqab-data.json'

interface PropertyItem {
  id: number; title: string; district: string; city: string; price: string; type: string; status: string; area: string; rooms: string; description: string; ownerName: string; ownerPhone: string; locationUrl?: string; photos?: string[];
}

export async function GET() {
  try {
    const result = await get(BLOB_PATH, { access: 'private' })
    if (!result || result.statusCode !== 200) {
      return Response.json({ ok: true, properties: [] }, { headers: { 'Cache-Control': 'public, max-age=60' } })
    }
    const reader = result.stream.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }) }
    text += decoder.decode()
    const data = JSON.parse(text)
    const properties = (data.properties || []).filter((p: PropertyItem) => p.status === 'متاح')
    return Response.json({ ok: true, properties, officeName: data.settings?.name || 'المرقاب الذهبي', officePhone: data.settings?.phone || '' }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  } catch {
    return Response.json({ ok: true, properties: [] }, { headers: { 'Cache-Control': 'public, max-age=60' } })
  }
}
