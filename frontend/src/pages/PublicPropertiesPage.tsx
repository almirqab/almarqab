import { useEffect, useMemo, useState } from 'react'
import { Building2, Home, MapPin, Phone, Search, Filter, X } from 'lucide-react'
import { toImageUrl } from '../lib/blob'

interface PublicProperty {
  id: number; title: string; district: string; city: string; price: string; type: string; area: string; rooms: string; description: string; ownerName: string; ownerPhone: string; locationUrl?: string; photos?: string[];
}

const cities = ['الرياض','جدة','مكة','المدينة','الدمام','الخبر','الطائف','تبوك','أبها','بريدة','حائل','نجران','جازان','الأحساء','الخرج','القطيف','الظهران','ينبع','الجبيل','حفر الباطن']
const types = ['شقة','فيلا','أرض','عمارة','مكتب','مستودع']

export function PublicPropertiesPage() {
  const [properties, setProperties] = useState<PublicProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [officeName, setOfficeName] = useState('المرقاب الذهبي')
  const [showPublic, setShowPublic] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterType, setFilterType] = useState('')
  const [sel, setSel] = useState<PublicProperty | null>(null)

  useEffect(() => {
    fetch('/api/public-properties')
      .then(r => r.json())
      .then(d => { if (d.ok) { setProperties(d.properties); setOfficeName(d.officeName); setShowPublic(d.showPublicProperties !== false) } })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return properties.filter(p => {
      if (filterCity && p.city !== filterCity) return false
      if (filterType && p.type !== filterType) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.district.toLowerCase().includes(q) || p.price.includes(q)
      }
      return true
    })
  }, [properties, filterCity, filterType, search])

  return <div className="min-h-screen flex flex-col" style={{ background: '#F5F0E8' }}>
    <div className="py-10 px-6 text-center" style={{ background: 'linear-gradient(135deg, #3D6B4F 0%, #2D523D 100%)', color: 'white' }}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#C5A059' }}>
        <Home size={24} style={{ color: '#2C2418' }} />
      </div>
      <h1 className="text-2xl font-bold">{officeName}</h1>
      <p className="mt-1 text-sm" style={{ color: 'rgba(197,160,89,0.7)' }}>العقارات المتاحة</p>
    </div>

    <div className="max-w-6xl mx-auto -mt-6 pb-16 px-4 w-full">
      {!showPublic ? <div className="text-center py-20"><Building2 size={48} className="mx-auto mb-4" style={{ color: '#D4C5A8' }} /><p className="text-sm" style={{ color: '#7A6B55' }}>عرض العقارات غير مفعل حالياً</p><a href="/" className="btn btn-outline mt-4">العودة للرئيسية</a></div>
      : <>
      <div className="glass p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} style={{ color: '#7A6B55' }} />
          <span className="text-xs font-bold" style={{ color: '#7A6B55' }}>بحث وتصفية</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C5A059' }} />
            <input placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="!h-9 !text-sm !pr-10" />
          </div>
          <select onChange={e => setFilterType(e.target.value)} value={filterType} className="!h-9 !text-sm">
            <option value="">كل الأنواع</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select onChange={e => setFilterCity(e.target.value)} value={filterCity} className="!h-9 !text-sm">
            <option value="">كل المدن</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="text-center py-20"><p style={{ color: '#7A6B55' }}>جاري التحميل...</p></div>
      : filtered.length === 0
        ? <div className="text-center py-20"><Building2 size={48} className="mx-auto mb-4" style={{ color: '#D4C5A8' }} /><p className="text-sm" style={{ color: '#7A6B55' }}>لا توجد عقارات متاحة حالياً</p></div>
        : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => <div key={p.id} className="card-item cursor-pointer" onClick={() => setSel(p)}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(61,107,79,0.1)' }}>
                  <Building2 size={18} style={{ color: '#3D6B4F' }} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: '#2C2418' }}>{p.title}</p>
                  <p className="text-xs" style={{ color: '#7A6B55' }}><MapPin size={11} className="inline" /> {p.city} - {p.district}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm mb-3" style={{ color: '#5C4F3E' }}>
                <span>💰 {p.price}</span>
                <span>📐 {p.area} م²</span>
                <span>🏷 {p.type}</span>
              </div>
              {p.description && <p className="text-xs line-clamp-2 mb-3" style={{ color: '#7A6B55' }}>{p.description}</p>}
              {p.ownerPhone && <a href={`https://wa.me/966${p.ownerPhone.replace(/\D/g,'').slice(-9)}`} target="_blank" rel="noreferrer" className="btn btn-gold btn-sm w-full mt-2" onClick={e => e.stopPropagation()}>
                <Phone size={14} />تواصل مع المالك
              </a>}
            </div>)}
          </div>
      }
      </>}
    </div>

    {sel && <div className="modal-overlay" onClick={() => setSel(null)}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: '#2C2418' }}>{sel.title}</h2>
          <button onClick={() => setSel(null)} className="border-none bg-transparent cursor-pointer p-1" type="button"><X size={18} style={{ color: '#7A6B55' }} /></button>
        </div>
        <div className="grid grid-cols-2 gap-3 bg-[#F5F0E8] rounded-xl p-4 text-sm mb-4">
          {[['النوع', sel.type], ['المدينة', sel.city], ['الحي', sel.district], ['السعر', sel.price], ['المساحة', sel.area+' م²'], ['الغرف', sel.rooms||'-']].map(([l,v]) => v ? <div key={l as string}><span style={{ color:'#7A6B55' }}>{l}: </span>{v}</div> : null)}
          {sel.locationUrl && <div className="col-span-2"><span style={{ color:'#7A6B55' }}>الموقع: </span><a href={sel.locationUrl} target="_blank" rel="noreferrer" style={{ color:'#C5A059', textDecoration:'underline', fontSize:'0.85rem' }}>عرض على خرائط Google</a></div>}
          {(sel.locationUrl && /^https?:\/\/(?:www\.)?(?:maps\.)?(?:google\.[a-z.]+|goo\.gl)\/maps/i.test(sel.locationUrl)) && <div className="col-span-2 rounded-xl overflow-hidden border border-[#E0D0B8]"><iframe src={`https://maps.google.com/maps?q=${encodeURIComponent(sel.locationUrl)}&output=embed&hl=ar`} width="100%" height="200" style={{border:0}} allowFullScreen loading="lazy" title="خريطة الموقع" /></div>}
        </div>
        {sel.description && <p className="text-sm mb-4" style={{ color:'#5C4F3E' }}>{sel.description}</p>}
        {sel.photos && sel.photos.length > 0 && <div className="flex flex-wrap gap-2 mb-4">
          {sel.photos.map((url, i) => <img key={i} src={toImageUrl(url)} alt={`صورة ${i+1}`} className="w-20 h-20 rounded-xl object-cover border border-[#E0D0B8]" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />)}
        </div>}
        <div className="flex flex-col gap-2">
          {sel.ownerPhone && <a href={`https://wa.me/966${sel.ownerPhone.replace(/\D/g,'').slice(-9)}`} target="_blank" rel="noreferrer" className="btn btn-gold w-full"><Phone size={16} />تواصل مع المالك عبر واتساب</a>}
          <a href="/" className="btn btn-outline w-full" type="button">العودة للرئيسية</a>
        </div>
      </div>
    </div>}
  </div>
}
