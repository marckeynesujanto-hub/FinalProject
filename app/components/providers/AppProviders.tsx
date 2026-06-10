'use client'

import { ToastProvider } from '@/lib/hooks/useToast'
import { ToastContainer } from '@/components/ui/ToastContainer'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastContainer />
    </ToastProvider>
  )
}
