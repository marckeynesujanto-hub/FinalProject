'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { BottomNav } from '@/components/layout/BottomNav'

interface AppShellProps {
  children: React.ReactNode
  /** Hide bottom nav on full-screen flows like tracking */
  hideNav?: boolean
}

export function AppShell({ children, hideNav = false }: AppShellProps) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className={hideNav ? 'pb-6' : 'pb-24'}>{children}</div>
        {!hideNav && <BottomNav />}
      </div>
    </AuthGuard>
  )
}
