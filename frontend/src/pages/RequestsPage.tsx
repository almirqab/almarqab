import { useMemo, useState } from 'react'
import { Check, ClipboardList, Home, Search, Send, Trash2, X } from 'lucide-react'
import { Field, Modal, Toast } from '../components/ui'
import { PhotoGallery } from '../components/PhotoGallery'
import { useDashboard } from '../contexts/useDashboard'
import { typeFieldLabels } from '../lib/type-fields'
import { useDebounce } from '../utils/useDebounce'
import type { RequestItem } from '../types/dashboard'

function norm(p:string){const d=p.replace(/\D/g,'');if(d.startsWith('966'))return d;if(d.startsWith('05'))return `966${d.slice(1)}`;if(d.startsWith('5')&&d.length===9)return `966${d}`;return d}

export function RequestsPage() {
  const {requests,approveRequest,rejectRequest,convertRequestToProperty,deleteRequest,officeSettings}=useDashboard()
  const [q,setQ]=useState('');const[stf,setStf]=useState('الكل');const[sel,setSel]=useState<RequestItem|null>(null);const[to,setTo]=useState('');const[ts,setTs]=useState(false)
  const [sendPhone,setSendPhone]=useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const ld = (k: string) => loading[k] || false
  const lds = (k: string) => (v: boolean) => setLoading(p => ({ ...p, [k]: v }))
  const debouncedQ = useDebounce(q, 300)
  const filtered=useMemo(()=>requests.filter(r=>{if(stf!=='الكل'&&r.status!==stf)return false;if(debouncedQ.trim()){const l=debouncedQ.trim().toLowerCase();return r.clientName.toLowerCase().includes(l)||(r.propertyTitle??'').toLowerCase().includes(l)};return true}),[requests,stf,debouncedQ])
  const doApprove = async (id: number) => { if(ld('approve'))return;lds('approve')(true);try{await approveRequest(id);setTo('✓ تم القبول');setTs(true);setSel(null)}catch(e){setTo('خطأ: '+String(e));setTs(true)};lds('approve')(false) }
  const doReject = async (id: number) => { if(ld('reject'))return;lds('reject')(true);try{await rejectRequest(id);setTo('تم الرفض');setTs(true);setSel(null)}catch(e){setTo('خطأ: '+String(e));setTs(true)};lds('reject')(false) }
  const doConvert = async (id: number) => { if(ld('convert'))return;lds('convert')(true);try{await convertRequestToProperty(id);setTo('✓ تم تحويل العقار');setTs(true);setSel(null)}catch(e){setTo('خطأ: '+String(e));setTs(true)};lds('convert')(false) }
  const doDelete = async (id: number) => { if(ld('delete'))return;lds('delete')(true);try{await deleteRequest(id);setTo('تم الحذف');setTs(true);setSel(null)}catch(e){setTo('خطأ: '+String(e));setTs(true)};lds('delete')(false) }
  const sendLink=()=>{if(ld('send'))return;lds('send')(true);const p=sendPhone.replace(/\D/g,'');if(!p||p.length<10){setTo('الرجاء إدخال رقم صحيح');setTs(true);lds('send')(false);return};const wa=norm(sendPhone);const link=`${window.location.origin}/add-property`;const name=officeSettings.name||'المرقاب الذهبي';const ph=officeSettings.phone?'\n'+officeSettings.phone:'';window.open(`https://wa.me/${wa}?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته\n\nيسرنا في ${name} دعوتكم لإضافة إعلانكم العقاري عبر الرابط التالي:\n\n${link}\n\nننتظركم لنقدم لكم أفضل الخدمات العقارية\n${name}${ph}`)}`,'_blank');setTo('تم إرسال الرابط');setTs(true);lds('send')(false)}

  return <div className="flex flex-col gap-5">
    <Toast message={to} open={ts} setOpen={setTs} />

    <div className="pg-hdr">
      <div className="flex items-center justify-between">
        <h1 className="pg-title">الإعلانات</h1>
        <span className="pg-sub">{requests.length} إعلان</span>
      </div>
      <div className="gold-line" />
    </div>

    <div className="glass p-4 flex items-center gap-4 flex-wrap">
      <span className="text-xs font-bold shrink-0" style={{color:'#5C4F3E'}}>إرسال رابط إضافة إعلان:</span>
      <input className="!h-9 !text-sm flex-1 min-w-[140px] max-w-[200px]" onChange={e=>setSendPhone(e.target.value)} value={sendPhone} placeholder="05xxxxxxxx" />
        <button className="btn btn-primary btn-sm shrink-0" onClick={sendLink} disabled={ld('send')} type="button"><Send size={15} />{ld('send')?'...':'إرسال'}</button>
    </div>

    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#C5A059'}} />
        <input onChange={e=>setQ(e.target.value)} placeholder="بحث..." value={q} className="!h-9 !text-sm !pr-10" />
      </div>
      <Field label="الحالة">
        <select onChange={e=>setStf(e.target.value)} value={stf} className="!h-9 !text-sm !w-auto">
          <option value="الكل">الكل</option><option value="جديد">جديد</option><option value="مقبول">مقبول</option><option value="مرفوض">مرفوض</option><option value="مكتمل">مكتمل</option>
        </select>
      </Field>
    </div>

    {filtered.length===0
      ? <div className="text-center py-16"><ClipboardList size={48} className="mx-auto mb-4" style={{color:'#D4C5A8'}} /><p className="text-sm" style={{color:'#7A6B55'}}>لا توجد إعلانات</p></div>
      : <div className="cards-grid sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(r=>{
            const c:{[k:string]:string}={جديد:'#3D6B4F',مقبول:'#C5A059',مرفوض:'#B33A3A',مكتمل:'#5C4F3E'}
            const cb:{[k:string]:string}={جديد:'rgba(61,107,79,0.1)',مقبول:'rgba(197,160,89,0.12)',مرفوض:'rgba(179,58,58,0.1)',مكتمل:'rgba(92,79,62,0.1)'}
            return <div key={r.id} className="card-item cursor-pointer" onClick={()=>setSel(r)}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:cb[r.status]||'#F5F0E8'}}>
                    <ClipboardList size={18} style={{color:c[r.status]||'#5C4F3E'}} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{color:'#2C2418'}}>{r.clientName}</p>
                    <p className="text-xs font-medium" style={{color:'#C5A059'}}><span className="font-bold">📅</span> {r.date || 'بدون تاريخ'}</p>
                  </div>
                </div>
                <span className="badge" style={{background:cb[r.status]||'#F5F0E8',color:c[r.status]||'#5C4F3E'}}>{r.status}</span>
              </div>
              <div className="flex items-center gap-4 text-sm mb-3" style={{color:'#5C4F3E'}}>
                <span>🏷 {r.type}</span>
                {r.propertyTitle && <span>🏠 {r.propertyTitle}</span>}
                {r.propertyPrice && <span>💰 {r.propertyPrice}</span>}
              </div>
              {r.status === 'جديد' && <div className="flex items-center gap-2 pt-3 border-t border-[#F0E8D8]">
                <button className="btn btn-primary btn-sm flex-1" onClick={(e)=>{e.stopPropagation();doApprove(r.id)}} disabled={ld('approve')} type="button"><Check size={14} />{ld('approve')?'...':'قبول'}</button>
                <button className="btn btn-sm flex-1" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={(e)=>{e.stopPropagation();doReject(r.id)}} disabled={ld('reject')} type="button"><X size={14} />{ld('reject')?'...':'رفض'}</button>
              </div>}
              {r.status === 'مقبول' && <div className="flex items-center gap-2 pt-3 border-t border-[#F0E8D8]">
                <button className="btn btn-gold btn-sm flex-1" onClick={(e)=>{e.stopPropagation();doConvert(r.id)}} disabled={ld('convert')} type="button"><Home size={14} />{ld('convert')?'...':'تحويل إلى عقار'}</button>
                <button className="btn btn-sm" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={(e)=>{e.stopPropagation();doDelete(r.id)}} disabled={ld('delete')} type="button"><Trash2 size={14} />{ld('delete')?'...':'حذف'}</button>
              </div>}
              {r.status === 'مرفوض' && <div className="flex items-center gap-2 pt-3 border-t border-[#F0E8D8]">
                <button className="btn btn-sm" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={(e)=>{e.stopPropagation();doDelete(r.id)}} disabled={ld('delete')} type="button"><Trash2 size={14} />{ld('delete')?'...':'حذف'}</button>
              </div>}
            </div>
          })}
        </div>
    }

    <Modal onClose={()=>setSel(null)} open={sel!==null} title={sel?.clientName}>
      {sel && <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[{l:'النوع',v:sel.type},{l:'الحالة',v:sel.status},{l:'التاريخ',v:sel.date},{l:'الجوال',v:sel.clientPhone}].filter(x=>x.v).map(x=><div key={x.l}><span style={{color:'#5C4F3E'}}>{x.l}: </span>{x.v}</div>)}
        </div>
        {sel.propertyTitle && <><div className="h-px" style={{background:'#D4C5A8'}} />
          <div className="grid grid-cols-2 gap-3 text-sm">{[{l:'العقار',v:sel.propertyTitle},{l:'المدينة',v:sel.propertyCity},{l:'الحي',v:sel.propertyDistrict},{l:'السعر',v:sel.propertyPrice},{l:'المساحة',v:sel.propertyArea},{l:typeFieldLabels.rooms,v:sel.propertyRooms},{l:typeFieldLabels.orientation,v:sel.propertyOrientation},{l:typeFieldLabels.streetWidth,v:sel.propertyStreetWidth},{l:typeFieldLabels.floor,v:sel.propertyFloor},{l:typeFieldLabels.floors,v:sel.propertyFloors},{l:typeFieldLabels.pool,v:sel.propertyPool},{l:typeFieldLabels.finishing,v:sel.propertyFinishing},{l:typeFieldLabels.parking,v:sel.propertyParking},{l:'رابط الموقع',v:sel.propertyLocationUrl}].filter(x=>x.v).map(x=><div key={x.l}>{x.l==='رابط الموقع'?<><span style={{color:'#7A6B55'}}>{x.l}: </span><a href={x.v} target="_blank" rel="noreferrer" style={{color:'#C5A059',textDecoration:'underline',fontSize:'0.85rem'}}>{x.v}</a></>:<><span style={{color:'#5C4F3E'}}>{x.l}: </span>{x.v}</>}</div>)}</div></>}
        {sel.propertyDescription && <div className="text-sm"><span style={{color:'#5C4F3E'}}>الوصف: </span>{sel.propertyDescription}</div>}
        <PhotoGallery urls={sel.propertyPhotos} />
        {sel.status === 'جديد' && <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-sm" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={()=>doReject(sel.id)} disabled={ld('reject')} type="button"><X size={16} />{ld('reject')?'...':'رفض'}</button>
          <button className="btn btn-primary btn-sm" onClick={()=>doApprove(sel.id)} disabled={ld('approve')} type="button"><Check size={16} />{ld('approve')?'...':'قبول'}</button>
        </div>}
        {sel.status === 'مقبول' && <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-sm" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={()=>doDelete(sel.id)} disabled={ld('delete')} type="button"><Trash2 size={16} />{ld('delete')?'...':'حذف'}</button>
          <button className="btn btn-gold btn-sm" onClick={()=>doConvert(sel.id)} disabled={ld('convert')} type="button"><Home size={16} />{ld('convert')?'...':'تحويل إلى عقار'}</button>
        </div>}
        {sel.status === 'مرفوض' && <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-sm" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={()=>doDelete(sel.id)} disabled={ld('delete')} type="button"><Trash2 size={16} />{ld('delete')?'...':'حذف'}</button>
        </div>}
      </div>}
    </Modal>
  </div>
}
