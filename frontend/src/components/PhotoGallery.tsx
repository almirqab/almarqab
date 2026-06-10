import { Share2 } from 'lucide-react'
import { toImageUrl } from '../lib/blob'

function shareImage(url: string, label: string) {
  const imgUrl = toImageUrl(url)
  if (navigator.share) {
    navigator.share({ title: label, text: label, url: imgUrl }).catch(() => {})
  } else {
    navigator.clipboard?.writeText(imgUrl).then(() => alert('تم نسخ رابط الصورة')).catch(() => {})
  }
}

export function PhotoGallery({ urls }: { urls?: string[] | null }) {
  if (!urls || urls.length === 0) return null
  return <div className="flex flex-col gap-2"><span className="text-xs font-bold" style={{color:'#7A6B55'}}>الصور</span>
    <div className="flex flex-wrap gap-2">{urls.map((url, i) => <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-[#E0D0B8]">
      <img src={toImageUrl(url)} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      <a href={toImageUrl(url)} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
      <button type="button" onClick={() => shareImage(url, `صورة ${i + 1}`)} className="absolute bottom-1 left-1 w-6 h-6 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{background:'rgba(61,107,79,0.85)',color:'white'}} title="مشاركة"><Share2 size={12} /></button>
    </div>)}</div>
  </div>
}