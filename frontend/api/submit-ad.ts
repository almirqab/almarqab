import { put } from '@vercel/blob'

function isValidGmapsUrl(url: unknown): boolean {
  if (typeof url !== 'string' || !url.trim()) return true
  return /^https?:\/\/(?:www\.)?(?:maps\.)?google\.[a-z.]+\/maps\/?/.test(url.trim())
}

function checkAuth(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  const expected = process.env.SYNC_API_KEY || 'almrqab-sync-key-2026'
  return key === expected
}

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const data = await req.json()
    if (data.propertyLocationUrl && !isValidGmapsUrl(data.propertyLocationUrl)) {
      return Response.json({ ok: false, error: 'رابط خرائط Google غير صالح' }, { status: 400 })
    }
    const id = crypto.randomUUID()
    const blobData = { ...data, _submissionId: id, _submittedAt: new Date().toISOString() }
    await put(`submissions/${id}.json`, JSON.stringify(blobData), { access: 'private', addRandomSuffix: false })
    return Response.json({ ok: true, id })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
