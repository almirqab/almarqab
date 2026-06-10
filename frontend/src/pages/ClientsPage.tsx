import { useMemo, useState } from 'react'
import { Bell, BellOff, MessageSquareText, Plus, Search, Trash2, User } from 'lucide-react'
import { Field, Modal, Toast } from '../components/ui'
import { useDashboard } from '../contexts/useDashboard'
import { useDebounce } from '../utils/useDebounce'
import type { ClientItem } from '../types/dashboard'

function norm(p:string){const d=p.replace(/\D/g,'');if(d.startsWith('966'))return d;if(d.startsWith('05'))return `966${d.slice(1)}`;if(d.startsWith('5')&&d.length===9)return `966${d}`;return d}

export function ClientsPage() {
  const {clients,addClient,deleteClient,updateClient,officeSettings}=useDashboard()
  const [q,setQ]=useState('');const[open,setOpen]=useState(false);const[edit,setEdit]=useState<ClientItem|null>(null)
  const [f,setF]=useState({name:'',phone:'',type:'مشتري'as string,notes:'',reminder:''});const[to,setTo]=useState('');const[st,setSt]=useState(false)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const ld = (k: string) => loading[k] || false
  const lds = (k: string) => (v: boolean) => setLoading(p => ({ ...p, [k]: v }))
  const debouncedQ = useDebounce(q, 300)
  const filtered=clients.filter(c=>{if(!debouncedQ.trim())return true;const l=debouncedQ.trim().toLowerCase();return c.name.toLowerCase().includes(l)||c.phone.includes(l)})
  const reminded=useMemo(()=>clients.filter(c=>c.reminder).reverse(),[clients])
  const reset=()=>{setF({name:'',phone:'',type:'مشتري',notes:'',reminder:''});setEdit(null)}
  const save=async()=>{if(ld('save'))return;lds('save')(true);if(!f.name.trim()||!f.phone.trim()){lds('save')(false);return};try{if(edit){await updateClient(edit.id,{name:f.name.trim(),phone:f.phone.trim(),type:f.type,notes:f.notes.trim(),reminder:f.reminder.trim()||undefined});setTo('تم التحديث')}else{await addClient({name:f.name.trim(),phone:f.phone.trim(),type:f.type,notes:f.notes.trim(),reminder:f.reminder.trim()||undefined});setTo('تمت الإضافة')};setSt(true);setOpen(false);reset()}catch{setTo('فشل العملية');setSt(true)};lds('save')(false)}

  return <div className="flex flex-col gap-5">
    <Toast message={to} open={st} setOpen={setSt} />

    <div className="pg-hdr">
      <div className="flex items-center justify-between">
        <h1 className="pg-title">العملاء</h1>
        <span className="pg-sub">{clients.length} عميل</span>
      </div>
      <div className="gold-line" />
    </div>

    {reminded.length>0&&<div className="glass p-4">
      <div className="flex items-center gap-2 text-sm font-bold mb-3" style={{color:'#C5A059'}}><Bell size={16} />تذكيرات</div>
      <div className="flex flex-col gap-2">
        {reminded.map(c=><div key={c.id} className="flex items-center justify-between p-3 rounded-xl" style={{background:'rgba(197,160,89,0.08)'}}>
          <div className="flex items-center gap-3 min-w-0"><Bell size={14} className="shrink-0" style={{color:'#C5A059'}} /><div className="min-w-0"><p className="text-sm font-medium truncate" style={{color:'#2C2418'}}>{c.name}</p><p className="text-xs truncate" style={{color:'#7A6B55'}}>{c.reminder}</p></div></div>
          <button className="btn btn-ghost btn-sm" onClick={async()=>{if(ld('rem'))return;lds('rem')(true);try{await updateClient(c.id,{reminder:undefined});setTo('تم إزالة التذكير');setSt(true)}catch{setTo('فشل إزالة التذكير');setSt(true)};lds('rem')(false)}} disabled={ld('rem')} type="button"><BellOff size={14} /></button>
        </div>)}
      </div>
    </div>}

    <div className="flex items-center gap-3 flex-wrap">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#C5A059'}} />
        <input onChange={e=>setQ(e.target.value)} placeholder="بحث..." value={q} className="!h-9 !text-sm !pr-10" />
      </div>
      <button className="btn btn-primary" onClick={()=>{reset();setOpen(true)}} type="button"><Plus size={16} />إضافة عميل</button>
    </div>

    {filtered.length===0
      ? <div className="text-center py-16"><User size={48} className="mx-auto mb-4" style={{color:'#D4C5A8'}} /><p className="text-sm" style={{color:'#7A6B55'}}>لا يوجد عملاء</p></div>
      : <div className="cards-grid sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(c=><div key={c.id} className="card-item">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{background:c.type==='مستثمر'?'rgba(197,160,89,.1)':'rgba(61,107,79,.1)'}}><User size={18} style={{color:c.type==='مستثمر'?'#8B6F3A':'#3D6B4F'}} /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate" style={{color:'#2C2418'}}>{c.name}</p><p className="text-xs font-mono" dir="ltr" style={{color:'#7A6B55'}}>{c.phone}</p></div>
              <span className="badge shrink-0" style={{background:c.type==='مستثمر'?'rgba(197,160,89,0.12)':'rgba(61,107,79,0.08)',color:c.type==='مستثمر'?'#8B6F3A':'#3D6B4F'}}>{c.type}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mb-3" style={{color:'#5C4F3E'}}>
              <div><span style={{color:'#7A6B55'}}>ملاحظات: </span>{c.notes||'-'}</div>
              <div><span style={{color:'#7A6B55'}}>تذكير: </span>{c.reminder?<span style={{color:'#C5A059'}}><Bell size={12} className="inline" /> {c.reminder}</span>:'—'}</div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-[#F0E8D8]">
              <a href={`https://wa.me/${norm(c.phone)}?text=${encodeURIComponent(`السلام عليكم ورحمة الله وبركاته\n\n${officeSettings.name||'المرقاب الذهبي'}🌐\nنتشرف بخدمتكم في المجال العقاري\nللتواصل والاستفسار${officeSettings.phone?`\n📞 ${officeSettings.phone}`:''}`)}`} target="_blank" className="btn btn-ghost btn-sm flex-1" rel="noreferrer"><MessageSquareText size={14} />واتساب</a>
              <button className="btn btn-outline btn-sm flex-1" onClick={()=>{setEdit(c);setF({name:c.name,phone:c.phone,type:c.type,notes:c.notes,reminder:c.reminder||''});setOpen(true)}} type="button">تعديل</button>
              <button className="btn btn-sm shrink-0" style={{background:'rgba(179,58,58,.1)',color:'#B33A3A'}} onClick={async()=>{if(ld('del'))return;lds('del')(true);try{await deleteClient(c.id);setTo('تم الحذف');setSt(true)}catch{setTo('فشل الحذف');setSt(true)};lds('del')(false)}} disabled={ld('del')} type="button"><Trash2 size={14} /></button>
            </div>
          </div>)}
        </div>
    }

    <Modal onClose={()=>{setOpen(false);reset()}} open={open} title={edit?'تعديل عميل':'إضافة عميل'}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الاسم"><input onChange={e=>setF({...f,name:e.target.value})} value={f.name} /></Field>
          <Field label="الجوال"><input onChange={e=>setF({...f,phone:e.target.value})} value={f.phone} placeholder="05xxxxxxxx" /></Field>
        </div>
        <Field label="النوع"><select onChange={e=>setF({...f,type:e.target.value})} value={f.type}><option value="مشتري">مشتري</option><option value="مستأجر">مستأجر</option><option value="مستثمر">مستثمر</option><option value="بائع">بائع</option></select></Field>
        <Field label="ملاحظات"><textarea onChange={e=>setF({...f,notes:e.target.value})} value={f.notes} /></Field>
        <Field label="تذكير"><textarea onChange={e=>setF({...f,reminder:e.target.value})} value={f.reminder} placeholder="مثال: الاتصال بعد أسبوع" /></Field>
        <div className="flex justify-end gap-2 mt-2">
          <button className="btn btn-outline btn-sm" onClick={()=>{setOpen(false);reset()}} type="button">إلغاء</button>
          <button className="btn btn-primary btn-sm" onClick={save} disabled={ld('save')} type="button">{ld('save')?'...':(edit?'حفظ':'إضافة')}</button>
        </div>
      </div>
    </Modal>
  </div>
}
