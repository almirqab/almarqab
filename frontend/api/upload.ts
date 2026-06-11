import { put } from '@vercel/blob'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
const MAX_SIZE = 15 * 1024 * 1024

const MAGIC_BYTES: Record<string, Uint8Array[]> = {
  'image/jpeg': [new Uint8Array([0xFF, 0xD8, 0xFF])],
  'image/png': [new Uint8Array([0x89, 0x50, 0x4E, 0x47])],
  'image/gif': [new Uint8Array([0x47, 0x49, 0x46, 0x38])],
  'image/webp': [new Uint8Array([0x52, 0x49, 0x46, 0x46])],
  'video/mp4': [new Uint8Array([0x00, 0x00, 0x00]), new Uint8Array([0x66, 0x74, 0x79, 0x70])],
  'video/webm': [new Uint8Array([0x1A, 0x45, 0xDF, 0xA3])],
}

function validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType]
  if (!signatures) return false
  const view = new Uint8Array(buffer)
  return signatures.some(sig => {
    if (view.length < sig.length) return false
    return sig.every((byte, i) => view[i] === byte)
  })
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
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return Response.json({ ok: false, error: 'no file' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return Response.json({ ok: false, error: 'نوع الملف غير مدعوم. الأنواع المدعومة: JPG, PNG, WebP, GIF, MP4' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return Response.json({ ok: false, error: 'الملف كبير جداً. الحد الأقصى 15 ميجابايت' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    if (!validateMagicBytes(buffer, file.type)) {
      return Response.json({ ok: false, error: 'توقيع الملف غير صالح — قد يكون الملف تالفاً أو غير مدعوم' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const name = `photos/${crypto.randomUUID()}.${ext}`
    const blob = await put(name, buffer, {
      access: 'public',
      addRandomSuffix: true,
      contentType: file.type,
    })
    return Response.json({ ok: true, url: blob.url, downloadUrl: blob.downloadUrl })
  } catch (e) {
    return Response.json({ ok: false, error: String(e) }, { status: 500 })
  }
}

