'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

declare global {
  interface Window {
    snap: any;
  }
}

interface CartItem {
  id: number
  name: string
  image: string
  description: string | null
  category: string
  price: number
  quantity: number
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function CheckoutPage() {
  const { user } = useUser()
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [customerDetails, setCustomerDetails] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  })

  useEffect(() => {
    if (user?.id) {
      fetchCartItems()
      setCustomerDetails(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.emailAddresses[0]?.emailAddress || ''
      }))
    }
  }, [user?.id])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
    script.setAttribute('data-client-key', process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!)
    script.async = true
    document.head.appendChild(script)

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const fetchCartItems = async () => {
    if (!user?.id) return

    try {
      setLoading(true)

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerkUserId', user.id)
        .single()

      if (userError || !userData) return

      const { data: cartData, error: cartError } = await supabase
        .from('cart')
        .select('id')
        .eq('userId', userData.id)
        .single()

      if (cartError || !cartData) return

      const { data: cartItemData, error: itemError } = await supabase
        .from('cartItem')
        .select('id, quantity, menu:menuId (id, name, image, description, category, price)')
        .eq('cartId', cartData.id)

      if (itemError) return

      const transformedItems = cartItemData?.map(item => {
        const menu = Array.isArray(item.menu) ? item.menu[0] : item.menu
        return {
          id: menu.id,
          name: menu.name,
          image: menu.image,
          description: menu.description,
          category: menu.category,
          price: menu.price,
          quantity: item.quantity
        }
      }) || []

      setCartItems(transformedItems)
    } catch (error) {
      console.error('Error fetching cart items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCustomerDetails(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handlePayment = async () => {
    if (!user?.id || cartItems.length === 0) return

    setProcessing(true)

    try {
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: cartItems,
          total: total,
          customerDetails: customerDetails
        })
      })

      const data = await response.json()

      if (data.success && window.snap) {
        window.snap.pay(data.token, {
          onSuccess: (result: any) => {
            console.log('Payment success:', result)
            router.push(`/payment/success?order_id=${data.transactionId}`)
          },
          onPending: (result: any) => {
            console.log('Payment pending:', result)
            router.push(`/payment/pending?order_id=${data.transactionId}`)
          },
          onError: (result: any) => {
            console.log('Payment error:', result)
            router.push(`/payment/error?order_id=${data.transactionId}`)
          },
          onClose: () => {
            console.log('Payment popup closed')
          }
        })
      }
    } catch (error) {
      console.error('Error creating payment:', error)
    } finally {
      setProcessing(false)
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading checkout...</p>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-lg text-gray-600 dark:text-gray-300">Your cart is empty</p>
          <Button 
            onClick={() => router.push('/menu')}
            className="mt-4"
          >
            Browse Menu
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Customer Details Form */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={customerDetails.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={customerDetails.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={customerDetails.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={customerDetails.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={customerDetails.address}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    value={customerDetails.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={customerDetails.postalCode}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Qty: {item.quantity} × Rp. {item.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-medium">
                      Rp. {(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span>Rp. {total.toLocaleString()}</span>
                </div>
              </div>
              
              <Button 
                onClick={handlePayment}
                disabled={processing}
                className="w-full mt-6"
              >
                {processing ? 'Processing...' : 'Pay Now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}