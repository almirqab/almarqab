import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Building2, CheckCircle, ClipboardList, Eye, PlusCircle, UserPlus } from 'lucide-react'
import { useDashboard } from '../contexts/useDashboard'

export function HomePage() {
  const nav = useNavigate()
  const { properties, requests, officeSettings, clients } = useDashboard()

  const stats = [
    { icon: Building2, label: 'العقارات المتاحة', value: properties.filter(p=>p.status==='متاح').length.toString(), color: '#3D6B4F' },
    { icon: ClipboardList, label: 'إعلانات جديدة', value: requests.filter(r => r.status === 'جديد').length.toString(), color: '#C5A059' },
    { icon: CheckCircle, label: 'مباع/مؤجر', value: properties.filter(p=>p.status==='تم البيع'||p.status==='تم التأجير').length.toString(), color: '#B33A3A' },
    { icon: UserPlus, label: 'إجمالي العملاء', value: clients.length.toString(), color: '#3D6B4F' },
  ]

  const reminded = useMemo(()=>clients.filter(c=>c.reminder),[clients])
  const latestRequests = [...requests].slice(0, 5)
  const typeDist = useMemo(() => {
    const dist: Record<string, number> = {}
    properties.forEach(p => { dist[p.type] = (dist[p.type] || 0) + 1 })
    return Object.entries(dist).sort((a, b) => b[1] - a[1])
  }, [properties])

  return <div className="flex flex-col gap-5">
    <div className="pg-hdr">
      <div className="flex items-center justify-between">
        <h1 className="pg-title">الرئيسية</h1>
        {officeSettings.phone && <span className="pg-sub" style={{fontSize:'.8125rem'}}>📞 {officeSettings.phone}</span>}
      </div>
      <div className="gold-line" />
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((s, i) => {
        const Icon = s.icon
        return <div key={i} className="stat" style={{background:`linear-gradient(135deg,${s.color}12,${s.color}06)`,borderColor:`${s.color}20`}}>
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{background:`${s.color}18`}}>
            <Icon size={22} style={{color:s.color}} />
          </div>
          <p className="text-3xl font-bold" style={{color:'#2C2418'}}>{s.value}</p>
          <p className="text-sm mt-1.5" style={{color:'#7A6B55'}}>{s.label}</p>
        </div>
      })}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button onClick={()=>nav('/dashboard/requests')} className="btn btn-primary text-base py-4" type="button"><Eye size={20} />عرض الإعلانات الجديدة</button>
      <button onClick={()=>nav('/dashboard/properties')} className="btn btn-gold text-base py-4" type="button"><PlusCircle size={20} />إضافة عقار</button>
      <button onClick={()=>nav('/')} className="btn btn-outline text-base py-4" type="button"><Building2 size={20} />رابط إضافة إعلان</button>
    </div>

    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2 flex flex-col gap-6">
        {reminded.length>0&&<div className="glass p-5">
          <div className="flex items-center gap-2 text-sm font-bold mb-4" style={{color:'#C5A059'}}><Bell size={16} />تذكيرات العملاء</div>
          <div className="flex flex-col gap-2">
            {reminded.map(c=>{return <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl" style={{background:'rgba(197,160,89,.08)'}}>
              <Bell size={14} className="shrink-0" style={{color:'#C5A059'}} />
              <div className="min-w-0"><p className="text-sm font-medium truncate" style={{color:'#2C2418'}}>{c.name}</p><p className="text-xs truncate" style={{color:'#7A6B55'}}>{c.reminder}</p></div>
            </div>})}
          </div>
          <button onClick={()=>nav('/dashboard/clients')} className="text-xs font-medium mt-3 border-none bg-transparent cursor-pointer" style={{color:'#3D6B4F'}} type="button">عرض الكل ←</button>
        </div>}

        <div className="glass p-5">
          <h2 className="text-sm font-bold mb-4" style={{color:'#2C2418'}}>توزيع العقارات</h2>
          {typeDist.length===0?<p className="text-xs py-6 text-center" style={{color:'#7A6B55'}}>لا توجد عقارات</p>
          :<div className="flex flex-col gap-3">{typeDist.slice(0,6).map(([type,count])=>{
            const max=Math.max(...typeDist.map(([,v])=>v),1)
            return <div key={type}><div className="flex justify-between text-xs mb-1"><span style={{color:'#2C2418'}}>{type}</span><span style={{color:'#5C4F3E'}}>{count}</span></div>
              <div className="h-2 rounded-full" style={{background:'#F0E8D8'}}><div className="h-full rounded-full" style={{width:`${(count/max)*100}%`,background:'#3D6B4F'}} /></div></div>})}</div>}
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="glass p-5">
          <h2 className="text-lg font-bold mb-5" style={{color:'#2C2418'}}>آخر الإعلانات</h2>
          {latestRequests.length === 0
            ? <p className="text-sm py-10 text-center" style={{color:'#7A6B55'}}>لا توجد طلبات</p>
            : <div className="flex flex-col gap-3">
                {latestRequests.map(r => {
                  const clr = r.status === 'جديد' ? '#C5A059' : r.status === 'مقبول' ? '#3D6B4F' : r.status === 'مرفوض' ? '#B33A3A' : '#5C4F3E'
                  return <div key={r.id} className="flex items-center gap-4 p-4 rounded-xl" style={{background:'#F5F0E8'}}>
                    <div className="w-3 h-3 rounded-full shrink-0" style={{background:clr}} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{color:'#2C2418'}}>{r.clientName}</p>
                      <p className="text-xs truncate" style={{color:'#7A6B55'}}>{r.type}{r.propertyTitle ? ` - ${r.propertyTitle}` : ''}</p>
                    </div>
                    <span className="badge text-xs" style={{background:`${clr}18`,color:clr}}>{r.status}</span>
                  </div>
                })}
              </div>
          }
        </div>
      </div>
    </div>
  </div>
}
