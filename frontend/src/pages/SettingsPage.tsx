import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Cloud, Database, Download, Eye, EyeOff, RefreshCw, Shield, Upload, XCircle } from 'lucide-react'
import { Field, Toast } from '../components/ui'
import { useDashboard } from '../contexts/useDashboard'
import { useAuth } from '../contexts/useAuth'

const checkCloud = async () => {
  try { const key = import.meta.env.VITE_SYNC_API_KEY || ''; const r = await fetch(`/api/sync?_=${Date.now()}`, { headers: { 'x-api-key': key }, cache: 'no-store' }); if (!r.ok) return null; const d = await r.json(); return d.data ? { ok: true, version: d.data.version, clients: d.data.clients?.length ?? 0, properties: d.data.properties?.length ?? 0, requests: d.data.requests?.length ?? 0 } : { ok: true, version: 0, clients: 0, properties: 0, requests: 0 } } catch { return null }
}

export function SettingsPage() {
  const { clients, properties, requests, officeSettings, setOfficeSettings, resetAll, syncFromCloud, syncToCloud, cloudInfo, forcePushToCloud, forcePullFromCloud } = useDashboard()
  const { credentials, updateCredentials } = useAuth()
  const [tab, setTab] = useState<'عام'|'الأمان'|'السحابة'|'البيانات'>('عام')
  const [cloudStatus, setCloudStatus] = useState<{ok:boolean;msg:string}>({ok:false,msg:'جاري الفحص...'})

  useEffect(() => { checkCloud().then(r => { if (r) { setCloudStatus({ok: true, msg: `متصل (v${r.version}) — السحابة: ${r.clients} عميل، ${r.properties} عقار، ${r.requests} طلب`}) } else { setCloudStatus({ok: false, msg: 'غير متصل'}) } }) }, [])
  const [on, setOn] = useState({ name:'', phone:'', commercial:'', tax:'', falLicense:'', crNumber:'', whatsapp:'', address:'', showPublicProperties: true })
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const ld = (k: string) => loading[k] || false
  const lds = (k: string) => (v: boolean) => setLoading(p => ({ ...p, [k]: v }))
  const [pw, setPw] = useState({ old:'', new1:'', new2:'' })
  const [newUsername, setNewUsername] = useState('')
  const [show, setShow] = useState(false)
  const [to, setTo] = useState(''); const [st, setSt] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [forcePushConfirm, setForcePushConfirm] = useState(false)
  const [forcePullConfirm, setForcePullConfirm] = useState(false)
  const doReset = async () => { try { await resetAll() } catch { void 0 }; setResetConfirm(false); setTo('تم إعادة التعيين'); setSt(true); setTimeout(() => window.location.reload(), 1000) }

  useEffect(() => { setOn({ name:officeSettings.name??'', phone:officeSettings.phone??'', commercial:officeSettings.commercial??'', tax:officeSettings.tax??'', falLicense:officeSettings.falLicense??'', crNumber:officeSettings.crNumber??'', whatsapp:officeSettings.whatsapp??'', address:officeSettings.address??'', showPublicProperties:officeSettings.showPublicProperties !== false }) // eslint-disable-line react-hooks/set-state-in-effect
  }, [officeSettings])

  const saveSettings = async () => {
    if (ld('settings')) return; lds('settings')(true)
    try {
      await setOfficeSettings(on)
      setTo('تم حفظ الإعدادات'); setSt(true)
    } catch { setTo('فشل الحفظ'); setSt(true) }
    lds('settings')(false)
  }

  const getStoredCreds = () => { try { const r = localStorage.getItem('dashboard_credentials'); if (r) return JSON.parse(r) } catch { void 0 } return null }
  const currentUser = () => { const c = getStoredCreds(); return c?.username || 'admin' }
  const saveUsername = async () => {
    if (ld('user')) return; lds('user')(true)
    if (!newUsername.trim()) { setTo('أدخل اسم مستخدم'); setSt(true); lds('user')(false); return }
    const existing = getStoredCreds() || { passwordHash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' }
    localStorage.setItem('dashboard_credentials', JSON.stringify({ username: newUsername.trim(), passwordHash: existing.passwordHash || existing.password }))
    window.dispatchEvent(new Event('creds-changed'))
    setNewUsername('')
    await syncToCloud()
    setTo('تم حفظ اسم المستخدم'); setSt(true)
    lds('user')(false)
  }
  const hashPw = async (pw: string) => { const e = new TextEncoder(); const d = e.encode(pw); const h = await crypto.subtle.digest('SHA-256', d); return Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join('') }
  const changePw = async () => {
    if (ld('pw')) return; lds('pw')(true)
    const storedHash = getStoredCreds()?.passwordHash || getStoredCreds()?.password || '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918'
    const oldHash = await hashPw(pw.old)
    if (oldHash !== storedHash) { setTo('كلمة المرور الحالية غير صحيحة'); setSt(true); lds('pw')(false); return }
    if (pw.new1 !== pw.new2) { setTo('كلمة المرور غير متطابقة'); setSt(true); lds('pw')(false); return }
    if (pw.new1.length < 4) { setTo('قصيرة جداً'); setSt(true); lds('pw')(false); return }
    await updateCredentials({ username: currentUser(), password: pw.new1 })
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
    const ck = await checkCloud()
    if (ck) { setCloudStatus({ok: true, msg: `آخر مزامنة: ${new Date().toLocaleString('ar-SA')} — السحابة: ${ck.clients} عميل، ${ck.properties} عقار، ${ck.requests} طلب`}) } else { setCloudStatus({ok: false, msg: 'غير متصل'}) }
    lds('sync')(false)
  }
  const doSyncUp = async () => {
    if (ld('sync')) return; lds('sync')(true)
    setTo('جاري الرفع...'); setSt(true)
    await syncToCloud()
    setTo('تم الرفع'); setSt(true)
    const ck = await checkCloud()
    if (ck) { setCloudStatus({ok: true, msg: `آخر مزامنة: ${new Date().toLocaleString('ar-SA')} — السحابة: ${ck.clients} عميل، ${ck.properties} عقار، ${ck.requests} طلب`}) } else { setCloudStatus({ok: false, msg: 'غير متصل'}) }
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
    </div>
      <div className="flex items-center justify-between p-4 rounded-xl mt-4" style={{background:'rgba(61,107,79,0.05)'}}>
        <div><p className="text-sm font-medium" style={{color:'#2C2418'}}>عرض العقارات للعامة</p><p className="text-xs" style={{color:'#7A6B55'}}>إظهار/إخفاء صفحة العقارات المتاحة /properties</p></div>
        <button onClick={()=>setOn({...on,showPublicProperties:!on.showPublicProperties})} className="relative w-12 h-6 rounded-full transition-all" style={{background:on.showPublicProperties ? '#3D6B4F' : '#C5B8A0'}} type="button">
          <div className="absolute w-5 h-5 rounded-full bg-white shadow-sm transition-all" style={{top:'2px', [on.showPublicProperties ? 'right' : 'left']:'2px'}} />
        </button>
      </div>
    <div className="flex justify-end mt-5">
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

      {/* Connection status */}
      <div className="flex items-center gap-2 text-sm p-3 rounded-xl" style={{background:cloudStatus.ok?'rgba(61,107,79,0.08)':'rgba(179,58,58,0.08)',color:cloudStatus.ok?'#3D6B4F':'#B33A3A'}}>
        {cloudStatus.ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}{cloudStatus.msg}</div>

      {/* Local data summary */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[{l:'العملاء',v:clients.length},{l:'العقارات',v:properties.length},{l:'الطلبات',v:requests.length}].map(s=><div key={s.l} className="p-2 rounded-lg text-xs" style={{background:'#F5F0E8',color:'#5C4F3E'}}><span className="block font-bold text-sm" style={{color:'#2C2418'}}>{s.v}</span>{s.l}</div>)}
      </div>

      {/* Last sync info */}
      {cloudInfo.lastSync && <div className="text-xs p-2 rounded-lg" style={{background:'rgba(61,107,79,0.05)',color:'#5C4F3E'}}>
        آخر مزامنة: {new Date(cloudInfo.lastSync).toLocaleString('ar-SA')}<br />
        {cloudInfo.lastResult}
      </div>}

      {cloudInfo.pushing && <div className="text-xs p-2 rounded-lg" style={{background:'rgba(197,160,89,0.1)',color:'#8B6F3A'}}>جاري المزامنة...</div>}

      <p className="text-xs leading-relaxed" style={{color:'#5C4F3E'}}>
        التزامن تلقائي بالكامل — أي تعديل تسويه ينحفظ في السحابة ويظهر على جميع الأجهزة.
        الأزرار تحت خيار يدوي للطوارئ فقط.
      </p>

      {/* Normal sync buttons */}
      <div className="flex justify-end gap-2">
        <button className="btn btn-outline btn-sm" onClick={doSyncDown} disabled={ld('sync') || cloudInfo.pushing} type="button"><Cloud size={14} />{ld('sync')?'...':'سحب يدوي'}</button>
        <button className="btn btn-outline btn-sm" onClick={doSyncUp} disabled={ld('sync') || cloudInfo.pushing} type="button"><Upload size={14} />{ld('sync')?'...':'رفع يدوي'}</button>
      </div>

      {/* Force sync section */}
      <div className="h-px" style={{background:'#E0D0B8'}} />
      <div className="flex items-center gap-2"><Shield size={16} style={{color:'#8B6F3A'}} /><span className="text-xs font-bold" style={{color:'#8B6F3A'}}>خيارات متقدمة — استخدم فقط في حال الضرورة</span></div>
      <div className="flex justify-end gap-2">
        {forcePullConfirm
          ? <div className="flex gap-2 items-center"><span className="text-xs" style={{color:'#B33A3A'}}>استبدال كل البيانات المحلية?</span><button className="btn btn-outline btn-sm" onClick={()=>setForcePullConfirm(false)} type="button">إلغاء</button><button className="btn btn-sm" style={{background:'#8B6F3A',color:'white'}} onClick={async()=>{setForcePullConfirm(false);if(ld('sync'))return;lds('sync')(true);setTo('جاري السحب القسري...');setSt(true);const r=await forcePullFromCloud();setTo(r.ok?`تم السحب القسري (${r.count} عنصر)`:'فشل السحب');setSt(true);lds('sync')(false)}} type="button">تأكيد</button></div>
          : <button className="btn btn-outline btn-sm" onClick={()=>setForcePullConfirm(true)} disabled={ld('sync')} type="button"><AlertTriangle size={14} />سحب قسري (استبدال كامل)</button>}
        {forcePushConfirm
          ? <div className="flex gap-2 items-center"><span className="text-xs" style={{color:'#B33A3A'}}>استبدال بيانات السحابة?</span><button className="btn btn-outline btn-sm" onClick={()=>setForcePushConfirm(false)} type="button">إلغاء</button><button className="btn btn-sm" style={{background:'#8B6F3A',color:'white'}} onClick={async()=>{setForcePushConfirm(false);if(ld('sync'))return;lds('sync')(true);setTo('جاري الرفع القسري...');setSt(true);const ok=await forcePushToCloud();setTo(ok?'تم رفع جميع البيانات' : 'فشل الرفع');setSt(true);lds('sync')(false);if(ok){const ck=await checkCloud();setCloudStatus({ok:!!ck,msg:ck?`متصل (v${ck.version})`:'غير متصل'})}}} type="button">تأكيد</button></div>
          : <button className="btn btn-outline btn-sm" onClick={()=>setForcePushConfirm(true)} disabled={ld('sync')} type="button"><AlertTriangle size={14} />رفع قسري (استبدال كامل)</button>}
        <div className="text-xs mt-2" style={{color:'#7A6B55'}}>المزامنة التلقائية كل ٨ ثواني — أي تعديل يظهر على جميع الأجهزة خلال ثوان</div>
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
