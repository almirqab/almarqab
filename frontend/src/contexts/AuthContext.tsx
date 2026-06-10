import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

const SESSION_DURATION = 12 * 60 * 60 * 1000 // 12 hours

interface SessionData {
  authenticated: boolean
  expiresAt: number
}

function loadCredentials(): { username: string; password: string } {
  try {
    const stored = localStorage.getItem('dashboard_credentials')
    if (stored) { const p = JSON.parse(stored); if (p.username && p.password) return p }
  } catch { void 0 }
  return { username: 'admin', password: 'admin' }
}

function loadSession(): SessionData {
  try {
    const raw = sessionStorage.getItem('dashboard_auth')
    if (raw) {
      const s = JSON.parse(raw) as SessionData
      if (s.authenticated && s.expiresAt > Date.now()) return s
    }
  } catch { void 0 }
  return { authenticated: false, expiresAt: 0 }
}

function saveSession() {
  try {
    sessionStorage.setItem('dashboard_auth', JSON.stringify({ authenticated: true, expiresAt: Date.now() + SESSION_DURATION }))
  } catch { void 0 }
}

function clearSession() {
  try { sessionStorage.removeItem('dashboard_auth') } catch { void 0 }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = loadSession()
  const [isAuthenticated, setIsAuthenticated] = useState(session.authenticated)
  const [credentials, setCredentials] = useState(loadCredentials)

  useEffect(() => {
    const h = () => setCredentials(loadCredentials())
    const f = () => { setIsAuthenticated(false); clearSession() }
    window.addEventListener('creds-changed', h)
    window.addEventListener('force-logout', f)
    // Check session expiry every minute
    const id = setInterval(() => {
      const s = loadSession()
      if (!s.authenticated) { setIsAuthenticated(false); clearSession() }
    }, 60000)
    return () => { window.removeEventListener('creds-changed', h); window.removeEventListener('force-logout', f); clearInterval(id) }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      credentials,
      login: (username: string, password: string) => {
        const creds = loadCredentials()
        if (username === creds.username && password === creds.password) {
          setIsAuthenticated(true)
          saveSession()
          return true
        }
        return false
      },
      logout: () => {
        setIsAuthenticated(false)
        clearSession()
      },
      updateCredentials: (creds) => {
        localStorage.setItem('dashboard_credentials', JSON.stringify(creds))
        setCredentials(creds)
      },
    }),
    [isAuthenticated, credentials],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
