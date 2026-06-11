'use client'
import { useRequireAuth } from '@/app/lib/hooks/useAuth'
import { PageSkeleton } from '@/app/components/ui/Skeleton'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { ready } = useRequireAuth()

  if (!ready) {
    return <PageSkeleton />
  }

  return <>{children}</>
}
