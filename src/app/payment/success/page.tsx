'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')
  const [isProcessing, setIsProcessing] = useState(true)
  const [notificationSent, setNotificationSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (orderId) {
      testNotification()
    } else {
      setError('No order ID provided')
      setIsProcessing(false)
    }
  }, [orderId])

  const testNotification = async () => {
    try {
      console.log('Testing notification for order:', orderId)
      setError(null)
      
      const response = await fetch('/api/payment/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId: orderId })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Check if the API endpoint exists.')
      }

      const result = await response.json()
      
      console.log('Test notification response:', result)

      if (result.success) {
        setNotificationSent(true)
        console.log('Test notification successful:', result)
      } else {
        throw new Error(result.error || result.details || 'Test notification failed')
      }

    } catch (error) {
      console.error('Test notification error:', error)
      
      let errorMessage = 'Failed to process payment notification'
      
      if (error instanceof Error) {
        if (error.message.includes('<!DOCTYPE')) {
          errorMessage = 'API endpoint not found. Please check if the server is running correctly.'
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.'
        } else {
          errorMessage = error.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setIsProcessing(true)
    testNotification()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        {isProcessing ? (
          <>
            <Loader2 className="w-16 h-16 text-blue-500 mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Processing Payment...
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Please wait while we confirm your payment status.
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Retry attempt: {retryCount}
              </p>
            )}
          </>
        ) : (
          <>
            {notificationSent ? (
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            )}
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Payment {notificationSent ? 'Successful!' : 'Completed'}
            </h1>
            
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {orderId ? (
                <>Your order has been confirmed. Order ID: <span className="font-mono">{orderId}</span></>
              ) : (
                'Payment has been processed.'
              )}
            </p>

            {notificationSent && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 mb-6">
                <p className="text-sm text-green-800 dark:text-green-200">
                  ✓ Payment notification processed successfully
                </p>
              </div>
            )}

            {error && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Notification Warning
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      {error}
                    </p>
                    <Button
                      onClick={handleRetry}
                      size="sm"
                      variant="outline"
                      className="border-yellow-300 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-600 dark:text-yellow-200 dark:hover:bg-yellow-900/30"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Retry Notification
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <Link href="/menu">
                <Button className="w-full">Continue Shopping</Button>
              </Link>
              <Link href="/orders">
                <Button variant="outline" className="w-full">View Orders</Button>
              </Link>
              {error && (
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full text-sm">
                    Check Order Status
                  </Button>
                </Link>
              )}
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-md text-left">
                <h4 className="text-sm font-medium mb-2">Debug Info:</h4>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                  <p>Order ID: {orderId || 'Not provided'}</p>
                  <p>Retry Count: {retryCount}</p>
                  <p>Notification Status: {notificationSent ? 'Success' : 'Failed'}</p>
                  {error && <p>Error: {error}</p>}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}