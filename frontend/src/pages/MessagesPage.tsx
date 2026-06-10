import { useMemo, useState } from 'react'
import { Building2, MapPin, Phone, Send } from 'lucide-react'
import { Field, Toast } from '../components/ui'
import { useDashboard } from '../contexts/useDashboard'

function norm(p:string){const d=p.replace(/\D/g,'');if(d.startsWith('966'))return d;if(d.startsWith('05'))return `966${d.slice(1)}`;if(d.startsWith('5')&&d.length===9)return `966${d}`;return d}

export function MessagesPage() {
  const {properties,officeSettings}=useDashboard()
  const [sel,setSel]=useState<number|null>(null);const[msg,setMsg]=useState('');const[phone,setPhone]=useState('');const[to,setTo]=useState('');const[ts,setTs]=useState(false)
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const ld = (k: string) => loading[k] || false
  const lds = (k: string) => (v: boolean) => setLoading(p => ({ ...p, [k]: v }))
  const avail=useMemo(()=>properties.filter(p=>p.status==='متاح'),[properties])
  const cur=useMemo(()=>avail.find(p=>p.id===sel)??null,[avail,sel])

  const propDetails = (p: typeof avail[0]) => {
    const name=officeSettings.name||'المرقاب الذهبي'
    const ph=officeSettings.phone?`\n📞 ${officeSettings.phone}`:''
    return `السلام عليكم ورحمة الله وبركاته\n\nيسرنا في ${name} أن نعرض عليكم العقار التالي:\n\n🏠 ${p.title}\n📍 ${p.district}، ${p.city}\n🏷️ النوع: ${p.type}\n💰 السعر: ${p.price}\n📐 المساحة: ${p.area}${p.rooms?`\n🛏️ عدد الغرف: ${p.rooms}`:''}${p.floor?`\n🏢 الدور: ${p.floor}`:''}${p.floors?`\n🏗️ عدد الأدوار: ${p.floors}`:''}${p.orientation?`\n🧭 الواجهة: ${p.orientation}`:''}${p.streetWidth?`\n🛣️ عرض الشارع: ${p.streetWidth} م`:''}${p.pool?`\n🏊 المسبح: ${p.pool}`:''}${p.finishing?`\n🔨 التشطيب: ${p.finishing}`:''}${p.parking?`\n🚗 مواقف: ${p.parking}`:''}${p.locationUrl?`\n🔗 رابط الموقع: ${p.locationUrl}`:''}${p.description?`\n\n${p.description}`:''}\n\nللتواصل والاستفسار:\n${name}${ph}`
  }

  const sendTo = () => {
    if(ld('send'))return;lds('send')(true)
    if(!cur||!phone.trim()){lds('send')(false);return}
    const num = norm(phone)
    const text = encodeURIComponent(msg.trim() || propDetails(cur))
    window.open(`https://wa.me/${num}?text=${text}`,'_blank')
    setTo('تم الإرسال');setTs(true)
    lds('send')(false)
  }

  const fillMsg = () => { if(!cur)return; setMsg(propDetails(cur)) }

  return <div className="flex flex-col gap-5">
    <Toast message={to} open={ts} setOpen={setTs} />
    <div className="pg-hdr">
      <div className="flex items-center justify-between">
        <h1 className="pg-title">التسويق</h1>
        <span className="pg-sub">إرسال بيانات العقار عبر واتساب</span>
      </div>
      <div className="gold-line" />
    </div>

    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="glass p-4"><h3 className="text-sm font-bold mb-4" style={{color:'#2C2418'}}>العقارات المتاحة</h3>
          {avail.length===0?<div className="py-12 text-center text-sm" style={{color:'#7A6B55'}}>لا توجد عقارات متاحة</div>
          :<div className="flex flex-col gap-2">{avail.map(p=><button key={p.id} className={`w-full text-right rounded-xl p-3 transition border-2 ${sel===p.id ? '' : 'border-transparent hover:bg-[#F5F0E8]'}`} style={sel===p.id?{borderColor:'#C5A059',background:'rgba(197,160,89,0.12)'}:{}} onClick={()=>setSel(p.id)} type="button">
            <div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{background:'rgba(61,107,79,0.08)'}}><Building2 size={16} style={{color:'#3D6B4F'}} /></div>
              <div><div className="text-sm font-medium" style={{color:'#2C2418'}}>{p.title}</div><div className="text-xs" style={{color:'#5C4F3E'}}><MapPin size={11} className="inline" /> {p.district}</div>
                <div className="flex gap-2 mt-1"><span className="badge" style={{background:'rgba(61,107,79,0.08)',color:'#3D6B4F'}}>{p.type}</span>{p.ownerName?<span className="text-xs" style={{color:'#7A6B55'}}>{p.ownerName}</span>:null}</div></div></div>
          </button>)}</div>}
        </div>
      </div>

      <div className="lg:col-span-3">
        {!cur?<div className="glass p-5"><div className="flex flex-col items-center py-16 text-sm" style={{color:'#7A6B55'}}><Building2 size={36} className="mb-3" style={{color:'#D4C5A8'}} /><p>اختر عقاراً للبدء</p></div></div>
        :<div className="glass p-5">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div><h3 className="text-lg font-bold" style={{color:'#2C2418'}}>{cur.title}</h3><p className="text-sm mt-1" style={{color:'#5C4F3E'}}><MapPin size={13} className="inline" /> {cur.district}، {cur.city}</p></div>
            <span className="badge" style={{background:'rgba(61,107,79,0.1)',color:'#3D6B4F'}}>{cur.status}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">{[{l:'السعر',v:cur.price},{l:'المساحة',v:cur.area},{l:'النوع',v:cur.type},{l:'الغرف',v:cur.rooms||'-'},{l:'الأدوار',v:cur.floors||cur.floor||'-'},{l:'المالك',v:cur.ownerName}].map(s=><div key={s.l} className="p-3 rounded-xl" style={{background:'#F5F0E8'}}><div className="text-xs" style={{color:'#7A6B55'}}>{s.l}</div><div className="text-sm font-bold mt-0.5" style={{color:'#2C2418'}}>{s.v}</div></div>)}</div>
          {cur.orientation && <span className="badge ml-2" style={{background:'rgba(197,160,89,0.12)',color:'#8B6F3A'}}>{cur.orientation}</span>}
          {cur.streetWidth && <span className="badge ml-2" style={{background:'rgba(61,107,79,0.1)',color:'#3D6B4F'}}>عرض الشارع {cur.streetWidth}م</span>}
          {cur.finishing && <span className="badge ml-2" style={{background:'rgba(61,107,79,0.1)',color:'#3D6B4F'}}>{cur.finishing}</span>}
          {cur.pool && <span className="badge ml-2" style={{background:'rgba(197,160,89,0.12)',color:'#8B6F3A'}}>{cur.pool}</span>}
          {cur.parking && <span className="badge ml-2" style={{background:'rgba(61,107,79,0.1)',color:'#3D6B4F'}}>مواقف: {cur.parking}</span>}
          {cur.locationUrl && <div className="mt-3 text-sm"><span style={{color:'#7A6B55'}}>رابط الموقع: </span><a href={cur.locationUrl} target="_blank" rel="noreferrer" style={{color:'#C5A059',textDecoration:'underline',fontSize:'0.85rem'}}>{cur.locationUrl}</a></div>}

          <Field label="رقم الجوال المستلم *"><div className="relative"><Phone size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#C5A059'}} /><input onChange={e=>setPhone(e.target.value)} placeholder="05xxxxxxxx" value={phone} className="!pr-10" /></div></Field>
          <Field label="نص الرسالة"><textarea className="!min-h-[120px]" onChange={e=>setMsg(e.target.value)} placeholder="اكتب رسالتك..." value={msg} /></Field>
          <div className="flex gap-3 mt-3">
            <button className="btn btn-outline btn-sm" onClick={fillMsg} type="button"><Building2 size={14} />تعبئة بيانات العقار</button>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn btn-primary" disabled={!phone.trim()||ld('send')} onClick={sendTo} type="button"><Send size={16} />{ld('send')?'...':'إرسال عبر واتساب'}</button>
          </div>
        </div>}
      </div>
    </div>
  </div>
}
