import { useState, useRef, useMemo } from 'react'
import { Building2, CheckCircle, Home, ImagePlus, MapPin, Send, Shield, FileText, Phone, X, Loader2, AlertCircle, Video } from 'lucide-react'
import { Field } from '../components/ui'
import { WelcomeSplash } from '../components/WelcomeSplash'
import { useDashboard } from '../contexts/useDashboard'
import { toImageUrl } from '../lib/blob'
import { finishingOptions, orientationOptions, poolOptions, typeFieldLabels, typeFieldsMap } from '../lib/type-fields'
import type { TypeField } from '../lib/type-fields'
import type { PropertyType } from '../types/dashboard'

const cities=['الرياض','جدة','مكة','المدينة','الدمام','الخبر','الطائف','تبوك','أبها','بريدة','حائل','نجران','جازان','الأحساء','الخرج','القطيف','الظهران','ينبع','الجبيل','حفر الباطن']
const mt={name:'',phone:'',city:'',district:'',price:'',type:'',customType:'',area:'',rooms:'',orientation:'',streetWidth:'',floor:'',floors:'',pool:'',finishing:'',parking:'',locationUrl:'',description:''}

const defFields: TypeField[] = ['rooms', 'floor', 'orientation', 'finishing']
const typeFields = (type: string, ff: typeof mt, setFf: (v: typeof mt) => void, err: Record<string,string>) => {
  if (!type) return null
  const fields = typeFieldsMap[type as PropertyType] ?? defFields
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{fields.map(f => {
    const val = ff[f as keyof typeof ff] as string || ''
    const set = (v: string) => setFf({...ff, [f]: v})
    const el = (label: string, children: React.ReactNode) => <Field key={f} label={label}>{children}{err[f]&&<span className="text-xs text-red-500">{err[f]}</span>}</Field>
    if (f === 'orientation') return el(typeFieldLabels[f],<select onChange={e=>set(e.target.value)} value={val}><option value="">اختر</option>{orientationOptions.map(o=><option key={o} value={o}>{o}</option>)}</select>)
    if (f === 'finishing') return el(typeFieldLabels[f],<select onChange={e=>set(e.target.value)} value={val}><option value="">اختر</option>{finishingOptions.map(o=><option key={o} value={o}>{o}</option>)}</select>)
    if (f === 'pool') return el(typeFieldLabels[f],<select onChange={e=>set(e.target.value)} value={val}><option value="">اختر</option>{poolOptions.map(o=><option key={o} value={o}>{o}</option>)}</select>)
    return el(typeFieldLabels[f],<input onChange={e=>set(e.target.value)} value={val} />)
  })}</div>
}

function parseCoordsFromUrl(value: string): { lat: number; lng: number } | null {
  try {
    const match = value.match(/@?(-?\d+\.\d+),(-?\d+\.\d+)/) || value.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
  } catch { /* ignore */ }
  return null
}

function isGoogleMapsUrl(value: string): boolean {
  return /^https?:\/\/(?:www\.)?(?:maps\.)?(?:google\.[a-z.]+|goo\.gl)/i.test(value)
}

async function reverseGeocode(lat: number, lng: number): Promise<{ city: string; district: string }> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`)
    if (!res.ok) return { city: '', district: '' }
    const data = await res.json()
    return { city: data.city || '', district: data.district || '' }
  } catch { return { city: '', district: '' } }
}

export function AddRequestPage() {
  const {submitRequest, officeSettings}=useDashboard()
  const [f,setF]=useState(mt);const[e,setE]=useState<Record<string,string>>({});const[done,setDone]=useState(false);const[sub,setSub]=useState(false);const[splash,setSplash]=useState(true);const[subErr,setSubErr]=useState('')
  const [photos, setPhotos] = useState<string[]>([]); const [uploadingPhoto, setUploadingPhoto] = useState(false); const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({}); const [uploadErrors, setUploadErrors] = useState<string[]>([]); const [previewTypes, setPreviewTypes] = useState<Record<string, string>>({}); const fileInputRef = useRef<HTMLInputElement>(null)
  const [locating, setLocating] = useState(false); const [locError, setLocError] = useState('')
  const geocodingRef = useRef(false)

  const locationCoords = useMemo(() => f.locationUrl ? parseCoordsFromUrl(f.locationUrl) : null, [f.locationUrl])
  const embedUrl = locationCoords
    ? `https://maps.google.com/maps?q=${locationCoords.lat},${locationCoords.lng}&output=embed&hl=ar`
    : null

  const autoFillFromCoords = async (lat: number, lng: number, sourceUrl: string) => {
    if (geocodingRef.current) return
    geocodingRef.current = true
    try {
      const { city, district } = await reverseGeocode(lat, lng)
      if (city || district) {
        setF(prev => prev.locationUrl === sourceUrl
          ? { ...prev, city: city || prev.city, district: district || prev.district }
          : prev)
      }
    } catch { /* silent fallback */ }
    geocodingRef.current = false
  }

  const handleLocationChange = (rawUrl: string) => {
    setF(prev => ({ ...prev, locationUrl: rawUrl }))
    try {
      const match = rawUrl.match(/@?(-?\d+\.\d+),(-?\d+\.\d+)/) || rawUrl.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/)
      if (match) {
        const lat = parseFloat(match[1]), lng = parseFloat(match[2])
        autoFillFromCoords(lat, lng, rawUrl)
      }
    } catch { /* silent — keep link as-is, city/district remain editable */ }
  }

  const detectLocation = () => {
    if (!navigator.geolocation) { setLocError('المتصفح لا يدعم تحديد الموقع'); return }
    setLocating(true); setLocError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`
        setF(prev => ({ ...prev, locationUrl: url }))
        await autoFillFromCoords(latitude, longitude, url)
        setLocating(false)
      },
      (err) => {
        switch (err.code) {
          case err.PERMISSION_DENIED: setLocError('تم رفض الإذن. سمح للموقع في المتصفح وحاول مرة أخرى'); break
          case err.POSITION_UNAVAILABLE: setLocError('تعذر الحصول على الموقع'); break
          case err.TIMEOUT: setLocError('انتهى وقت طلب الموقع'); break
          default: setLocError('حدث خطأ في تحديد الموقع')
        }
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']; const MAX_SIZE = 15 * 1024 * 1024
  const [termsAccepted, setTermsAccepted] = useState(false)

  const v=()=>{const x:Record<string,string>={};const t=f.customType||f.type;if(!f.name.trim())x.name='مطلوب';if(!f.phone.trim())x.phone='مطلوب';else{const d=f.phone.replace(/\D/g,'');if(!/^(05\d{8}|5\d{8}|9665\d{8})$/.test(d))x.phone='رقم جوال سعودي صحيح: 05XXXXXXXX'};if(!f.city)x.city='مطلوب';if(!f.district.trim())x.district='مطلوب';if(!f.price.trim())x.price='مطلوب';else if(!/^\d+$/.test(f.price.trim()))x.price='أرقام فقط';if(!f.area.trim())x.area='مطلوب';else if(!/^\d+$/.test(f.area.trim()))x.area='أرقام فقط';if(!t)x.type='مطلوب';else{const fields=typeFieldsMap[t as PropertyType];if(!fields)return x;for(const fld of fields){if(fld==='orientation'&&!f.orientation)x.orientation='مطلوب';else if((fld==='rooms'||fld==='floor'||fld==='floors'||fld==='streetWidth')&&!f[fld].trim())x[fld]='مطلوب';else if(fld==='pool'&&!f.pool)x.pool='مطلوب';else if(fld==='finishing'&&!f.finishing)x.finishing='مطلوب';else if(fld==='parking'&&!f.parking)x.parking='مطلوب'}}if(uploadingPhoto)x.photos='انتظر حتى اكتمال رفع جميع الصور';else if(photos.length<2||photos.some(p=>p.startsWith('blob:')))x.photos='يرجى رفع صورتين على الأقل';if(!termsAccepted)x.terms='يجب الموافقة على الشروط';return x}

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'نوع الملف غير مدعوم. الأنواع: JPG, PNG, WebP, GIF, MP4'
    if (file.size > MAX_SIZE) return 'الملف كبير جداً. الحد الأقصى 15 ميجابايت'
    return null
  }

  const uploadPhoto = async (file: File) => {
    const err = validateFile(file)
    if (err) { setUploadErrors(prev => [...prev, err]); return }
    setUploadingPhoto(true)
    setUploadErrors(prev => prev.filter(e => e !== err))
    const preview = URL.createObjectURL(file)
    setPhotos(prev => [...prev, preview])
    setPreviewTypes(prev => ({ ...prev, [preview]: file.type }))
    setUploadProgress(prev => ({ ...prev, [preview]: 0 }))
    try {
      const formData = new FormData()
      formData.append('file', file)
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(prev => ({ ...prev, [preview]: Math.round((e.loaded / e.total) * 100) }))
      }
      const result = await new Promise<{ url: string }>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try { resolve(JSON.parse(xhr.responseText)) } catch { reject(new Error('فشل تحليل الرد')) }
          } else {
            try { const r = JSON.parse(xhr.responseText); reject(new Error(r.error || 'فشل الرفع')) } catch { reject(new Error('فشل الرفع')) }
          }
        }
        xhr.onerror = () => reject(new Error('فشل الاتصال'))
        xhr.onabort = () => reject(new Error('تم إلغاء الرفع'))
        xhr.send(formData)
      })
      setPhotos(prev => prev.map(p => p === preview ? result.url : p))
      URL.revokeObjectURL(preview)
      setPreviewTypes(prev => { const n = { ...prev }; delete n[preview]; return n })
      setUploadProgress(prev => { const n = { ...prev }; delete n[preview]; return n })
    } catch (e) {
      setPhotos(prev => prev.filter(p => p !== preview))
      URL.revokeObjectURL(preview)
      setPreviewTypes(prev => { const n = { ...prev }; delete n[preview]; return n })
      setUploadProgress(prev => { const n = { ...prev }; delete n[preview]; return n })
      setUploadErrors(prev => [...prev, e instanceof Error ? e.message : 'فشل رفع الملف'])
    }
    setUploadingPhoto(false)
  }

  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const url = prev[idx]
      if (url?.startsWith('blob:')) { URL.revokeObjectURL(url); setPreviewTypes(p => { const n = { ...p }; delete n[url]; return n }) }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const isVideo = (url: string) => /\.(mp4|webm)$/i.test(url) || previewTypes[url]?.startsWith('video/') || false

  const h=async(e2:React.FormEvent)=>{e2.preventDefault();const x=v();setE(x);if(Object.keys(x).length>0)return;setSub(true);setSubErr('');const t=f.customType||f.type;const title=`${t||''} - ${f.city||''} ${f.district||''}`.trim();try{await submitRequest({clientName:f.name.trim(),clientPhone:f.phone.trim(),clientType:'مالك',type:'إضافة عقار',propertyTitle:title,propertyCity:f.city,propertyDistrict:f.district.trim(),propertyPrice:f.price.trim(),propertyType:t,propertyArea:f.area.trim(),propertyRooms:f.rooms.trim(),propertyLocationUrl:f.locationUrl.trim()||undefined,propertyOrientation:f.orientation||undefined,propertyStreetWidth:f.streetWidth||undefined,propertyFloor:f.floor||undefined,propertyFloors:f.floors||undefined,propertyPool:f.pool||undefined,propertyFinishing:f.finishing||undefined,propertyParking:f.parking||undefined,propertyDescription:f.description.trim(),propertyPhotos:photos});setF(mt);setPhotos([]);setPreviewTypes({});setTermsAccepted(false);setDone(true)}catch{setSubErr('فشل الإرسال، تأكد من اتصالك وحاول مرة أخرى')}setSub(false)}

  if(done) return <div className="min-h-screen flex items-center justify-center" style={{background:'linear-gradient(135deg, #3D6B4F 0%, #2D523D 100%)'}}>
    <div className="text-center glass p-10 max-w-lg mx-4">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full" style={{background:'#C5A059'}}><CheckCircle size={40} style={{color:'#2C2418'}} /></div>
      <h2 className="text-2xl font-bold" style={{color:'#2C2418'}}>تم استلام طلبك بنجاح!</h2>
      <p className="mt-3 text-sm" style={{color:'#5C4F3E'}}>تم استلام طلبك بنجاح، وسنتواصل معك قريباً</p>
      {officeSettings.name && <p className="mt-2 text-sm font-medium" style={{color:'#3D6B4F'}}>{officeSettings.name}</p>}
      <div className="mt-6 flex flex-col gap-3">
        <button className="btn btn-primary btn-sm" onClick={()=>setDone(false)} type="button">إضافة إعلان آخر</button>
        <button className="btn btn-outline btn-sm" onClick={()=>window.location.href='/'} type="button">العودة للرئيسية</button>
        {officeSettings.showPublicProperties !== false && <a href="/properties" className="btn btn-gold btn-sm">عرض العقارات المتاحة</a>}
      </div>
    </div>
  </div>

  if (splash) return <WelcomeSplash onDone={()=>setSplash(false)} />

  return <div className="min-h-screen flex flex-col" style={{background:'#F5F0E8'}}>
    <div className="py-10 px-6 text-center" style={{background:'linear-gradient(135deg, #3D6B4F 0%, #2D523D 100%)',color:'white'}}>
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl" style={{background:'#C5A059'}}><Home size={24} style={{color:'#2C2418'}} /></div>
      <h1 className="text-2xl font-bold">المرقاب الذهبي</h1>
      <p className="mt-1 text-sm" style={{color:'rgba(197,160,89,0.7)'}}>إضافة إعلان عقاري</p>
      {officeSettings.showPublicProperties !== false && <a href="/properties" className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold" style={{color:'rgba(197,160,89,0.8)',textDecoration:'underline'}} type="button"><Building2 size={14} />عرض العقارات المتاحة</a>}
    </div>

    <div className="max-w-3xl mx-auto -mt-8 pb-16 px-4 w-full">
      {(officeSettings.falLicense || officeSettings.crNumber || officeSettings.whatsapp || officeSettings.address) && (
        <div className="glass p-5 mb-6 border border-[#C5A059]/30" style={{background:'rgba(255,255,255,.92)'}}>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} style={{color:'#3D6B4F'}} />
            <h3 className="text-sm font-bold" style={{color:'#2C2418'}}>الثقة والموثوقية</h3>
            <span className="text-xs mr-auto" style={{color:'#7A6B55'}}>Trust &amp; Reliability</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs" style={{color:'#5C4F3E'}}>
            {officeSettings.falLicense && <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:'rgba(61,107,79,0.05)'}}><Shield size={14} style={{color:'#3D6B4F'}} /><span>ترخيص الهيئة العامة للعقار: <b>{officeSettings.falLicense}</b> <span style={{color:'#7A6B55'}}>(FAL License)</span></span></div>}
            {officeSettings.crNumber && <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:'rgba(61,107,79,0.05)'}}><FileText size={14} style={{color:'#3D6B4F'}} /><span>السجل التجاري: <b>{officeSettings.crNumber}</b> <span style={{color:'#7A6B55'}}>(CR No.)</span></span></div>}
            {officeSettings.address && <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:'rgba(61,107,79,0.05)'}}><MapPin size={14} style={{color:'#3D6B4F'}} /><span>{officeSettings.address}</span></div>}
            {officeSettings.whatsapp && <div className="flex items-center gap-2 p-2 rounded-lg" style={{background:'rgba(61,107,79,0.05)'}}>
              <Phone size={14} style={{color:'#3D6B4F'}} />
              <a href={`https://wa.me/${officeSettings.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer" style={{color:'#3D6B4F',textDecoration:'underline',fontWeight:700}}>تواصل عبر واتساب (WhatsApp)</a>
            </div>}
          </div>
        </div>
      )}

      <div className="glass p-6 sm:p-8">
        <form className="flex flex-col gap-4" onSubmit={h}>
          <h2 className="text-lg font-bold" style={{color:'#2C2418'}}>معلومات المالك</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="الاسم *"><input onChange={e=>setF({...f,name:e.target.value})} value={f.name} />{e.name&&<span className="text-sm text-red-500">{e.name}</span>}</Field>
            <Field label="الجوال *"><input onChange={e=>setF({...f,phone:e.target.value})} value={f.phone} placeholder="05xxxxxxxx" />{e.phone&&<span className="text-sm text-red-500">{e.phone}</span>}</Field>
          </div>

          <h2 className="text-lg font-bold mt-3" style={{color:'#2C2418'}}>معلومات العقار</h2>
          <Field label="رابط موقع العقار (خرائط Google)">
            <div className="flex gap-2 items-start">
              <div className="flex-1"><input onChange={e=>handleLocationChange(e.target.value)} value={f.locationUrl} placeholder="https://www.google.com/maps/..." />{locError&&<span className="text-sm text-red-500 block mt-1">{locError}</span>}</div>
              <button type="button" onClick={detectLocation} disabled={locating} className="btn btn-outline btn-sm whitespace-nowrap mt-0" style={{padding:'8px 12px',minHeight:'42px'}}>{locating ? <><Loader2 size={14} className="animate-spin" />...</> : <><MapPin size={14} />تحديد موقعي</>}</button>
            </div>
          </Field>
          {embedUrl
            ? <iframe key={embedUrl} src={embedUrl} width="100%" height="250" className="rounded-xl border border-[#E0D0B8]" style={{border:0}} allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="خريطة الموقع" />
            : f.locationUrl.trim() && isGoogleMapsUrl(f.locationUrl)
              ? <a href={f.locationUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm" style={{color:'#3D6B4F',textDecoration:'underline'}}><MapPin size={14} />عرض الموقع على خرائط Google</a>
              : null}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="المدينة *"><select onChange={e=>setF({...f,city:e.target.value})} value={f.city}><option value="">اختر</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select>{e.city&&<span className="text-sm text-red-500">{e.city}</span>}</Field>
            <Field label="الحي *"><input onChange={e=>setF({...f,district:e.target.value})} value={f.district} />{e.district&&<span className="text-sm text-red-500">{e.district}</span>}</Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="السعر *"><input onChange={e=>setF({...f,price:e.target.value})} value={f.price} />{e.price&&<span className="text-sm text-red-500">{e.price}</span>}</Field>
            <Field label="المساحة *"><input onChange={e=>setF({...f,area:e.target.value})} value={f.area} />{e.area&&<span className="text-sm text-red-500">{e.area}</span>}</Field>
            <Field label="النوع *"><select onChange={e=>setF({...f,type:e.target.value,customType:e.target.value!=='آخر'?'':f.customType})} value={f.type==='آخر'?'آخر':f.type||''}><option value="">اختر</option>{['شقة','فيلا','أرض','عمارة','مكتب','مستودع'].map(t=><option key={t} value={t}>{t}</option>)}<option value="آخر">آخر</option></select>{f.type==='آخر'&&<input className="mt-2" placeholder="اكتب النوع" onChange={e=>setF({...f,customType:e.target.value})} value={f.customType} />}{e.type&&<span className="text-sm text-red-500">{e.type}</span>}</Field>
          </div>
          {typeFields(f.type, f, setF, e)}
          <Field label="الوصف"><textarea className="min-h-[140px]" onChange={e=>setF({...f,description:e.target.value})} value={f.description} placeholder="اكتب وصفاً تفصيلياً..." /></Field>

          <h2 className="text-lg font-bold mt-3" style={{color:'#2C2418'}}>صور وفيديو العقار *</h2>
          <p className="text-xs" style={{color:'#7A6B55'}}>يرجى رفع صورتين على الأقل. يدعم JPG, PNG, WebP, GIF, MP4 (حد أقصى 15 MB)</p>
          <div className="flex flex-wrap gap-3">
            {photos.map((url, idx) => {
              const progress = uploadProgress[url]
              const isPending = url.startsWith('blob:')
              const displayUrl = toImageUrl(url)
              return (
                <div key={idx} className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#E0D0B8]">
                  {isVideo(url) ? (
                    <video src={displayUrl} className="w-full h-full object-cover" muted autoPlay={false} />
                  ) : (
                    <img src={displayUrl} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  {isPending && progress != null && (
                    <div className="absolute inset-0 flex items-center justify-center" style={{background:'rgba(0,0,0,0.5)'}}>
                      <div className="text-center">
                        <Loader2 size={18} className="animate-spin mx-auto mb-1" style={{color:'#C5A059'}} />
                        <div className="w-16 h-1.5 rounded-full overflow-hidden mx-auto" style={{background:'rgba(255,255,255,0.2)'}}>
                          <div className="h-full rounded-full transition-all" style={{width:`${progress}%`,background:'#C5A059'}} />
                        </div>
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white" style={{fontSize:'12px'}}><X size={12} /></button>
                </div>
              )
            })}
            <label className="w-28 h-28 rounded-xl border-2 border-dashed border-[#C5A059] flex flex-col items-center justify-center cursor-pointer hover:bg-[#C5A059]/5 transition" style={{background:'rgba(197,160,89,0.05)'}}>
              {uploadingPhoto ? <Loader2 size={20} className="animate-spin" style={{color:'#C5A059'}} /> : <ImagePlus size={20} style={{color:'#C5A059'}} />}
              <span className="text-xs mt-1" style={{color:'#C5A059'}}>{uploadingPhoto ? 'جاري الرفع...' : 'إضافة'}</span>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) uploadPhoto(file); e.target.value = '' }} disabled={uploadingPhoto} />
            </label>
          </div>
          {uploadErrors.length > 0 && <div className="flex flex-col gap-1 mt-2">{uploadErrors.map((err, i) => <span key={i} className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{err}</span>)}</div>}
          {e.photos && <span className="text-sm text-red-500">{e.photos}</span>}

          <div className="flex items-start gap-3 mt-2">
            <input type="checkbox" id="terms" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="!w-5 !h-5 mt-0.5 shrink-0" style={{accentColor:'#3D6B4F'}} />
            <label htmlFor="terms" className="text-sm !font-normal" style={{color:'#5C4F3E', cursor:'pointer'}}>
              أوافق على <a href="/terms" target="_blank" style={{color:'#3D6B4F',fontWeight:700,textDecoration:'underline'}}>الشروط والأحكام</a> وأتعهد بصحة البيانات المدخلة
              <span className="text-red-500"> *</span>
            </label>
          </div>
          {e.terms && <span className="text-sm text-red-500 -mt-2">{e.terms}</span>}

          {subErr&&<p className="text-red-500 text-sm text-center">{subErr}</p>}

          <div className="mt-6 pt-4 border-t border-[#E0D0B8]">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs" style={{color:'#7A6B55'}}>
              {officeSettings.falLicense && <span>📜 ترخيص هيئة العقار: {officeSettings.falLicense}</span>}
              {officeSettings.crNumber && <span>🏢 سجل تجاري: {officeSettings.crNumber}</span>}
              {officeSettings.address && <span>📍 {officeSettings.address}</span>}
            </div>
          </div>

          <button className="btn btn-primary w-full mt-3" disabled={sub} type="submit"><Send size={18} />{sub?'جاري الإرسال...':'إرسال الطلب'}</button>
        </form>
      </div>
    </div>
  </div>
}
