/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from 'react'
import { Building2, Edit3, Eye, EyeOff, Filter, ImagePlus, Loader2, Plus, Share2, Trash2, X } from 'lucide-react'
import { Field, Modal, Toast } from '../components/ui'
import { PhotoGallery } from '../components/PhotoGallery'
import { useDashboard } from '../contexts/useDashboard'
import { finishingOptions, orientationOptions, poolOptions, typeFieldLabels, typeFieldsMap } from '../lib/type-fields'
import { useDebounce } from '../utils/useDebounce'
import { toImageUrl } from '../lib/blob'
import type { TypeField } from '../lib/type-fields'
import type { PropertyItem, PropertyStatus, PropertyType } from '../types/dashboard'

const cities=['الرياض','جدة','مكة','المدينة','الدمام','الخبر','الطائف','تبوك','أبها','بريدة','حائل','نجران','جازان','الأحساء','الخرج','القطيف','الظهران','ينبع','الجبيل','حفر الباطن']
const atys=['شقة','فيلا','أرض','عمارة','مكتب','مستودع']
const defFields: TypeField[] = ['rooms', 'floor', 'orientation', 'finishing']
const ss:PropertyStatus[]=['متاح','تم البيع','تم التأجير','ملغي']

export function PropertiesPage() {
  const { properties, addProperty, updateProperty, updatePropertyStatus, deleteProperty } = useDashboard()
  const [f, setF] = useState<any>({ title:'', type:'', customType:'', status:'متاح', city:'', district:'', price:'', area:'', rooms:'', floor:'', floors:'', orientation:'', streetWidth:'', pool:'', finishing:'', parking:'', locationUrl:'', description:'', ownerName:'', ownerPhone:'', ownerType:'مالك' })
  const [add, setAdd] = useState(false)
  const [view, setView] = useState<PropertyItem|null>(null)
  const [photos, setPhotos] = useState<string[]>([]); const [uploadingPhoto, setUploadingPhoto] = useState(false); const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({}); const [uploadErrors, setUploadErrors] = useState<string[]>([]); const [previewTypes, setPreviewTypes] = useState<Record<string, string>>({}); const fileInputRef = useRef<HTMLInputElement>(null)
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']; const MAX_SIZE = 15 * 1024 * 1024
  const [toast, setToast] = useState(''); const [toastOpen, setToastOpen] = useState(false)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [filter, setFilter] = useState({ type:'', city:'', status:'' as PropertyStatus|'', text:'' })
  const debouncedText = useDebounce(filter.text, 300)
  const ld = (key: string) => loading[key] || false
  const lds = (key: string) => (v: boolean) => setLoading(prev => ({ ...prev, [key]: v }))

  const filtered = properties.filter(p => {
    if (filter.type && p.type !== filter.type) return false
    if (filter.city && p.city !== filter.city) return false
    if (filter.status && p.status !== filter.status) return false
    if (debouncedText) {
      const q = debouncedText.trim().toLowerCase()
      if (!p.title.toLowerCase().includes(q) && !p.district.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q) && !(p.price+'').includes(q)) return false
    }
    return true
  }).sort((a, b) => {
    const sa = a.status === 'تم البيع' || a.status === 'تم التأجير' ? 1 : 0
    const sb = b.status === 'تم البيع' || b.status === 'تم التأجير' ? 1 : 0
    if (sa !== sb) return sa - sb
    return b.id - a.id
  })

  const typeFields = (type: string) => {
    if (!type) return null
    const fields = typeFieldsMap[type as PropertyType] ?? defFields
    return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{fields.map(fld => {
      const val = f[fld as keyof typeof f] as string || ''
      const set = (v: string) => setF({...f, [fld]: v})
      if (fld === 'orientation') return <Field key={fld} label={typeFieldLabels[fld]}><select onChange={e=>set(e.target.value)} value={val}><option value="">اختر</option>{orientationOptions.map(o=><option key={o} value={o}>{o}</option>)}</select></Field>
      if (fld === 'finishing') return <Field key={fld} label={typeFieldLabels[fld]}><select onChange={e=>set(e.target.value)} value={val}><option value="">اختر</option>{finishingOptions.map(o=><option key={o} value={o}>{o}</option>)}</select></Field>
      if (fld === 'pool') return <Field key={fld} label={typeFieldLabels[fld]}><select onChange={e=>set(e.target.value)} value={val}><option value="">اختر</option>{poolOptions.map(o=><option key={o} value={o}>{o}</option>)}</select></Field>
      return <Field key={fld} label={typeFieldLabels[fld]}><input onChange={e=>set(e.target.value)} value={val} /></Field>
    })}</div>
  }

  const stBadge = (s: PropertyStatus) => {
    const map: Record<PropertyStatus, {bg:string,color:string}> = { 'متاح':{bg:'rgba(61,107,79,.12)',color:'#3D6B4F'}, 'تم البيع':{bg:'rgba(179,58,58,.12)',color:'#B33A3A'}, 'تم التأجير':{bg:'rgba(179,58,58,.12)',color:'#B33A3A'}, 'ملغي':{bg:'rgba(90,78,60,.12)',color:'#5C4F3E'} }
    const m = map[s]
    return <span className="badge" style={{background:m.bg,color:m.color}}>{s}</span>
  }

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'نوع الملف غير مدعوم. الأنواع: JPG, PNG, WebP, GIF, MP4'
    if (file.size > MAX_SIZE) return 'الملف كبير جداً. الحد الأقصى 15 ميجابايت'
    return null
  }

  const uploadPhoto = async (file: File) => {
    if (ld('upload')) return
    const err = validateFile(file)
    if (err) { setUploadErrors(prev => [...prev, err]); return }

    lds('upload')(true)
    setUploadingPhoto(true)
    setUploadErrors(prev => prev.filter(e => e !== err))

    const id = crypto.randomUUID()
    setUploadProgress(prev => ({ ...prev, [id]: 0 }))

    const preview = URL.createObjectURL(file)
    setPhotos(prev => [...prev, preview])
    setPreviewTypes(prev => ({ ...prev, [preview]: file.type }))

    try {
      const key = import.meta.env.VITE_SYNC_API_KEY || 'almrqab-sync-key-2026'
      const formData = new FormData()
      formData.append('file', file)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload')
      xhr.setRequestHeader('x-api-key', key)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setUploadProgress(prev => ({ ...prev, [id]: Math.round((e.loaded / e.total) * 100) }))
        }
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
    } catch (e) {
      setPhotos(prev => prev.filter(p => p !== preview))
      URL.revokeObjectURL(preview)
      setPreviewTypes(prev => { const n = { ...prev }; delete n[preview]; return n })
      setUploadErrors(prev => [...prev, e instanceof Error ? e.message : 'فشل رفع الملف'])
      setToast('فشل رفع الملف'); setToastOpen(true)
    }
    setUploadProgress(prev => { const n = { ...prev }; delete n[id]; return n })
    setUploadingPhoto(false); lds('upload')(false)
  }
  const removePhoto = (idx: number) => {
    setPhotos(prev => {
      const url = prev[idx]
      if (url?.startsWith('blob:')) { URL.revokeObjectURL(url); setPreviewTypes(p => { const n = { ...p }; delete n[url]; return n }) }
      return prev.filter((_, i) => i !== idx)
    })
  }

  const saveNew = async () => {
    if (ld('save')) return
    lds('save')(true)
    const t = f.customType || f.type
    if (!f.title?.trim() || !f.price?.trim() || !f.area?.trim() || !t) { setToast('املأ الحقول المطلوبة'); setToastOpen(true); lds('save')(false); return }
    try {
      await addProperty({ title:f.title.trim(), type:t, status:f.status as PropertyStatus, visible:true, city:f.city||'', district:f.district?.trim()||'', price:f.price.trim(), area:f.area.trim(), rooms:f.rooms?.trim()||'', floor:f.floor||'', floors:f.floors||'', orientation:f.orientation||undefined, streetWidth:f.streetWidth||'', pool:f.pool||'', finishing:f.finishing||'', parking:f.parking||'', locationUrl:f.locationUrl?.trim()||'', description:f.description?.trim()||'', ownerName:f.ownerName?.trim()||'', ownerPhone:f.ownerPhone?.trim()||'', ownerType:f.ownerType||'مالك', photos: photos.length ? photos : undefined })
      setAdd(false); setF({ title:'',type:'',customType:'',status:'متاح',city:'',district:'',price:'',area:'',rooms:'',floor:'',floors:'',orientation:'',streetWidth:'',pool:'',finishing:'',parking:'',locationUrl:'',description:'',ownerName:'',ownerPhone:'',ownerType:'مالك' }); setPhotos([]); setPreviewTypes({})
      setToast('تمت إضافة العقار'); setToastOpen(true)
    } catch { setToast('فشل إضافة العقار'); setToastOpen(true) }
    lds('save')(false)
  }

  const saveEdit = async () => {
    if (ld('save')) return
    lds('save')(true)
    const t = f.customType || f.type
    if (!f.title?.trim() || !f.price?.trim() || !f.area?.trim() || !t || !f.id) { setToast('املأ الحقول المطلوبة'); setToastOpen(true); lds('save')(false); return }
    try {
      await updateProperty(f.id, { title:f.title.trim(), type:t, status:f.status as PropertyStatus, city:f.city||'', district:f.district?.trim()||'', price:f.price.trim(), area:f.area.trim(), rooms:f.rooms?.trim()||'', floor:f.floor||'', floors:f.floors||'', orientation:f.orientation||undefined, streetWidth:f.streetWidth||'', pool:f.pool||'', finishing:f.finishing||'', parking:f.parking||'', locationUrl:f.locationUrl?.trim()||'', description:f.description?.trim()||'', ownerName:f.ownerName?.trim()||'', ownerPhone:f.ownerPhone?.trim()||'', ownerType:f.ownerType||'مالك', photos: photos.length ? photos : undefined })
      setAdd(false); setF({ title:'',type:'',customType:'',status:'متاح',city:'',district:'',price:'',area:'',rooms:'',floor:'',floors:'',orientation:'',streetWidth:'',pool:'',finishing:'',parking:'',locationUrl:'',description:'',ownerName:'',ownerPhone:'',ownerType:'مالك' }); setPhotos([]); setPreviewTypes({})
      setToast('تم تحديث العقار'); setToastOpen(true)
    } catch { setToast('فشل تحديث العقار'); setToastOpen(true) }
    lds('save')(false)
  }

  const editProp = (p: PropertyItem) => { const isCustom = !atys.includes(p.type); setF({ ...p, type: isCustom ? 'آخر' : p.type, customType: isCustom ? p.type : '' }); setPhotos(p.photos || []); setAdd(true) }
  const delProp = async (id: number) => { if (ld('del')) return; lds('del')(true); try { await deleteProperty(id); setToast('تم حذف العقار'); setToastOpen(true) } catch { setToast('فشل حذف العقار'); setToastOpen(true) }; lds('del')(false) }

  return <div className="flex flex-col gap-5">
    <Toast message={toast} open={toastOpen} setOpen={setToastOpen} />

    <div className="pg-hdr">
      <div className="flex items-center justify-between">
        <h1 className="pg-title">العقارات</h1>
        <span className="pg-sub">{properties.length} عقار</span>
      </div>
      <div className="gold-line" />
    </div>

    <div className="glass p-4">
      <div className="flex items-center gap-2 mb-2">
        <Filter size={14} style={{color:'#7A6B55'}} />
        <span className="text-xs font-bold" style={{color:'#7A6B55'}}>تصفية</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select onChange={e=>setFilter({...filter,type:e.target.value})} value={filter.type} className="!h-9 !text-sm">
          <option value="">كل الأنواع</option>
          {atys.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
        <select onChange={e=>setFilter({...filter,city:e.target.value})} value={filter.city} className="!h-9 !text-sm">
          <option value="">كل المدن</option>
          {cities.map(c=><option key={c} value={c}>{c}</option>)}
        </select>
        <select onChange={e=>setFilter({...filter,status:e.target.value as PropertyStatus})} value={filter.status} className="!h-9 !text-sm">
          <option value="">كل الحالات</option>
          {ss.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="بحث..." value={filter.text} onChange={e=>setFilter({...filter,text:e.target.value})} className="!h-9 !text-sm" />
      </div>
    </div>

    <button onClick={()=>{setAdd(true);setF({title:'',type:'',customType:'',status:'متاح',city:'',district:'',price:'',area:'',rooms:'',floor:'',floors:'',orientation:'',streetWidth:'',pool:'',finishing:'',parking:'',locationUrl:'',description:'',ownerName:'',ownerPhone:'',ownerType:'مالك'})}} className="btn btn-primary w-full sm:w-auto" type="button"><Plus size={16} />إضافة عقار</button>

    <Modal open={add} onClose={()=>setAdd(false)} title={f.id?'تعديل العقار':'إضافة عقار'}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="العنوان"><input onChange={e=>setF({...f,title:e.target.value})} value={f.title} /></Field>
          <Field label="النوع"><select onChange={e=>setF({...f,type:e.target.value,customType:e.target.value!=='آخر'?'':f.customType})} value={f.type==='آخر'?'آخر':f.type||''}><option value="">اختر</option>{atys.map(t=><option key={t} value={t}>{t}</option>)}<option value="آخر">آخر</option></select>{f.type==='آخر'&&<input className="mt-2" placeholder="اكتب النوع" onChange={e=>setF({...f,customType:e.target.value})} value={f.customType} />}</Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="الحالة"><select onChange={e=>setF({...f,status:e.target.value as PropertyStatus})} value={f.status}>{ss.map(s=><option key={s} value={s}>{s}</option>)}</select></Field>
          <Field label="المدينة"><select onChange={e=>setF({...f,city:e.target.value})} value={f.city}><option value="">اختر</option>{cities.map(c=><option key={c} value={c}>{c}</option>)}</select></Field>
          <Field label="الحي"><input onChange={e=>setF({...f,district:e.target.value})} value={f.district} /></Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="السعر"><input onChange={e=>setF({...f,price:e.target.value})} value={f.price} /></Field>
          <Field label="المساحة"><input onChange={e=>setF({...f,area:e.target.value})} value={f.area} /></Field>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="المالك"><input onChange={e=>setF({...f,ownerName:e.target.value})} value={f.ownerName} /></Field>
          <Field label="جوال المالك"><input onChange={e=>setF({...f,ownerPhone:e.target.value})} value={f.ownerPhone} placeholder="05xxxxxxxx" /></Field>
          <Field label="رابط الموقع"><input onChange={e=>setF({...f,locationUrl:e.target.value})} value={f.locationUrl} placeholder="https://maps.google.com/..." /></Field>
        </div>
        {typeFields(f.type)}
        <h2 className="text-lg font-bold mt-3" style={{color:'#2C2418'}}>صور وفيديو العقار</h2>
        <p className="text-xs" style={{color:'#7A6B55'}}>صور العقار (يدعم JPG, PNG, WebP, GIF, MP4 - حد أقصى 15 MB)</p>
        <div className="flex flex-wrap gap-3">
          {photos.map((url, idx) => {
            const progress = Object.values(uploadProgress).find(p => p > 0 && p < 100)
            const isPending = url.startsWith('blob:')
            return (
              <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#E0D0B8]">
                <img src={toImageUrl(url)} alt={`صورة ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                {isPending && progress != null && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{background:'rgba(0,0,0,0.5)'}}>
                    <div className="text-center">
                      <Loader2 size={16} className="animate-spin mx-auto mb-1" style={{color:'#C5A059'}} />
                      <div className="w-14 h-1.5 rounded-full overflow-hidden mx-auto" style={{background:'rgba(255,255,255,0.2)'}}>
                        <div className="h-full rounded-full transition-all" style={{width:`${progress}%`,background:'#C5A059'}} />
                      </div>
                    </div>
                  </div>
                )}
                <button type="button" onClick={() => removePhoto(idx)} className="absolute top-1 left-1 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white" style={{fontSize:'12px'}}><X size={12} /></button>
              </div>
            )})}
          <label className="w-24 h-24 rounded-xl border-2 border-dashed border-[#C5A059] flex flex-col items-center justify-center cursor-pointer hover:bg-[#C5A059]/5 transition" style={{background:'rgba(197,160,89,0.05)'}}>
            {uploadingPhoto ? <Loader2 size={20} className="animate-spin" style={{color:'#C5A059'}} /> : <ImagePlus size={20} style={{color:'#C5A059'}} />}
            <span className="text-xs mt-1" style={{color:'#C5A059'}}>{uploadingPhoto ? 'جاري الرفع...' : 'إضافة'}</span>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="hidden" onChange={e => { const file = e.target.files?.[0]; if (file) uploadPhoto(file); e.target.value = '' }} disabled={uploadingPhoto} />
          </label>
        </div>
        {uploadErrors.length > 0 && <div className="flex flex-col gap-1 mt-2">{uploadErrors.map((err, i) => <span key={i} className="text-xs text-red-500">{err}</span>)}</div>}
        <Field label="الوصف"><textarea onChange={e=>setF({...f,description:e.target.value})} value={f.description} /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-outline btn-sm" onClick={()=>setAdd(false)} type="button">إلغاء</button>
          <button className="btn btn-primary btn-sm" onClick={f.id?saveEdit:saveNew} disabled={ld('save')} type="button">{ld('save')?'...':(f.id?'تحديث':'إضافة')}</button>
        </div>
      </div>
    </Modal>

    {filtered.length === 0
      ? <div className="text-center py-16"><Building2 size={48} className="mx-auto mb-4" style={{color:'#D4C5A8'}} /><p className="text-sm" style={{color:'#7A6B55'}}>لا توجد عقارات</p></div>
      : <div className="cards-grid sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => {
            const isSold = p.status === 'تم البيع' || p.status === 'تم التأجير'
            return <div key={p.id} className="card-item" style={isSold?{borderRight:'4px solid #B33A3A',background:'rgba(179,58,58,.03)'}:{}}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background:isSold?'rgba(179,58,58,.1)':'rgba(61,107,79,.1)'}}><Building2 size={18} style={{color:isSold?'#B33A3A':'#3D6B4F'}} /></div>
                  <div><p className="text-sm font-bold" style={{color:'#2C2418'}}>{p.title}</p><p className="text-xs" style={{color:'#7A6B55'}}>{p.city} - {p.district}</p></div>
                </div>
                {stBadge(p.status)}
              </div>
              <div className="flex items-center gap-4 text-sm mb-3" style={{color:'#5C4F3E'}}>
                <span>💰 {p.price}</span>
                <span>📐 {p.area} م²</span>
                <span>🏷 {p.type}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-1 pb-2">
                {ss.map(s => {
                  const active = p.status === s
                  const isRed = s === 'تم البيع' || s === 'تم التأجير'
                  return <button key={s}
                    className="text-xs rounded-lg font-medium transition-all cursor-pointer px-2 py-0.5"
                    style={{
                      background: active ? (isRed ? 'rgba(179,58,58,.15)' : s === 'متاح' ? 'rgba(61,107,79,.15)' : 'rgba(90,78,60,.15)') : 'transparent',
                      color: active ? (isRed ? '#B33A3A' : s === 'متاح' ? '#3D6B4F' : '#5C4F3E') : '#C5B8A0',
                      border: `1px solid ${active ? (isRed ? '#B33A3A' : s === 'متاح' ? '#3D6B4F' : '#5C4F3E') : '#E0D0B8'}`,
                    }}
                    onClick={async() => { if (ld(`s_${p.id}`)) return; lds(`s_${p.id}`)(true); try { await updatePropertyStatus(p.id, s as PropertyStatus) } catch (err) { console.error('status update failed', err) }; lds(`s_${p.id}`)(false) }}
                    type="button">{s}</button>
                })}
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-[#F0E8D8]">
                <button className="btn btn-ghost btn-sm flex-1" onClick={()=>editProp(p)} type="button"><Edit3 size={14} />تعديل</button>
                <button className="btn btn-outline btn-sm flex-1" onClick={()=>setView(p)} type="button"><Eye size={14} />عرض</button>
                <button className="btn btn-sm" style={{background:p.visible === false ? 'rgba(90,78,60,.1)' : 'rgba(61,107,79,.1)', color:p.visible === false ? '#5C4F3E' : '#3D6B4F'}} onClick={async() => { if (ld(`v_${p.id}`)) return; lds(`v_${p.id}`)(true); try { await updateProperty(p.id,{visible:!(p.visible ?? true)}) } catch {}; lds(`v_${p.id}`)(false) }} disabled={ld(`v_${p.id}`)} type="button">{p.visible === false ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                <button className="btn btn-sm flex-1" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={()=>delProp(p.id)} type="button"><Trash2 size={14} />حذف</button>
              </div>
            </div>
          })}
        </div>
    }

    <Modal open={!!view} onClose={()=>setView(null)} title={view?.title}>
      {view && <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 bg-[#F5F0E8] rounded-xl p-4 text-sm">
          {[
            ['النوع', view.type], ['المدينة', view.city], ['الحي', view.district],
            ['السعر', view.price], ['المساحة', view.area+' م²'],
            [typeFieldLabels.rooms, view.rooms||'-'], [typeFieldLabels.floor, view.floor||'-'], [typeFieldLabels.floors, view.floors||'-'],
            [typeFieldLabels.orientation, view.orientation||'-'], [typeFieldLabels.streetWidth, view.streetWidth||'-'],
            [typeFieldLabels.pool, view.pool||'-'], [typeFieldLabels.finishing, view.finishing||'-'],
            [typeFieldLabels.parking, view.parking||'-'], ['المالك', view.ownerName||'-'],
            ['جوال', view.ownerPhone||'-'], ['الحالة', view.status],
          ].map(([l,v])=>v?<div key={l as string}><span style={{color:'#7A6B55'}}>{l}: </span>{v}</div>:null)}
          {view.locationUrl && <div className="col-span-2"><span style={{color:'#7A6B55'}}>الموقع: </span><a href={view.locationUrl} target="_blank" rel="noreferrer" style={{color:'#C5A059',textDecoration:'underline',fontSize:'0.85rem'}}>عرض على خرائط Google</a></div>}
        </div>
        {view.description && <p className="text-sm" style={{color:'#5C4F3E'}}>{view.description}</p>}
        <PhotoGallery urls={view.photos} />
        <div className="flex gap-2">
          {view.ownerPhone && <a href={`https://wa.me/966${view.ownerPhone.replace(/\D/g,'').slice(-9)}`} target="_blank" className="btn btn-gold btn-sm flex-1" rel="noreferrer">تواصل مع المالك</a>}
          <button type="button" className="btn btn-outline btn-sm flex-1" onClick={() => {
            const details = [`*${view.title}*`,`💰 ${view.price}`,`📍 ${view.city} - ${view.district}`,
              view.area && `📐 ${view.area} م²`, view.rooms && `🛏 ${view.rooms}`,
              view.description && `\n${view.description}`,
              view.photos?.length ? `\n📸 ${view.photos.map(p => toImageUrl(p)).join('\n')}` : '',
              view.locationUrl && `\n📍 ${view.locationUrl}`,
            ].filter(Boolean).join('\n')
            if (navigator.share) { navigator.share({ title: view.title, text: details }).catch(() => {}) }
            else { navigator.clipboard?.writeText(details).then(() => alert('تم نسخ تفاصيل العقار')).catch(() => {}) }
          }}><Share2 size={14} />مشاركة العقار</button>
        </div>
      </div>}
    </Modal>
  </div>
}
