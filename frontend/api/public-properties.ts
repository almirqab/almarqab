import { get } from '@vercel/blob'

const BLOB_PATH = 'almarqab-data.json'

interface PropertyItem {
  id: number; title: string; district: string; city: string; price: string; type: string; status: string; area: string; rooms: string; description: string; ownerName: string; ownerPhone: string; locationUrl?: string; photos?: string[]; visible?: boolean;
}

export async function GET() {
  try {
    const result = await get(BLOB_PATH, { access: 'private' })
    if (!result || result.statusCode !== 200) {
      return Response.json({ ok: true, properties: [] })
    }
    const reader = result.stream.getReader()
    const decoder = new TextDecoder()
    let text = ''
    while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }) }
    text += decoder.decode()
    const data = JSON.parse(text)
    const settings = data.settings || {}
    const properties: PropertyItem[] = (data.properties || []).filter((p: PropertyItem) => p.status === 'متاح' && p.visible !== false)
    // Convert private blob URLs to proxy URLs so images load in the browser
    const proxied = properties.map((p: PropertyItem) => ({
      ...p,
      photos: p.photos?.map((url: string) =>
        url.includes('.blob.vercel-storage.com') ? `/api/blob-proxy?url=${encodeURIComponent(url)}` : url
      ),
    }))
    return Response.json({ ok: true, properties: proxied, officeName: settings.name || 'المرقاب الذهبي', officePhone: settings.phone || '', showPublicProperties: settings.showPublicProperties !== false })
  } catch {
    return Response.json({ ok: true, properties: [] })
  }
}
