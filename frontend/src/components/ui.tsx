import type { ReactNode } from 'react'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`glass p-6 ${className??''}`}>{children}</div>
}

export function Field({ children, label }: { children: ReactNode; label: string }) {
  return <div className="flex flex-col gap-1.5"><label>{label}</label>{children}</div>
}

export function Modal({ children, onClose, open, title }: { children: ReactNode; onClose: () => void; open: boolean; title?: string }) {
  if (!open) return null
  return <div className="modal-overlay" onClick={onClose} role="dialog">
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {title && <h2 className="text-lg font-bold mb-5" style={{color:'#2C2418'}}>{title}</h2>}
      {children}
    </div>
  </div>
}

import { useEffect } from 'react'

export function Toast({ message, open, setOpen }: { message: string; open: boolean; setOpen: (v: boolean) => void }) {
  useEffect(() => { if (open) { const t = setTimeout(() => setOpen(false), 3000); return () => clearTimeout(t) } }, [open, setOpen])
  if (!open) return null
  return <div className="toast">{message}</div>
}
