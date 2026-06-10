export function PhotoGallery({ urls }: { urls?: string[] | null }) {
  if (!urls || urls.length === 0) return null
  return <div className="flex flex-col gap-2"><span className="text-xs font-bold" style={{color:'#7A6B55'}}>الصور</span>
    <div className="flex flex-wrap gap-2">{urls.map((url, i) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-xl overflow-hidden border border-[#E0D0B8] hover:opacity-85 transition-opacity"><img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} /></a>)}</div>
  </div>
}