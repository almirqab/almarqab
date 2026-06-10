import { put } from '@vercel/blob'

function checkAuth(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  const expected = process.env.SYNC_API_KEY || 'almrqab-sync-key-2026'
  return key === expected
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
const MAX_SIZE = 15 * 1024 * 1024

export async function POST(req: Request) {
  if (!checkAuth(req)) {
    return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return Response.json({ ok: false, error: 'no file' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ ok: false, error: 'نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, WebP, GIF, MP4' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ ok: false, error: 'الملف كبير جداً. الحد الأقصى 15 ميجابايت' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const name = `photos/${crypto.randomUUID()}.${ext}`
    const buffer = await file.arrayBuffer()
    const blob = await put(name, buffer, {
      access: 'private',
      addRandomSuffix: true,
      contentType: file.type,
    })
    return Response.json({ ok: true, url: blob.url, downloadUrl: blob.downloadUrl })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

