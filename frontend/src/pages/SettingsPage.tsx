import { useEffect, useState } from 'react'
import { CheckCircle2, Cloud, Database, Download, Eye, EyeOff, RefreshCw, Upload, XCircle } from 'lucide-react'
import { Field, Toast } from '../components/ui'
import { useDashboard } from '../contexts/useDashboard'
import { useAuth } from '../contexts/useAuth'

const checkCloud = async () => {
  try { const key = import.meta.env.VITE_SYNC_API_KEY || 'almrqab-sync-key-2026'; const r = await fetch('/api/sync', { headers: { 'x-api-key': key } }); return r.ok } catch { return false }
}

export function SettingsPage() {
  const { clients, properties, requests, officeSettings, setOfficeSettings, resetAll, syncFromCloud, syncToCloud } = useDashboard()
  const { credentials, updateCredentials } = useAuth()
  const [tab, setTab] = useState<'عام'|'الأمان'|'السحابة'|'البيانات'>('عام')
  const [cloudStatus, setCloudStatus] = useState<{ok:boolean;msg:string}>({ok:false,msg:'جاري الفحص...'})

  useEffect(() => { checkCloud().then(ok => setCloudStatus({ok, msg: ok ? 'متصل' : 'غير متصل'})) }, [])
  const [on, setOn] = useState({ name:'', phone:'', commercial:'', tax:'', falLicense:'', crNumber:'', whatsapp:'', address:'' })
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const ld = (k: string) => loading[k] || false
  const lds = (k: string) => (v: boolean) => setLoading(p => ({ ...p, [k]: v }))
  const [pw, setPw] = useState({ old:'', new1:'', new2:'' })
  const [newUsername, setNewUsername] = useState('')
  const [show, setShow] = useState(false)
  const [to, setTo] = useState(''); const [st, setSt] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const doReset = async () => { try { await resetAll() } catch { void 0 }; setResetConfirm(false); setTo('تم إعادة التعيين'); setSt(true); setTimeout(() => window.location.reload(), 1000) }

  useEffect(() => { setOn({ name:officeSettings.name??'', phone:officeSettings.phone??'', commercial:officeSettings.commercial??'', tax:officeSettings.tax??'', falLicense:officeSettings.falLicense??'', crNumber:officeSettings.crNumber??'', whatsapp:officeSettings.whatsapp??'', address:officeSettings.address??'' }) // eslint-disable-line react-hooks/set-state-in-effect
  }, [])

  const saveSettings = async () => {
    if (ld('settings')) return; lds('settings')(true)
    try {
      await setOfficeSettings(on)
      setTo('تم حفظ الإعدادات'); setSt(true)
    } catch { setTo('فشل الحفظ'); setSt(true) }
    lds('settings')(false)
  }

  const currentPw = () => { try { const r = localStorage.getItem('dashboard_credentials'); if (r) { const p = JSON.parse(r); if (p.password) return p.password } } catch { void 0 } return 'admin' }
  const currentUser = () => { try { const r = localStorage.getItem('dashboard_credentials'); if (r) { const p = JSON.parse(r); if (p.username) return p.username } } catch { void 0 } return 'admin' }
  const saveUsername = async () => {
    if (ld('user')) return; lds('user')(true)
    if (!newUsername.trim()) { setTo('أدخل اسم مستخدم'); setSt(true); lds('user')(false); return }
    updateCredentials({ username: newUsername.trim(), password: currentPw() })
    setNewUsername('')
    await syncToCloud()
    setTo('تم حفظ اسم المستخدم'); setSt(true)
    lds('user')(false)
  }
  const changePw = async () => {
    if (ld('pw')) return; lds('pw')(true)
    if (pw.old !== currentPw()) { setTo('كلمة المرور الحالية غير صحيحة'); setSt(true); lds('pw')(false); return }
    if (pw.new1 !== pw.new2) { setTo('كلمة المرور غير متطابقة'); setSt(true); lds('pw')(false); return }
    if (pw.new1.length < 4) { setTo('قصيرة جداً'); setSt(true); lds('pw')(false); return }
    updateCredentials({ username: currentUser(), password: pw.new1 })
    setPw({old:'',new1:'',new2:''})
    await syncToCloud()
    setTo('تم تغيير كلمة المرور'); setSt(true)
    lds('pw')(false)
  }

  const backup = () => { const d = { clients, properties, requests, date:new Date().toISOString() }; const b = new Blob([JSON.stringify(d,null,2)], {type:'application/json'}); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `backup-${new Date().toISOString().slice(0,10)}.json`; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); setTimeout(() => URL.revokeObjectURL(u), 1000); setTo('تم التصدير'); setSt(true) }
  const restore = () => { const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json'; inp.onchange = async (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return; const txt = await f.text(); try { const d = JSON.parse(txt); if (d.clients && d.properties && d.requests) { localStorage.setItem('dashboard_clients', JSON.stringify(d.clients)); localStorage.setItem('dashboard_properties', JSON.stringify(d.properties)); localStorage.setItem('dashboard_requests', JSON.stringify(d.requests)); setTo('تمت الاستعادة'); setSt(true); setTimeout(() => window.location.reload(), 1000) } else { setTo('ملف غير صالح'); setSt(true) } } catch { setTo('ملف غير صالح'); setSt(true) } }; inp.click() }

  const doSyncDown = async () => {
    if (ld('sync')) return; lds('sync')(true)
    setTo('جاري السحب...'); setSt(true)
    const r = await syncFromCloud()
    setTo(r.ok ? `تم السحب (${r.count} عنصر)` : 'فشل السحب'); setSt(true)
    const ok = await checkCloud()
    setCloudStatus({ok, msg: ok ? `آخر مزامنة: ${new Date().toLocaleString('ar-SA')}` : 'غير متصل'})
    lds('sync')(false)
  }
  const doSyncUp = async () => {
    if (ld('sync')) return; lds('sync')(true)
    setTo('جاري الرفع...'); setSt(true)
    await syncToCloud()
    setTo('تم الرفع'); setSt(true)
    const ok = await checkCloud()
    setCloudStatus({ok, msg: ok ? `آخر مزامنة: ${new Date().toLocaleString('ar-SA')}` : 'غير متصل'})
    lds('sync')(false)
  }
  const tabs = ['عام','الأمان','السحابة','البيانات'] as const
  return <div className="flex flex-col gap-5">
    <Toast message={to} open={st} setOpen={setSt} />
    <div className="pg-hdr">
      <div className="flex items-center justify-between">
        <h1 className="pg-title">الإعدادات</h1>
        <span className="pg-sub">إعدادات المنصة</span>
      </div>
      <div className="gold-line" />
    </div>

    <div className="flex gap-1 rounded-xl p-1" style={{background:'#F5F0E8'}}>
      {tabs.map(t=><button key={t} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${tab===t?'bg-white shadow-sm':''}`} style={tab===t?{color:'#2C2418'}:{color:'#5C4F3E'}} onClick={()=>setTab(t)} type="button">{t}</button>)}
    </div>

    {tab==='عام' && <div className="glass p-5"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Field label="اسم المكتب"><input onChange={e=>setOn({...on,name:e.target.value})} value={on.name} /></Field>
      <Field label="الجوال"><input onChange={e=>setOn({...on,phone:e.target.value})} value={on.phone} /></Field>
      <Field label="السجل التجاري"><input onChange={e=>setOn({...on,commercial:e.target.value})} value={on.commercial} /></Field>
      <Field label="الرقم الضريبي"><input onChange={e=>setOn({...on,tax:e.target.value})} value={on.tax} /></Field>
      <Field label="ترخيص الهيئة العامة للعقار (FAL)"><input onChange={e=>setOn({...on,falLicense:e.target.value})} value={on.falLicense} placeholder="رقم الترخيص" /></Field>
      <Field label="رقم السجل التجاري (CR)"><input onChange={e=>setOn({...on,crNumber:e.target.value})} value={on.crNumber} placeholder="رقم السجل التجاري" /></Field>
      <Field label="رقم واتساب"><input onChange={e=>setOn({...on,whatsapp:e.target.value})} value={on.whatsapp} placeholder="05xxxxxxxx" /></Field>
      <Field label="العنوان"><input onChange={e=>setOn({...on,address:e.target.value})} value={on.address} placeholder="الرياض، المملكة العربية السعودية" /></Field>
    </div><div className="flex justify-end mt-5">
      <button className="btn btn-primary" onClick={saveSettings} disabled={ld('settings')} type="button"><RefreshCw size={16} />{ld('settings')?'...':'حفظ'}</button>
    </div></div>}

    {tab==='الأمان' && <div className="glass p-5 flex flex-col gap-6">
      <div><h3 className="text-sm font-bold mb-3" style={{color:'#2C2418'}}>تغيير اسم المستخدم</h3>
        <div className="flex gap-3 items-end flex-wrap"><Field label="اسم المستخدم الجديد"><input onChange={e=>setNewUsername(e.target.value)} value={newUsername} placeholder={credentials.username} /></Field>
          <button className="btn btn-primary" onClick={saveUsername} disabled={ld('user')} type="button"><RefreshCw size={16} />{ld('user')?'...':'حفظ'}</button></div></div>
      <div className="h-px" style={{background:'#E0D0B8'}} />
      <div><h3 className="text-sm font-bold mb-3" style={{color:'#2C2418'}}>تغيير كلمة المرور</h3>
        <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
          <Field label="كلمة المرور الحالية"><input onChange={e=>setPw({...pw,old:e.target.value})} type={show?'text':'password'} value={pw.old} /></Field>
          <Field label="الجديدة"><div className="relative"><input onChange={e=>setPw({...pw,new1:e.target.value})} type={show?'text':'password'} value={pw.new1} /><button className="absolute left-3 top-1/2 -translate-y-1/2" style={{color:'#7A6B55'}} onClick={()=>setShow(!show)} type="button">{show?<EyeOff size={16} />:<Eye size={16} />}</button></div></Field>
          <Field label="التأكيد"><input onChange={e=>setPw({...pw,new2:e.target.value})} type={show?'text':'password'} value={pw.new2} /></Field>
        </div><div className="flex justify-end mt-5">
          <button className="btn btn-primary" onClick={changePw} disabled={ld('pw')} type="button"><RefreshCw size={16} />{ld('pw')?'...':'حفظ'}</button></div></div>
    </div>}

    {tab==='السحابة' && <div className="glass p-5 flex flex-col gap-4">
      <div className="flex items-center gap-3 mb-2"><Cloud size={20} style={{color:'#3D6B4F'}} /><h3 className="text-sm font-bold" style={{color:'#2C2418'}}>المزامنة السحابية</h3></div>
      <div className="flex items-center gap-2 text-sm p-3 rounded-xl" style={{background:cloudStatus.ok?'rgba(61,107,79,0.08)':'rgba(179,58,58,0.08)',color:cloudStatus.ok?'#3D6B4F':'#B33A3A'}}>
        {cloudStatus.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{cloudStatus.msg}</div>
      <p className="text-xs leading-relaxed" style={{color:'#5C4F3E'}}>
        التزامن تلقائي بالكامل — أي تعديل تسويه (إضافة/تعديل/حذف عميل، عقار، طلب، إعدادات، اسم مستخدم، كلمة مرور) ينحفظ في السحابة بعد ٣ ثواني، ويظهر على جميع الأجهزة أول ما ترجع لها.<br />
        الأزرار تحت خيار يدوي للطوارئ فقط.
      </p>
      <div className="flex justify-end gap-2">
        <button className="btn btn-outline btn-sm" onClick={doSyncDown} disabled={ld('sync')} type="button"><Cloud size={14} />{ld('sync')?'...':'سحب يدوي'}</button>
        <button className="btn btn-outline btn-sm" onClick={doSyncUp} disabled={ld('sync')} type="button"><Upload size={14} />{ld('sync')?'...':'رفع يدوي'}</button>
      </div>
    </div>}

    {tab==='البيانات' && <div className="flex flex-col gap-3">
      <div className="glass p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{background:'rgba(61,107,79,0.08)'}}><Database size={18} style={{color:'#3D6B4F'}} /></div><div><div className="text-sm font-medium" style={{color:'#2C2418'}}>النسخ الاحتياطي</div><div className="text-xs" style={{color:'#5C4F3E'}}>تصدير جميع البيانات</div></div></div>
        <button className="btn btn-primary btn-sm" onClick={backup} type="button"><Download size={16} />تصدير</button></div></div>
      <div className="glass p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{background:'rgba(197,160,89,0.12)'}}><Upload size={18} style={{color:'#8B6F3A'}} /></div><div><div className="text-sm font-medium" style={{color:'#2C2418'}}>استعادة البيانات</div><div className="text-xs" style={{color:'#5C4F3E'}}>رفع ملف JSON</div></div></div>
        <button className="btn btn-outline btn-sm" onClick={restore} type="button"><Upload size={16} />استيراد</button></div></div>
      <div className="glass p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{background:'rgba(179,58,58,0.1)'}}><RefreshCw size={18} style={{color:'#B33A3A'}} /></div><div><div className="text-sm font-medium" style={{color:'#2C2418'}}>إعادة تعيين الكل</div><div className="text-xs" style={{color:'#5C4F3E'}}>حذف جميع البيانات</div></div></div>
        {resetConfirm ? <div className="flex gap-2"><button className="btn btn-outline btn-sm" onClick={()=>setResetConfirm(false)} type="button">إلغاء</button>
          <button className="btn btn-sm" style={{background:'#B33A3A',color:'white'}} onClick={doReset} type="button">تأكيد</button></div>
        : <button className="btn btn-sm" style={{background:'#B33A3A',color:'white'}} onClick={()=>setResetConfirm(true)} type="button"><RefreshCw size={16} />إعادة تعيين</button>}</div></div>
      <div className="glass p-4"><h3 className="text-sm font-bold mb-4" style={{color:'#2C2418'}}>ملخص البيانات</h3>
        <div className="grid grid-cols-3 gap-4">{[{l:'العقارات',v:properties.length},{l:'العملاء',v:clients.length},{l:'الطلبات',v:requests.length}].map(s=><div key={s.l} className="text-center p-4 rounded-xl" style={{background:'#F5F0E8'}}><div className="text-sm" style={{color:'#7A6B55'}}>{s.l}</div><div className="text-2xl font-bold mt-1" style={{color:'#2C2418'}}>{s.v}</div></div>)}</div>
      </div>
    </div>}
  </div>
}
