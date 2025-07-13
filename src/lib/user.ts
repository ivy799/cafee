import { auth } from '@clerk/nextjs/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getCurrentUserFromDB() {
  const { userId } = await auth()
  
  if (!userId) {
    return null
  }

  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        cart: {
          include: {
            cartItems: {
              include: {
                menu: true
              }
            }
          }
        },
        orders: true,
        reviews: true
      }
    })

    return user
  } catch (error) {
    console.error('Error fetching user from database:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}