export function toImageUrl(src: string): string {
  if (!src) return src
  if (src.startsWith('blob:')) return src
  if (src.startsWith('data:')) return src
  if (src.startsWith('/api/')) return src
  if (src.includes('public.blob.vercel-storage.com')) return src
  if (src.includes('private.blob.vercel-storage.com')) return `/api/blob-proxy?url=${encodeURIComponent(src)}`
  if (src.includes('.blob.vercel-storage.com')) return `/api/blob-proxy?url=${encodeURIComponent(src)}`
  return src
}
