import { put } from '@vercel/blob'

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
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return Response.json({ ok: false, error: 'no file' }, { status: 400 })

    const ext = file.name.split('.').pop() || 'jpg'
    const name = `photos/${crypto.randomUUID()}.${ext}`
    const buffer = await file.arrayBuffer()
    const blob = await put(name, buffer, {
      access: 'private',
      addRandomSuffix: true,
      contentType: file.type,
    })
    return Response.json({ ok: true, url: blob.url })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

