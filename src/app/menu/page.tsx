'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, ShoppingCart } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/nextjs'

interface MenuItem {
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

export default function MenuPage() {
	const [menuItems, setMenuItems] = useState<MenuItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [cartItems, setCartItems] = useState<number[]>([])
	const { user } = useUser()

	useEffect(() => {
		fetchMenuItems()
		if (user) {
			fetchCartItems()
		}
	}, [user])

	const fetchMenuItems = async () => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('menu')
				.select('id, name, image, description, category, price')

			if (error) {
				throw error
			}

			setMenuItems(data || [])
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred')
		} finally {
			setLoading(false)
		}
	}

	const fetchCartItems = async () => {
		if (!user) return

		try {
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('clerkUserId', user.id)
				.single()

			if (userError) return

			const { data: cartData, error: cartError } = await supabase
				.from('cart')
				.select('id')
				.eq('userId', userData.id)
				.single()

			if (cartError) {
				if (cartError.code === 'PGRST116') {
					const { data: newCart, error: createCartError } = await supabase
						.from('cart')
						.insert([{ userId: userData.id }])
						.select('id')
						.single()

					if (createCartError) {
						console.error('Error creating cart:', createCartError)
						return
					}
					setCartItems([])
					return
				}
				console.error('Error fetching cart:', cartError)
				return
			}

			const { data: cartItemsData, error: cartItemsError } = await supabase
				.from('cartItem')
				.select('menuId')
				.eq('cartId', cartData.id)

			if (!cartItemsError && cartItemsData) {
				setCartItems(cartItemsData.map(item => item.menuId))
			}
		} catch (err) {
			console.error('Error fetching cart items:', err)
		}
	}

	const addToCart = async (item: MenuItem) => {
		if (!user) {
			alert('Harap login terlebih dahulu.')
			return
		}

		try {
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('clerkUserId', user.id)
				.single()

			if (userError) {
				throw new Error(`User not found: ${userError.message}`)
			}

			let cartId;
			const { data: cartData, error: cartError } = await supabase
				.from('cart')
				.select('id')
				.eq('userId', userData.id)
				.single()

			if (cartError) {
				if (cartError.code === 'PGRST116') {
					const { data: newCart, error: createCartError } = await supabase
						.from('cart')
						.insert([{ userId: userData.id }])
						.select('id')
						.single()

					if (createCartError) {
						throw createCartError
					}
					cartId = newCart.id
				} else {
					throw cartError
				}
			} else {
				cartId = cartData.id
			}

			const { data: existingItem, error: existingItemError } = await supabase
				.from('cartItem')
				.select('id')
				.eq('cartId', cartId)
				.eq('menuId', item.id)
				.single()

			if (existingItemError && existingItemError.code !== 'PGRST116') {
				console.error('Fetch error:', existingItemError)
				return
			}

			if (existingItem) {
				alert('Item sudah ada di keranjang')
				return
			}

			const { error: insertError } = await supabase
				.from('cartItem')
				.insert([
					{
						cartId: cartId,
						menuId: item.id,
						quantity: 1
					}
				])

			if (insertError) {
				throw insertError
			}

			setCartItems(prev => [...prev, item.id])
			alert('Item berhasil ditambahkan ke keranjang')
		} catch (err) {
			console.error('Error adding to cart:', err)
			alert('Gagal menambahkan item ke keranjang')
		}
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-white dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-lg text-gray-600 dark:text-gray-300">Loading menu...</p>
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
						Explore the recent products
					</h1>
					<p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
						Our delectable drink options include classic espresso choices, house
						specialties, fruit smoothies, and frozen treats.
					</p>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{menuItems.map((product) => (
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
										Rp. {product.price}
									</p>
								</div>
							</CardContent>

							<CardFooter className="px-4 pb-4 pt-0">
								<Button
									className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg h-9 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
									size="sm"
									disabled={cartItems.includes(product.id)}
									onClick={() => addToCart(product)}
								>
									<ShoppingCart className="w-4 h-4 mr-2" />
									{cartItems.includes(product.id) ? 'In Cart' : 'Add to cart'}
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>

				{menuItems.length > 0 && (
					<div className="text-center mt-16">
						<Button
							variant="outline"
							size="lg"
							className="border-gray-300 dark:border-gray-600 text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-3 bg-transparent"
						>
							Load More Products
						</Button>
					</div>
				)}
			</div>
		</div>
	)
}
