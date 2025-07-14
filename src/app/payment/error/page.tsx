'use client'

import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { XCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentErrorPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Failed
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          There was an issue with your payment. Order ID: {orderId}
        </p>
        <div className="space-y-4">
          <Link href="/checkout">
            <Button className="w-full">Try Again</Button>
          </Link>
          <Link href="/cart">
            <Button variant="outline" className="w-full">Back to Cart</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}