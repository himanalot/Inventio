'use client'

import { UserActivityTracker } from '@/components/UserActivityTracker'
import { AuthProvider } from '@/components/providers/AuthProvider'

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <UserActivityTracker />
      {children}
    </AuthProvider>
  )
} 