import { createContext } from 'react'

export interface Credentials {
  username: string
  password: string
}

export interface AuthContextValue {
  isAuthenticated: boolean
  credentials: Credentials
  login: (username: string, password: string) => boolean
  logout: () => void
  updateCredentials: (creds: Credentials) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)