'use client'

import { ToastProvider } from '@/app/lib/hooks/useToast'
import { ToastContainer } from '@/app/components/ui/ToastContainer'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  )
}
