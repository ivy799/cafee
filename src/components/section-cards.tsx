"use client"

import { useEffect, useState } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { createClient } from '@supabase/supabase-js'

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Order {
  id: number
  userId: number
  total: number
  status: string
  createdAt: string
}

interface User {
  id: number
  clerkUserId: string
  email: string
  name: string | null
  createdAt: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export function SectionCards() {
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchOrders(), fetchUsers()])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('order')
      .select('id, userId, total, status, createdAt')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      return
    }

    setOrders(data || [])
  }

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, clerkUserId, email, name, createdAt')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return
    }

    setUsers(data || [])
  }

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0)
  const successfulOrders = orders.filter(order => order.status === 'success')
  const pendingOrders = orders.filter(order => order.status === 'pending')
  
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
  })
  
  const lastMonthOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return orderDate.getMonth() === lastMonth && orderDate.getFullYear() === lastMonthYear
  })

  const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + order.total, 0)
  const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + order.total, 0)
  
  const revenueGrowth = lastMonthRevenue > 0 
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100)
    : thisMonthRevenue > 0 ? 100 : 0
    
  const customerGrowth = lastMonthOrders.length > 0 
    ? ((thisMonthOrders.length - lastMonthOrders.length) / lastMonthOrders.length * 100)
    : thisMonthOrders.length > 0 ? 100 : 0

  const successRate = orders.length > 0 
    ? (successfulOrders.length / orders.length * 100)
    : 0

  if (loading) {
    return (
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {totalRevenue.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {revenueGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {revenueGrowth >= 0 ? 'Trending up' : 'Trending down'} this month{' '}
            {revenueGrowth >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Revenue for the current month
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {orders.length.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {customerGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
              {customerGrowth >= 0 ? '+' : ''}{customerGrowth.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {customerGrowth >= 0 ? 'Growth in orders' : 'Decline in orders'}{' '}
            {customerGrowth >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Total orders processed
          </div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {users.length.toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +{users.length > 0 ? '100' : '0'}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Registered users <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Total registered customers</div>
        </CardFooter>
      </Card>
      
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Success Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {successRate.toFixed(1)}%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {successRate >= 80 ? <IconTrendingUp /> : <IconTrendingDown />}
              {successfulOrders.length}/{orders.length}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {successRate >= 80 ? 'Excellent performance' : 'Needs attention'}{' '}
            {successRate >= 80 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">Order completion rate</div>
        </CardFooter>
      </Card>
    </div>
  )
}
