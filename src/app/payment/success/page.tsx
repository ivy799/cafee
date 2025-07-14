'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Payment Successful!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Your order has been confirmed. Order ID: {orderId}
        </p>
        <div className="space-y-4">
          <Link href="/menu">
            <Button className="w-full">Continue Shopping</Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full">View Orders</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}