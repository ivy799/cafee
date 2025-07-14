'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Clock } from 'lucide-react'
import Link from 'next/link'

export default function PaymentPendingPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Pending
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Your payment is being processed. Order ID: {orderId}
        </p>
        <div className="space-y-4">
          <Link href="/orders">
            <Button className="w-full">Check Order Status</Button>
          </Link>
          <Link href="/menu">
            <Button variant="outline" className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}