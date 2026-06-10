import { get } from '@vercel/blob'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')
    if (!url) return Response.json({ error: 'url parameter required' }, { status: 400 })

    if (!url.startsWith('https://') || !url.includes('.blob.vercel-storage.com')) {
      return Response.json({ error: 'invalid url' }, { status: 400 })
    }

    const result = await get(url, { access: 'private' })
    if (!result) return Response.json({ error: 'not found' }, { status: 404 })

    const headers: Record<string, string> = {}
    headers['Content-Type'] = result.blob.contentType || 'application/octet-stream'
    if (result.blob.contentDisposition) headers['Content-Disposition'] = result.blob.contentDisposition
    headers['Cache-Control'] = 'public, max-age=31536000, immutable'

    return new Response(result.stream as ReadableStream, { headers })
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 })
  }
}
