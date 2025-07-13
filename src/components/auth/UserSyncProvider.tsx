'use client'

import { useUserSync } from '@/hooks/useUserSync'
import { useUser } from '@clerk/nextjs'

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser()
  const { isSyncing, syncError } = useUserSync()

  if (isSignedIn && isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Syncing your account...</p>
        </div>
      </div>
    )
  }

  if (syncError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>Error syncing account: {syncError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}