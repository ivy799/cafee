import { auth, currentUser } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function POST() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await currentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existingUser = await prisma.user.findUnique({
      where: { clerkUserId: userId }
    })

    if (existingUser) {
      return NextResponse.json({ 
        message: 'User already exists', 
        user: existingUser,
        alreadyExists: true
      })
    }

    const newUser = await prisma.user.create({
      data: {
        clerkUserId: userId,
        email: user.emailAddresses[0]?.emailAddress || '',
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
        imageUrl: user.imageUrl || null,
      }
    })

    await prisma.cart.create({
      data: {
        userId: newUser.id
      }
    })

    return NextResponse.json({ 
      message: 'User created successfully', 
      user: newUser 
    })

  } catch (error) {
    console.error('Error syncing user:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}