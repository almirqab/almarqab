import { put } from '@vercel/blob'

function isValidGmapsUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return true
  return /^https?:\/\/(?:www\.)?(?:maps\.)?google\.[a-z.]+\/maps\/?/.test(url.trim())
}

function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host') || ''
  if (!origin && !referer) return false
  if (origin && !origin.includes(host)) return false
  if (referer && !referer.includes(host)) return false
  return true
}

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return Response.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }
  try {
    const data = await req.json()
    if (data.propertyLocationUrl && !isValidGmapsUrl(data.propertyLocationUrl)) {
      return Response.json({ ok: false, error: 'رابط خرائط Google غير صالح' }, { status: 400 })
    }
    const id = crypto.randomUUID()
    const blobData = { ...data, _submissionId: id, _submittedAt: new Date().toISOString() }
    await put(`submissions/${id}.json`, JSON.stringify(blobData), { access: 'private', addRandomSuffix: false, contentType: 'application/json' })
    return Response.json({ ok: true, id })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
