import { useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'xp'

export type ToastMessage = {
  id: number
  message: string
  type: ToastType
}

let toastId = 0
let addToastFn: ((message: string, type: ToastType) => void) | null = null

export const showToast = (message: string, type: ToastType = 'info') => {
  if (addToastFn) addToastFn(message, type)
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    addToastFn = (message, type) => {
      const id = toastId++
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 3000)
    }
    return () => { addToastFn = null }
  }, [])

  const icons = {
    success: '✅',
    error: '❌',
    info: '💡',
    xp: '⚡',
  }

  const colors = {
    success: 'border-teal-500/30 bg-teal-500/10 text-teal-400',
    error: 'border-red-500/30 bg-red-500/10 text-red-400',
    info: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
    xp: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  }

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold shadow-xl animate-bounce-in ${colors[t.type]}`}
          style={{ animation: 'slideIn 0.3s ease' }}
        >
          <span>{icons[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  )
}