import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AuthContext } from './auth-context'
import type { AuthContextValue } from './auth-context'

const SESSION_DURATION = 12 * 60 * 60 * 1000

interface SessionData {
  authenticated: boolean
  expiresAt: number
}

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD_HASH = '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918' // SHA-256 of 'admin'

function loadCredentials(): { username: string; passwordHash: string } {
  try {
    const stored = localStorage.getItem('dashboard_credentials')
    if (stored) {
      const p = JSON.parse(stored)
      if (p.username && p.passwordHash) return { username: p.username, passwordHash: p.passwordHash }
      // legacy: old format stored plaintext password; migrate in login()
      if (p.username && p.password) return { username: p.username, passwordHash: p.password }
    }
  } catch { void 0 }
  return { username: DEFAULT_USERNAME, passwordHash: DEFAULT_PASSWORD_HASH }
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
    const id = setInterval(() => {
      const s = loadSession()
      if (!s.authenticated) { setIsAuthenticated(false); clearSession() }
    }, 60000)
    return () => { window.removeEventListener('creds-changed', h); window.removeEventListener('force-logout', f); clearInterval(id) }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      credentials: { username: credentials.username, password: credentials.passwordHash },
      login: async (username: string, password: string) => {
        const creds = loadCredentials()
        if (username === creds.username) {
          const inputHash = await sha256(password)
          if (inputHash === creds.passwordHash) {
            setIsAuthenticated(true)
            saveSession()
            return true
          }
          // legacy: stored value is plaintext password (old format)
          if (password === creds.passwordHash) {
            const hash = await sha256(password)
            localStorage.setItem('dashboard_credentials', JSON.stringify({ username: creds.username, passwordHash: hash }))
            setCredentials({ username: creds.username, passwordHash: hash })
            setIsAuthenticated(true)
            saveSession()
            return true
          }
        }
        return false
      },
      logout: () => {
        setIsAuthenticated(false)
        clearSession()
      },
      updateCredentials: async (creds: { username: string; password: string }) => {
        const hash = await sha256(creds.password)
        localStorage.setItem('dashboard_credentials', JSON.stringify({ username: creds.username, passwordHash: hash }))
        setCredentials({ username: creds.username, passwordHash: hash })
      },
    }),
    [isAuthenticated, credentials],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
