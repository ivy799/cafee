import { auth, currentUser } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { snap } from '@/lib/midtrans'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
    }

    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      return NextResponse.json({ error: 'User not found', success: false }, { status: 404 })
    }

    const body = await request.json()
    const { items, total, customerDetails } = body

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found in database', success: false }, { status: 404 })
    }

    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total: total,
        status: 'pending'
      }
    })

    for (const item of items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          menuId: item.id,
          quantity: item.quantity,
          priceEach: item.price
        }
      })
    }

    const transactionId = `ORDER-${order.id}-${Date.now()}`

    const parameter = {
      transaction_details: {
        order_id: transactionId,
        gross_amount: total,
      },
      credit_card: {
        secure: true,
      },
      item_details: items.map((item: any) => ({
        id: item.id.toString(),
        price: item.price,
        quantity: item.quantity,
        name: item.name,
      })),
      customer_details: {
        first_name: customerDetails.firstName || user.name?.split(' ')[0] || 'Customer',
        last_name: customerDetails.lastName || user.name?.split(' ').slice(1).join(' ') || '',
        email: customerDetails.email || user.email,
        phone: customerDetails.phone || '08123456789',
        billing_address: {
          first_name: customerDetails.firstName || user.name?.split(' ')[0] || 'Customer',
          last_name: customerDetails.lastName || user.name?.split(' ').slice(1).join(' ') || '',
          email: customerDetails.email || user.email,
          phone: customerDetails.phone || '08123456789',
          address: customerDetails.address || 'Jl. Example No. 123',
          city: customerDetails.city || 'Jakarta',
          postal_code: customerDetails.postalCode || '12345',
          country_code: 'IDN'
        }
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success?order_id=${transactionId}`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error?order_id=${transactionId}`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending?order_id=${transactionId}`
      },
      notification_url: "https://f7fa7a9b89df.ngrok-free.app/api/payment/notification"
    }

    const transaction = await snap.createTransaction(parameter)

    await prisma.payment.create({
      data: {
        orderId: order.id,
        transactionId: transactionId,
        paymentType: 'pending',
        grossAmount: total,
        statusCode: '201',
        transactionTime: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      token: transaction.token,
      redirect_url: transaction.redirect_url,
      orderId: order.id,
      transactionId: transactionId
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}