import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

export function useUserSync() {
  const { user, isLoaded } = useUser()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user || isSyncing) return

      setIsSyncing(true)
      setSyncError(null)

      try {
        const response = await fetch('/api/user/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('Failed to sync user')
        }

      } catch (error) {
        console.error('Error syncing user:', error)
        setSyncError('Failed to sync user data')
      } finally {
        setIsSyncing(false)
      }
    }

    syncUser()
  }, [user, isLoaded])

  return { isSyncing, syncError }
}