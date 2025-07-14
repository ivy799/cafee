import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized', success: false }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found', success: false }, { status: 404 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: {
        orderItems: {
          include: {
            menu: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      orders: orders
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}