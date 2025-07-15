import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {

    const userAgent = request.headers.get('user-agent') || ''
    const host = request.headers.get('host') || ''
    
    if (userAgent.includes('Mozilla') && !userAgent.includes('Midtrans')) {
      return NextResponse.json({ 
        message: 'Notification endpoint active',
        environment: 'ngrok-development',
        timestamp: new Date().toISOString()
      })
    }

    const body = await request.json()
    
    console.log('📨 Raw notification body:', JSON.stringify(body, null, 2))
    
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
      fraud_status,
      payment_type,
      transaction_time
    } = body

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
    }

    const isNgrokDev = host.includes('ngrok') || process.env.NODE_ENV === 'development'
    
    if (!isNgrokDev) {
      const serverKey = process.env.MIDTRANS_SERVER_KEY!
      const hashedSignature = crypto
        .createHash('sha512')
        .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
        .digest('hex')

      if (hashedSignature !== signature_key) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
      }
    } else {
      console.log('Skipping signature verification for ngrok development')
    }

    const payment = await prisma.payment.findUnique({
      where: { transactionId: order_id },
      include: { order: true }
    })

    if (!payment) {
      console.error('Payment not found:', order_id)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    let orderStatus = 'pending'
    switch (transaction_status) {
      case 'capture':
        orderStatus = fraud_status === 'accept' ? 'success' : 'success'
        break
      case 'settlement':
        orderStatus = 'success'
        break
      case 'pending':
        orderStatus = 'pending'
        break
      case 'deny':
      case 'cancel':
      case 'expire':
      case 'failure':
        orderStatus = 'failed'
        break
      default:
        orderStatus = 'pending'
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentType: payment_type || 'unknown',
        statusCode: status_code || '200',
        fraudStatus: fraud_status || null,
        transactionTime: transaction_time ? new Date(transaction_time) : new Date()
      }
    })

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { status: orderStatus }
    })

    if (orderStatus === 'success') {
      const cart = await prisma.cart.findUnique({
        where: { userId: payment.order.userId }
      })

      if (cart) {
        const deletedItems = await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        })
        console.log('🛒 Cleared cart items:', deletedItems.count)
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Notification processed successfully',
      order_id,
      status: orderStatus,
      processed_at: new Date().toISOString()
    })

  } catch (error) {    
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
      }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'active',
    message: 'Midtrans notification endpoint is working',
    environment: 'ngrok-development',
    ngrok_url: 'https://f7fa7a9b89df.ngrok-free.app',
    endpoint: '/api/payment/notification',
    timestamp: new Date().toISOString(),
    methods_supported: ['GET', 'POST']
  })
}