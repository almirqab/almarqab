import { useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Building2, ClipboardList, LayoutDashboard, LogOut, Menu, MessageSquare, RefreshCw, Search, Settings, Users, X } from 'lucide-react'
import { useAuth } from '../contexts/useAuth'
import { useDashboard } from '../contexts/useDashboard'
import { useDebounce } from '../utils/useDebounce'

const navLabels: Record<string, string> = { '/dashboard': 'الرئيسية', '/dashboard/requests': 'الإعلانات', '/dashboard/properties': 'العقارات', '/dashboard/clients': 'العملاء', '/dashboard/messages': 'التسويق', '/dashboard/settings': 'الإعدادات' }

export function DashboardLayout() {
  const { logout } = useAuth()
  const { officeSettings, requests, properties, clients, syncFromCloud } = useDashboard()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const nav = useNavigate()
  const newAdsCount = useMemo(() => requests.filter(r => r.status === 'جديد').length, [requests])
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [searchOpen, setSearchOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const searchResults = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return [] as { label: string; sub: string; to: string; icon: typeof Search }[]
    const results: { label: string; sub: string; to: string; icon: typeof Search }[] = []
    properties.filter(p => p.title.toLowerCase().includes(q) || p.city.toLowerCase().includes(q) || p.district.toLowerCase().includes(q)).slice(0, 5).forEach(p => results.push({ label: p.title, sub: `${p.city} - ${p.status}`, to: '/dashboard/properties', icon: Building2 }))
    clients.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 5).forEach(c => results.push({ label: c.name, sub: c.phone, to: '/dashboard/clients', icon: Users }))
    requests.filter(r => r.clientName.toLowerCase().includes(q) || (r.propertyTitle || '').toLowerCase().includes(q)).slice(0, 5).forEach(r => results.push({ label: r.clientName, sub: r.propertyTitle || r.type, to: '/dashboard/requests', icon: ClipboardList }))
    return results
  }, [debouncedSearch, properties, clients, requests])

  return <div className="flex h-screen overflow-hidden">
    {open && <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)} />}

    <div className={`fixed inset-y-0 right-0 z-50 w-64 text-white shadow-2xl transform transition-all duration-300 lg:relative lg:translate-x-0 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      style={{ background: 'linear-gradient(180deg, #1E3326 0%, #0F1E14 100%)' }}>
      <div className="p-7 text-center">
        <div className="mx-auto mb-3 w-14 h-14 rounded-2xl flex items-center justify-center gold-glow shadow-lg">
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <rect x="10" y="22" width="36" height="30" rx="3" fill="#2C2418"/>
            <polygon points="28,2 4,24 52,24" fill="#2C2418"/>
            <rect x="28" y="24" width="10" height="12" rx="2" fill="#C5A059"/>
            <rect x="8" y="39" width="16" height="6" rx="1" fill="#C5A059"/>
            <rect x="32" y="39" width="16" height="6" rx="1" fill="#C5A059"/>
          </svg>
        </div>
        <h1 className="text-lg font-bold" style={{color:'rgba(255,255,255,.95)'}}>{officeSettings.name || 'المرقاب الذهبي'}</h1>
        <div className="gold-line mx-auto" />
      </div>

      <nav className="px-3 space-y-0.5">
        {[
          { to: '/dashboard', icon: LayoutDashboard, label: 'الرئيسية' },
          { to: '/dashboard/requests', icon: ClipboardList, label: 'الإعلانات', badge: newAdsCount },
          { to: '/dashboard/properties', icon: Building2, label: 'العقارات' },
          { to: '/dashboard/clients', icon: Users, label: 'العملاء' },
          { to: '/dashboard/messages', icon: MessageSquare, label: 'التسويق' },
          { to: '/dashboard/settings', icon: Settings, label: 'الإعدادات' },
        ].map(l => {
          const Icon = l.icon
          const isActive = l.to === '/dashboard' ? loc.pathname === '/dashboard' : loc.pathname.startsWith(l.to)
          return <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
            className="s-link"
            style={{ color: isActive ? '#2C2418' : 'rgba(255,255,255,.65)', background: isActive ? '#C5A059' : 'transparent' }}>
            <Icon size={19} />
            <span className="flex-1">{l.label}</span>
            {l.badge ? <span className="badge" style={{background:'rgba(179,58,58,.9)',color:'white',padding:'2px 9px',fontSize:'.6875rem'}}>{l.badge}</span> : null}
          </NavLink>
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <button onClick={() => { logout(); setOpen(false) }}
          className="s-link w-full" style={{ color: 'rgba(255,255,255,.4)' }}>
          <LogOut size={18} />
          <span>تسجيل خروج</span>
        </button>
      </div>
    </div>

    <div className="flex-1 flex flex-col overflow-hidden">
      <header className="bg-white/80 backdrop-blur-md border-b border-[#E0D0B8] px-5 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[#F5F0E8] transition-all" onClick={() => setOpen(!open)}>
            {open ? <X size={18} style={{color:'#5C4F3E'}} /> : <Menu size={18} style={{color:'#5C4F3E'}} />}
          </button>
          <button onClick={() => syncFromCloud()} className="h-9 px-2.5 flex items-center gap-1.5 rounded-xl border border-[#C5A059] bg-[#C5A059]/10 hover:bg-[#C5A059]/20 transition-all text-xs font-semibold" style={{color:'#6B5B3A'}} title="تحديث">
            <RefreshCw size={14} />
            تحديث
          </button>
        </div>

        <div className="flex-1 mx-5 max-w-xs hidden md:block relative" ref={searchRef}>
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2" style={{color:'#C5A059'}} />
            <input type="text" placeholder="بحث في العقارات والعملاء..." className="!h-9 !rounded-xl !text-sm !border-[#E0D0B8] !pr-10" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true) }} onFocus={() => setSearchOpen(true)} onBlur={() => setTimeout(() => setSearchOpen(false), 200)} />
          </div>
          {searchOpen && searchResults.length > 0 && <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-[#E0D0B8] z-50 max-h-80 overflow-y-auto">
            {searchResults.map((r, i) => <button key={i} className="w-full flex items-center gap-3 px-4 py-3 text-right hover:bg-[#F5F0E8] transition-colors border-b border-[#F0E8D8] last:border-0" onMouseDown={() => { nav(r.to); setSearchQuery(''); setSearchOpen(false) }} type="button">
              <r.icon size={16} style={{color:'#C5A059'}} />
              <div className="min-w-0"><div className="text-sm font-medium truncate" style={{color:'#2C2418'}}>{r.label}</div><div className="text-xs truncate" style={{color:'#7A6B55'}}>{r.sub}</div></div>
            </button>)}
          </div>}
          {searchOpen && debouncedSearch.trim() && searchResults.length === 0 && <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-[#E0D0B8] z-50 p-4 text-center text-sm" style={{color:'#7A6B55'}}>لا توجد نتائج</div>}
        </div>

        <h2 className="text-sm font-bold hidden sm:block" style={{color:'#5C4F3E'}}>{navLabels[loc.pathname] || ''}</h2>
      </header>

      <div className="flex-1 overflow-auto p-5 sm:p-8" style={{background:'linear-gradient(135deg,#F5F0E8 0%,#EDE4D0 100%)'}}>
        <Outlet />
      </div>
    </div>
  </div>
}
