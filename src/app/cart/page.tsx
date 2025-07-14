'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Minus, Plus, X } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { AlertDialogDemo } from '@/components/confirmation'

interface CartItem {
	id: number
	name: string
	image: string
	description: string | null
	category: string
	price: number
	quantity?: number
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
	const [promoCode, setPromoCode] = useState("")
	const [discount, setDiscount] = useState(0)
	const { user } = useUser()
	const router = useRouter()

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

	const removeItem = async (id: number) => {
		if (!user?.id) return

		try {
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('clerkUserId', user.id)
				.single()

			if (userError || !userData) {
				throw new Error(`User not found: ${userError ? userError.message : 'User not found in database'}`)
			}

			const { data: cartData, error: cartError } = await supabase
				.from('cart')
				.select('id')
				.eq('userId', userData.id)
				.maybeSingle()

			if (cartError) {
				throw new Error(`Cart not found: ${cartError.message}`)
			}

			if (!cartData) {
				throw new Error('Cart not found in database')
			}

			const { error: deleteError } = await supabase
				.from('cartItem')
				.delete()
				.eq('cartId', cartData.id)
				.eq('menuId', id)

			if (deleteError) {
				throw new Error(`Failed to remove item: ${deleteError.message}`)
			}

			await fetchCartItems()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred while removing item')
			return
		}
	}

	const removeAllItems = async () => {
		if (!user?.id) return

		try {
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('clerkUserId', user.id)
				.single()

			if (userError || !userData) {
				throw new Error(`User not found: ${userError ? userError.message : 'User not found in database'}`)
			}

			const { data: cartData, error: cartError } = await supabase
				.from('cart')
				.select('id')
				.eq('userId', userData.id)
				.maybeSingle()

			if (cartError) {
				throw new Error(`Cart not found: ${cartError.message}`)
			}

			if (!cartData) {
				throw new Error('Cart not found in database')
			}

			const { error: deleteError } = await supabase
				.from('cartItem')
				.delete()
				.eq('cartId', cartData.id)

			if (deleteError) {
				throw new Error(`Failed to remove all items: ${deleteError.message}`)
			}

			await fetchCartItems()
		} catch (err) {
			setError(err instanceof Error ? err.message : 'An error occurred while removing all item')
			return
		}
	}

	const updateQuantity = async (id: number, newQuantity: number) => {
		if (newQuantity < 1) return

		setCartItems((items) => items.map((item) => (item.id === id ? { ...item, quantity: newQuantity } : item)))

		if (!user?.id) return

		try {
			const { data: userData, error: userError } = await supabase
				.from('users')
				.select('id')
				.eq('clerkUserId', user.id)
				.single()

			if (userError || !userData) {
				console.error('User fetch error:', userError)
				return
			}

			const { data: cartData, error: cartError } = await supabase
				.from('cart')
				.select('id')
				.eq('userId', userData.id)
				.single()

			if (cartError || !cartData) {
				console.error('Cart fetch error:', cartError)
				return
			}

			const { error: updateError } = await supabase
				.from('cartItem')
				.update({ quantity: newQuantity })
				.eq('cartId', cartData.id)
				.eq('menuId', id)

			if (updateError) {
				console.error('Error updating quantity:', updateError)
				await fetchCartItems()
			}

		} catch (err) {
			console.error('Error updating quantity:', err)
			await fetchCartItems()
		}
	}

	const applyPromoCode = () => {
		if (promoCode.toLowerCase() === "save10") {
			setDiscount(0.1)
		} else {
			setDiscount(0)
		}
	}

	const subtotal = CartItems.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0)
	const discountAmount = subtotal * discount
	const total = subtotal - discountAmount

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-lg text-gray-600 dark:text-gray-300">Loading Cart...</p>
				</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-lg text-red-600 dark:text-red-400">Error: {error}</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 dark:bg-background py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto">
				{CartItems.length === 0 ? (
					<div className="text-center py-16">
						<ShoppingCart className="w-24 h-24 mx-auto text-gray-300 dark:text-gray-600 mb-6" />
						<h3 className="text-2xl font-semibold text-gray-600 dark:text-gray-300 mb-4">Your cart is empty</h3>
						<p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
							Looks like you haven't added any items to your cart yet. Browse our menu to discover delicious options!
						</p>
						<Button
							className="bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium px-8 py-3"
							onClick={() => (window.location.href = "/menu")}
						>
							Browse Menu
						</Button>
					</div>
				) : (
					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div className="lg:col-span-2">
							<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm">
								<div className="p-6 border-b border-gray-200 dark:border-gray-700">
									<div className="flex items-center justify-between">
										<h1 className="text-2xl font-bold text-gray-900 dark:text-white">
											Cart ({CartItems.length} {CartItems.length === 1 ? "product" : "products"})
										</h1>
										<AlertDialogDemo
											onConfirm={() => removeAllItems()}
											title="Clear all item"
											message="Are you sure you want to remove all items from your cart? This action cannot be undone."
											actionText="Clear All"
											variant="destructive"
										>
											<Button
												variant="ghost"
												size="sm"
												className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
											>
												<X className="w-4 h-4 mr-1" />
												Clear cart
											</Button>
										</AlertDialogDemo>
									</div>
								</div>

								<div className="hidden md:grid md:grid-cols-12 gap-4 p-6 border-b border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									<div className="col-span-6">Product</div>
									<div className="col-span-2 text-center">Count</div>
									<div className="col-span-2 text-right">Price</div>
									<div className="col-span-2"></div>
								</div>

								<div className="divide-y divide-gray-200 dark:divide-gray-700">
									{CartItems.map((item) => (
										<div key={item.id} className="p-6">
											<div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
												<div className="md:col-span-6 flex items-center space-x-4">
													<div className="flex-shrink-0 w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
														<Image
															src={item.image || "/placeholder.svg"}
															alt={item.name}
															width={64}
															height={64}
															className="w-full h-full object-cover"
															crossOrigin="anonymous"
														/>
													</div>
													<div className="flex-1 min-w-0">
														<h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</h3>
														<p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{item.category}</p>
													</div>
												</div>

												<div className="md:col-span-2 flex items-center justify-center">
													<div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
														<Button
															variant="ghost"
															size="sm"
															onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
															className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
														>
															<Minus className="w-3 h-3" />
														</Button>
														<span className="w-12 text-center text-sm font-medium text-gray-900 dark:text-white">
															{item.quantity || 1}
														</span>
														<Button
															variant="ghost"
															size="sm"
															onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
															className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
														>
															<Plus className="w-3 h-3" />
														</Button>
													</div>
												</div>

												<div className="md:col-span-2 text-right">
													<p className="text-sm font-medium text-gray-900 dark:text-white">
														Rp. {(item.price * (item.quantity || 1)).toFixed(2)}
													</p>
												</div>

												<div className="md:col-span-2 flex justify-end">
													<AlertDialogDemo
														onConfirm={() => removeItem(item.id)}
														title="Remove Item from Cart"
														message={`Are you sure you want to remove "${item.name}" from your cart? This action cannot be undone.`}
														actionText="Remove"
														variant="destructive"
													>
														<Button
															variant="ghost"
															size="sm"
															className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
														>
															<X className="w-4 h-4" />
														</Button>
													</AlertDialogDemo>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="lg:col-span-1">
							<div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm p-6 sticky top-8">
								<div className="mb-6">
									<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Promo code</h3>
									<div className="flex space-x-2">
										<Input
											placeholder="Type here..."
											value={promoCode}
											onChange={(e) => setPromoCode(e.target.value)}
											className="flex-1"
										/>
										<Button onClick={applyPromoCode} className="bg-black hover:bg-gray-800 text-white px-6">
											Apply
										</Button>
									</div>
								</div>

								<div className="space-y-4 mb-6">
									<div className="flex justify-between text-sm">
										<span className="text-gray-600 dark:text-gray-400">Subtotal</span>
										<span className="text-gray-900 dark:text-white">Rp. {subtotal.toFixed(2)}</span>
									</div>
									{discount > 0 && (
										<div className="flex justify-between text-sm">
											<span className="text-gray-600 dark:text-gray-400">Discount</span>
											<span className="text-green-600 dark:text-green-400">-Rp. {discountAmount.toFixed(2)}</span>
										</div>
									)}
									<div className="border-t border-gray-200 dark:border-gray-700 pt-4">
										<div className="flex justify-between">
											<span className="text-lg font-medium text-gray-900 dark:text-white">Total</span>
											<span className="text-lg font-bold text-gray-900 dark:text-white">Rp. {total.toFixed(2)}</span>
										</div>
									</div>
								</div>


								<AlertDialogDemo
									onConfirm={() => router.push('/checkout')}
									title="Checkout Cart"
									message="Are you sure you want to checkout all items from your cart?"
									actionText="checkout"
									variant="default"
								>
									<Button
										className="w-full bg-black hover:bg-gray-800 text-white py-3"
									>
										Continue to checkout
									</Button>
								</AlertDialogDemo>
							</div>
						</div>
					</div>
				)}

				{CartItems.length > 0 && (
					<div className="mt-12">
						<div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-2xl p-8 text-white relative overflow-hidden">
							<div className="relative z-10 flex items-center justify-between">
								<div>
									<h3 className="text-2xl font-bold mb-2">Check the newest menu items</h3>
									<p className="text-gray-300 mb-4">Discover our latest culinary creations</p>
									<Button
										variant="outline"
										className="border-white text-white hover:bg-white hover:text-gray-900 bg-transparent"
										onClick={() => (window.location.href = "/menu")}
									>
										Shop now
									</Button>
								</div>
								<div className="hidden md:block">
									<div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
										<ShoppingCart className="w-16 h-16 text-white" />
									</div>
								</div>
							</div>
							<div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
