import { createContext } from 'react'

export interface Credentials {
  username: string
  password: string
}

export interface AuthContextValue {
  isAuthenticated: boolean
  credentials: Credentials
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  updateCredentials: (creds: Credentials) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)