import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <>{children}</>
}
