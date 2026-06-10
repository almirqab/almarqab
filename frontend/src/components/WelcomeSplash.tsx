import { useEffect, useState } from 'react'

export function WelcomeSplash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'enter' | 'show' | 'exit'>('enter')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 50)
    const t2 = setTimeout(() => setPhase('exit'), 2000)
    const t3 = setTimeout(() => onDone(), 2600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [onDone])

  return <div className="fixed inset-0 z-50 flex items-center justify-center" style={{
    background: 'linear-gradient(135deg, #3D6B4F 0%, #2D523D 100%)',
    transition: 'opacity 0.5s ease-out',
    opacity: phase === 'exit' ? 0 : 1,
  }}>
    <div className="text-center" style={{
      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      transform: phase === 'enter' ? 'scale(0.5) translateY(20px)' : 'scale(1) translateY(0)',
      opacity: phase === 'enter' ? 0 : 1,
    }}>
      <svg width="96" height="96" viewBox="0 0 100 100" className="mx-auto mb-5">
        <rect x="10" y="45" width="80" height="50" fill="#C5A059" rx="3" />
        <polygon points="50,5 8,45 92,45" fill="#C5A059" />
        <rect x="50" y="47" width="14" height="18" fill="#3D6B4F" rx="2" />
        <rect x="8" y="68" width="34" height="10" fill="#3D6B4F" rx="1" />
        <rect x="58" y="68" width="34" height="10" fill="#3D6B4F" rx="1" />
      </svg>
      <h1 className="text-4xl font-bold mb-3" style={{ color: '#C5A059' }}>المرقاب الذهبي</h1>
      <p className="text-lg" style={{ color: '#E5D3B3' }}>أهلاً بك في منصتك العقارية</p>
    </div>
  </div>
}
