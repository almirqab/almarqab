import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { DashboardProvider } from './contexts/DashboardContext'
import { DashboardLayout } from './components/DashboardLayout'
import { AuthGuard } from './components/AuthGuard'

const AddRequestPage = lazy(() => import('./pages/AddRequestPage').then(m => ({ default: m.AddRequestPage })))
const PublicPropertiesPage = lazy(() => import('./pages/PublicPropertiesPage').then(m => ({ default: m.PublicPropertiesPage })))
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })))
const ClientsPage = lazy(() => import('./pages/ClientsPage').then(m => ({ default: m.ClientsPage })))
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const MessagesPage = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })))
const PropertiesPage = lazy(() => import('./pages/PropertiesPage').then(m => ({ default: m.PropertiesPage })))
const RequestsPage = lazy(() => import('./pages/RequestsPage').then(m => ({ default: m.RequestsPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

function LazyLoad({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{background:'#F5F0E8', color:'#7A6B55', fontFamily:'Almarai, sans-serif'}}>جاري التحميل...</div>}>{children}</Suspense>
}

function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <Routes>
          <Route path="/" element={<LazyLoad><AddRequestPage /></LazyLoad>} />
          <Route path="/properties" element={<LazyLoad><PublicPropertiesPage /></LazyLoad>} />
          <Route path="/login" element={<LazyLoad><LoginPage /></LazyLoad>} />
          <Route path="/terms" element={<LazyLoad><TermsPage /></LazyLoad>} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <DashboardLayout />
              </AuthGuard>
            }
          >
            <Route index element={<LazyLoad><HomePage /></LazyLoad>} />
            <Route path="requests" element={<LazyLoad><RequestsPage /></LazyLoad>} />
            <Route path="properties" element={<LazyLoad><PropertiesPage /></LazyLoad>} />
            <Route path="clients" element={<LazyLoad><ClientsPage /></LazyLoad>} />
            <Route path="messages" element={<LazyLoad><MessagesPage /></LazyLoad>} />
            <Route path="settings" element={<LazyLoad><SettingsPage /></LazyLoad>} />
          </Route>
          <Route path="*" element={<Navigate replace to="/dashboard" />} />
        </Routes>
      </DashboardProvider>
    </AuthProvider>
  )
}

export default App
