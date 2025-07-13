'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/nextjs'

interface CartItem {
	id: number
	name: string
	image: string
	description: string | null
	category: string
	price: number
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

export default function CartPage() {
	const [CartItems, setCartItems] = useState<CartItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { user } = useUser()

	useEffect(() => {
		if (user?.id) {
			fetchCartItems()
		}
	}, [user?.id])

	const fetchCartItems = async () => {
		if (!user?.id) {
			setLoading(false)
			setError('User not authenticated')
			return
		}
		try {
			setLoading(true)

			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('clerkUserId', user.id)
				.single()


			if (userError) {
				throw new Error(`User not found: ${userError.message}`)
			}

			if (!userData) {
				throw new Error('User not found in database')
			}

			const { data: cartData, error: cartError } = await supabase
				.from('cart')
				.select('id')
				.eq('userId', userData.id)
				.maybeSingle()

			if (cartError) {
				if (cartError.code === 'PGRST116') {
					setCartItems([])
					setLoading(false)
					return
				}
				throw cartError
			}

			if (!cartData) {
				setCartItems([])
				setLoading(false)
				return
			}

			const { data: cartItem, error: itemError } = await supabase
				.from('cartItem')
				.select('id, quantity, menu:menuId (id, name, image, description, category, price)')
				.eq('cartId', cartData.id)

			if (itemError) {
				throw itemError
			}

			const transformedItems = cartItem?.map(item => {
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

		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-white dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-lg text-gray-600 dark:text-gray-300">Loading Cart...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-white dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-lg text-red-600 dark:text-red-400">Error: {error}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-white dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-16">
					<h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white mb-6">
						Cart
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
						Your cart
					</p>
				</div>

				{CartItems.length === 0 ? (
					<div className="text-center py-16">
						<ShoppingCart className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
						<h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-4">
							Your cart is empty
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
							Looks like you haven't added any items to your cart yet. Browse our menu to discover delicious options!
						</p>
						<Button
							className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium px-8 py-3"
							onClick={() => window.location.href = '/menu'}
						>
							Browse Menu
						</Button>
					</div>
				) : (
					<>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
							{CartItems.map((product) => (
								<Card
									key={product.id}
									className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-500 flex flex-col"
								>
									<CardContent className="p-4 flex-1">
										<div className="relative mb-3 overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-800">
											<Image
												src={product.image || "/placeholder.svg"}
												alt={product.name}
												width={300}
												height={200}
												className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
												crossOrigin="anonymous"
											/>
										</div>

										<Badge
											variant="secondary"
											className="mb-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 uppercase text-xs"
										>
											{product.category}
										</Badge>

										<div className="space-y-1 mb-3">
											<h3 className="font-semibold text-base text-gray-900 dark:text-gray-100 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors line-clamp-1">
												{product.name}
											</h3>
											{product.description && (
												<p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
													{product.description}
												</p>
											)}
											<p className="text-lg font-bold text-gray-900 dark:text-gray-100">
												${product.price}
											</p>
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						<div className="text-center mt-16">
							<Button
								variant="outline"
								size="lg"
								className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 bg-transparent"
							>
								Load More Products
							</Button>
						</div>
					</>
				)}
			</div>
		</div>
	)
}
