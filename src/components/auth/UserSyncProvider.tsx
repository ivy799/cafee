'use client'

import { useUserSync } from '@/hooks/useUserSync'
import { useUser } from '@clerk/nextjs'

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser()
  const { isSyncing, syncError, hasSynced, resetSync} = useUserSync()

  if (isSignedIn && !hasSynced && isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Setting up your account...</p>
        </div>
      </div>
    )
  }

  if (syncError && !hasSynced && isSignedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600 dark:text-red-400">
          <p className="mb-4">Error setting up account:</p>
          <p className="mb-6 text-sm">{syncError}</p>
          <div className="space-x-2">
            <button 
              onClick={resetSync}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Retry Setup
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}