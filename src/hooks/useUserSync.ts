import { useUser } from '@clerk/nextjs'
import { useEffect, useState, useRef, use } from 'react'

export function useUserSync() {
  const { user, isLoaded } = useUser()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [hasSynced, setHasSynced] = useState(false)
  const syncAttempted = useRef(false)

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !user || isSyncing || hasSynced || syncAttempted.current) {
        return
      }

      const syncStatus = localStorage.getItem(`user-sync-${user.id}`)
      if (syncStatus === 'completed') {
        setHasSynced(true)
        return
      }

      syncAttempted.current = true
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

        const data = await response.json()
        if (data.success) {
          localStorage.setItem(`user-sync-${user.id}`, 'completed')
          setHasSynced(true)
        }

      } catch (error) {
        console.error('Error syncing user:', error)
        setSyncError('Failed to sync user data')
        syncAttempted.current = false
      } finally {
        setIsSyncing(false)
      }
    }

    syncUser()
  }, [user, isLoaded, isSyncing, hasSynced])

  useEffect(() => {
    if (user?.id) {
      const syncStatus = localStorage.getItem(`user-sync-${user.id}`)
      if (syncStatus === 'completed') {
        setHasSynced(true)
        syncAttempted.current = true
      } else {
        setHasSynced(false)
        syncAttempted.current = false
      }
      
    }
  }, [user?.id])

  const resetSync = () => {
    if (user?.id) {
      localStorage.removeItem(`user-sync-${user.id}`)
      setHasSynced(false)
      syncAttempted.current = false
      setSyncError(null)
      
    }
  }

  return { isSyncing, syncError, hasSynced, resetSync }
}