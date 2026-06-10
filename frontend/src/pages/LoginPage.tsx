import { useState } from 'react'
import { Lock, LogIn } from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { useNavigate } from 'react-router-dom'
import { WelcomeSplash } from '../components/WelcomeSplash'

export function LoginPage() {
  const { login } = useAuth()
  const nav = useNavigate()
  const [u, setU] = useState(''); const [p, setP] = useState(''); const [e, setE] = useState('')
  const [splash, setSplash] = useState(false)

  const h = (e2: React.FormEvent) => {
    e2.preventDefault()
    if (!u.trim() || !p.trim()) { setE('يرجى إدخال اسم المستخدم وكلمة المرور'); return }
    setE('')
    if (login(u.trim(), p.trim())) setSplash(true)
    else setE('اسم المستخدم أو كلمة المرور غير صحيحة')
  }

  if (splash) return <WelcomeSplash onDone={() => nav('/dashboard')} />

  return <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3D6B4F 0%, #1A2E20 100%)' }}>
    <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 25% 25%, #C5A059 1px, transparent 1px), radial-gradient(circle at 75% 75%, #C5A059 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

    <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-10 sm:p-12 w-full max-w-md relative">
      <div className="text-center mb-8">
        <div className="mx-auto mb-5 w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #C5A059 0%, #A8883A 100%)' }}>
          <svg width="44" height="44" viewBox="0 0 56 56" fill="none">
            <rect x="10" y="22" width="36" height="30" rx="3" fill="#2C2418"/>
            <polygon points="28,2 4,24 52,24" fill="#2C2418"/>
            <rect x="28" y="24" width="10" height="12" rx="2" fill="#C5A059"/>
            <rect x="8" y="39" width="16" height="6" rx="1" fill="#C5A059"/>
            <rect x="32" y="39" width="16" height="6" rx="1" fill="#C5A059"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold" style={{ color: '#2C2418' }}>المرقاب الذهبي</h1>
        <p className="text-base mt-2" style={{ color: '#7A6B55' }}>للخدمات العقارية</p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={h}>
        {e && <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-2xl px-5 py-3.5">{e}</div>}
        <div>
          <label className="text-sm font-bold mb-2 block" style={{ color: '#5C4F3E' }}>اسم المستخدم</label>
          <div className="relative">
            <LogIn size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C5A059' }} />
            <input onChange={e2 => setU(e2.target.value)} value={u} className="pr-12 h-12 rounded-2xl border-2 text-sm" style={{ borderColor: '#E5D3B3' }} />
          </div>
        </div>
        <div>
          <label className="text-sm font-bold mb-2 block" style={{ color: '#5C4F3E' }}>كلمة المرور</label>
          <div className="relative">
            <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#C5A059' }} />
            <input onChange={e2 => setP(e2.target.value)} placeholder="••••••" type="password" value={p} className="pr-12 h-12 rounded-2xl border-2 text-sm" style={{ borderColor: '#E5D3B3' }} />
          </div>
        </div>
        <button className="btn btn-primary w-full text-base py-4 mt-2" type="submit">تسجيل الدخول</button>
      </form>

      <div className="mt-8 pt-6 text-center border-t" style={{ borderColor: '#F0E8D8' }}>
        <p className="text-xs" style={{ color: '#B0A090' }}>© {new Date().getFullYear()} المرقاب الذهبي - جميع الحقوق محفوظة</p>
      </div>
    </div>
  </div>
}
