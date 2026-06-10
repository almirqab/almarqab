import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { hasError: boolean; error?: Error }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#F5F0E8', color: '#2C2418', fontFamily: 'Almarai, sans-serif' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(179,58,58,0.1)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B33A3A" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-xl font-bold mb-2">حدث خطأ غير متوقع</h1>
          <p className="text-sm mb-6" style={{ color: '#7A6B55' }}>نعتذر عن الإزعاج، يرجى تحديث الصفحة</p>
          <button
            onClick={() => window.location.reload()}
            className="btn btn-primary"
            type="button"
          >
            تحديث الصفحة
          </button>
          {this.state.error && (
            <details className="mt-4 text-xs" style={{ color: '#7A6B55' }}>
              <summary>تفاصيل الخطأ</summary>
              <pre className="mt-2 p-2 rounded-lg" style={{ background: 'rgba(179,58,58,0.05)', overflow: 'auto', maxWidth: '90vw' }}>{this.state.error.message}</pre>
            </details>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
