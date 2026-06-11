'use client'

import { useToast } from '@/app/lib/hooks/useToast'

const styles = {
  success: 'bg-green-600 text-white',
  error: 'bg-red-600 text-white',
  info: 'bg-gray-800 text-white',
} as const

export function ToastContainer() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none safe-top"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto mx-auto w-full max-w-md rounded-2xl px-4 py-3 shadow-lg text-sm font-medium flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 ${styles[toast.type]}`}
          role="alert"
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            className="opacity-80 hover:opacity-100 text-lg leading-none"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
