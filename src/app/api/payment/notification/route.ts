import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { coreApi } from '@/lib/midtrans'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
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

    const serverKey = process.env.MIDTRANS_SERVER_KEY!
    const hashedSignature = crypto
      .createHash('sha512')
      .update(`${order_id}${status_code}${gross_amount}${serverKey}`)
      .digest('hex')

    if (hashedSignature !== signature_key) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const transactionStatus = await coreApi.transaction.status(order_id)

    const payment = await prisma.payment.findUnique({
      where: { transactionId: order_id },
      include: { order: true }
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    let orderStatus = 'pending'

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        orderStatus = 'challenge'
      } else if (fraud_status === 'accept') {
        orderStatus = 'success'
      }
    } else if (transaction_status === 'settlement') {
      orderStatus = 'success'
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      orderStatus = 'failed'
    } else if (transaction_status === 'pending') {
      orderStatus = 'pending'
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        paymentType: payment_type,
        statusCode: status_code,
        fraudStatus: fraud_status,
        transactionTime: new Date(transaction_time)
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
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error processing notification:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}