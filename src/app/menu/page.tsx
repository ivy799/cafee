'use client'

import { useState, useEffect } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Search, Plus, Minus } from "lucide-react"
import { createClient } from '@supabase/supabase-js'
import { useUser } from '@clerk/nextjs'
import { AlertDialogDemo } from '@/components/confirmation'
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"


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
	const [searchQuery, setSearchQuery] = useState('')
	const [sortOption, setSortOption] = useState('popular')
	const [selectedCategory, setSelectedCategory] = useState('all')
	const [categories, setCategories] = useState<string[]>([])
	const [originalMenuItems, setOriginalMenuItems] = useState<MenuItem[]>([])
	const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
	const [quantity, setQuantity] = useState(1)

	const { user } = useUser()

	useEffect(() => {
		fetchMenuItems()
		if (user) {
			fetchCartItems()
		}
	}, [user])

	useEffect(() => {
		if (originalMenuItems.length > 0) {
			const uniqueCategories = Array.from(new Set(originalMenuItems.map(item => item.category)))
			setCategories(uniqueCategories)
			applyFiltersAndSorting()
		}
	}, [sortOption, selectedCategory, searchQuery, originalMenuItems.length])

	const fetchMenuItems = async () => {
		try {
			setLoading(true)
			const { data, error } = await supabase
				.from('menu')
				.select('id, name, image, description, category, price')

			if (error) {
				throw error
			}

			const fetchedData = data || []
			setMenuItems(fetchedData)
			setOriginalMenuItems(fetchedData)
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

			const cartIdToUse = cartData ? cartData.id : cartId;
			if (!cartIdToUse) {
				console.error('No cartId available for fetching cart items.');
				return;
			}
			const { data: cartItemsData, error: cartItemsError } = await supabase
				.from('cartItem')
				.select('menuId')
				.eq('cartId', cartIdToUse)

			if (!cartItemsError && cartItemsData) {
				setCartItems(cartItemsData.map(item => item.menuId))
			}
		} catch (err) {
			console.error('Error fetching cart items:', err)
		}
	}

	const addToCart = async (item: MenuItem, qty: number = 1) => {
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
				.select('id, quantity')
				.eq('cartId', cartId)
				.eq('menuId', item.id)
				.single()

			if (existingItemError && existingItemError.code !== 'PGRST116') {
				console.error('Fetch error:', existingItemError)
				return
			}

			if (existingItem) {
				// Update quantity if item already exists
				const { error: updateError } = await supabase
					.from('cartItem')
					.update({ quantity: existingItem.quantity + qty })
					.eq('id', existingItem.id)

				if (updateError) {
					throw updateError
				}
			} else {
				// Insert new item
				const { error: insertError } = await supabase
					.from('cartItem')
					.insert([
						{
							cartId: cartId,
							menuId: item.id,
							quantity: qty
						}
					])

				if (insertError) {
					throw insertError
				}

				setCartItems(prev => [...prev, item.id])
			}

		} catch (err) {
			console.error('Error adding to cart:', err)
			alert('Gagal menambahkan item ke keranjang')
		}
	}

	const applyFiltersAndSorting = () => {
		let filteredItems = [...originalMenuItems]

		if (selectedCategory !== 'all') {
			filteredItems = filteredItems.filter(item => item.category === selectedCategory)
		}

		if (searchQuery.trim() !== '') {
			filteredItems = filteredItems.filter(item =>
				item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				(item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
			)
		}

		const sortedItems = applySorting(filteredItems, sortOption)
		setMenuItems(sortedItems)
	}

	const handleSearch = () => {
		applyFiltersAndSorting()
	}

	const handleSortMenuItems = (sortBy: string) => {
		setSortOption(sortBy)
	}

	const handleCategoryChange = (category: string) => {
		setSelectedCategory(category)
	}

	const applySorting = (items: MenuItem[], sortBy: string): MenuItem[] => {
		const sortedItems = [...items]

		switch (sortBy) {
			case 'popular':
				return sortedItems.sort((a, b) => b.price - a.price)
			case 'name-asc':
				return sortedItems.sort((a, b) => a.name.localeCompare(b.name))
			case 'name-desc':
				return sortedItems.sort((a, b) => b.name.localeCompare(a.name))
			case 'price-low':
				return sortedItems.sort((a, b) => a.price - b.price)
			case 'price-high':
				return sortedItems.sort((a, b) => b.price - a.price)
			case 'category':
				return sortedItems.sort((a, b) => a.category.localeCompare(b.category))
			default:
				return sortedItems
		}
	}

	const resetFilters = () => {
		setSearchQuery('')
		setSortOption('popular')
		setSelectedCategory('all')
		setMenuItems(originalMenuItems)
	}

	const handleItemClick = (item: MenuItem) => {
		setSelectedItem(item)
		setQuantity(1)
	}

	const incrementQuantity = () => {
		setQuantity(prev => prev + 1)
	}

	const decrementQuantity = () => {
		setQuantity(prev => prev > 1 ? prev - 1 : 1)
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-white dark:bg-background py-12 px-4 sm:px-6 lg:px-8">
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<Skeleton className="h-12 w-96 mx-auto mb-6" />
						<Skeleton className="h-6 w-full max-w-3xl mx-auto mb-2" />
						<Skeleton className="h-6 w-80 mx-auto" />
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{Array.from({ length: 8 }).map((_, index) => (
							<Card key={index} className="border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 flex flex-col">
								<CardContent className="p-4 flex-1">
									<Skeleton className="w-full h-48 rounded-lg mb-3" />
									<Skeleton className="h-5 w-20 mb-2" />
									<div className="space-y-1 mb-3">
										<Skeleton className="h-5 w-full mb-1" />
										<Skeleton className="h-4 w-full mb-1" />
										<Skeleton className="h-4 w-3/4 mb-2" />
										<Skeleton className="h-6 w-24" />
									</div>
								</CardContent>
								<CardFooter className="px-4 pb-4 pt-0">
									<Skeleton className="h-9 w-full" />
								</CardFooter>
							</Card>
						))}
					</div>
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

				<div className="flex flex-col gap-4 mb-8">
					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex flex-1 max-w-md gap-2">
							<div className="relative flex-1">
								<Input
									type="text"
									placeholder="Search for menu"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
								/>
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
							</div>
							<Button
								onClick={handleSearch}
								className="bg-black hover:bg-gray-800 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 px-6 py-2 rounded-lg transition-colors"
							>
								Search
							</Button>
						</div>

						<Button
							onClick={resetFilters}
							variant="outline"
							className="border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
						>
							Reset
						</Button>
					</div>

					<div className="flex flex-col sm:flex-row gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Category:</span>
							<Select value={selectedCategory} onValueChange={handleCategoryChange}>
								<SelectTrigger className="w-[160px] border-gray-300 dark:border-gray-600">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Categories</SelectItem>
									{categories.map((category) => (
										<SelectItem key={category} value={category}>
											{category}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="flex items-center gap-2">
							<span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Sort by:</span>
							<Select value={sortOption} onValueChange={handleSortMenuItems}>
								<SelectTrigger className="w-[160px] border-gray-300 dark:border-gray-600">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="popular">Popular</SelectItem>
									<SelectItem value="name-asc">Name A-Z</SelectItem>
									<SelectItem value="name-desc">Name Z-A</SelectItem>
									<SelectItem value="price-low">Price: Low to High</SelectItem>
									<SelectItem value="price-high">Price: High to Low</SelectItem>
									<SelectItem value="category">Category</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{(selectedCategory !== 'all' || searchQuery.trim() !== '') && (
						<div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
							<div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
								<span>Active filters:</span>
								{selectedCategory !== 'all' && (
									<Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
										{selectedCategory}
									</Badge>
								)}
								{searchQuery.trim() !== '' && (
									<Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
										"{searchQuery}"
									</Badge>
								)}
								<span className="ml-2">({menuItems.length} items)</span>
							</div>
						</div>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
					{menuItems.length > 0 ? (
						menuItems.map((product) => (
							<Card
								key={product.id}
								className="group hover:shadow-xl transition-all duration-300 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-500 flex flex-col cursor-pointer"
								onClick={() => handleItemClick(product)}
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
									<AlertDialogDemo
										onConfirm={() => addToCart(product)}
										title="Add to Cart"
										message="Are you sure you want to add this item to cart?"
										actionText="Add item"
										variant="default"
									>
										<Button
											className="w-full bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg h-9 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
											size="sm"
											disabled={cartItems.includes(product.id)}
											onClick={(e) => e.stopPropagation()}
										>
											<ShoppingCart className="w-4 h-4 mr-2" />
											{cartItems.includes(product.id) ? 'In Cart' : 'Add to cart'}
										</Button>
									</AlertDialogDemo>
								</CardFooter>
							</Card>
						))
					) : (
						<div className="col-span-full text-center py-12">
							<p className="text-lg text-gray-500 dark:text-gray-400">
								No items found matching your criteria.
							</p>
						</div>
					)}
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

			{/* Item Detail Sheet */}
			<Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
				<SheetContent className="sm:max-w-lg w-full overflow-y-auto">
					{selectedItem && (
						<div className="flex flex-col h-full">
							<div className="flex items-start justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
								<div className="flex-1 p-4">
									<SheetTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-2">
										{selectedItem.name}
									</SheetTitle>
									<SheetDescription className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
										{selectedItem.description || "Delicious item from our menu selection"}
									</SheetDescription>
								</div>
								<SheetClose asChild>
									<Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
									</Button>
								</SheetClose>
							</div>

							{/* Content */}
							<div className="flex-1 py-6 space-y-6">
								<div className="px-4">
									<div className="relative overflow-hidden rounded-xl bg-gray-50 dark:bg-gray-800 shadow-sm p-4">
										<Image
											src={selectedItem.image || "/placeholder.svg"}
											alt={selectedItem.name}
											width={500}
											height={300}
											className="w-full h-72 object-cover"
											crossOrigin="anonymous"
										/>
									</div>
								</div>

								<div className="space-y-6 p-4">
									<div className="flex items-center gap-2">
										<Badge
											variant="secondary"
											className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 border-0 px-3 py-1 text-sm font-medium"
										>
											{selectedItem.category}
										</Badge>
									</div>

									<div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
										<Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
											Price
										</Label>
										<p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">
											Rp. {selectedItem.price.toLocaleString("id-ID")}
										</p>
									</div>

									<Separator className="my-6" />

									<div className="space-y-4">
										<Label className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
											Quantity
										</Label>
										<div className="flex items-center justify-center gap-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
											<Button
												variant="outline"
												size="icon"
												onClick={decrementQuantity}
												disabled={quantity <= 1}
												className="h-12 w-12 rounded-full border-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 bg-transparent"
											>
												<Minus className="h-5 w-5" />
											</Button>
											<div className="flex items-center justify-center min-w-[4rem]">
												<span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{quantity}</span>
											</div>
											<Button
												variant="outline"
												size="icon"
												onClick={incrementQuantity}
												className="h-12 w-12 rounded-full border-2 hover:bg-gray-100 dark:hover:bg-gray-700 bg-transparent"
											>
												<Plus className="h-5 w-5" />
											</Button>
										</div>
									</div>

									<Separator className="my-6" />

									<div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
										<div className="flex justify-between items-center">
											<div>
												<p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
													Total Amount
												</p>
												<p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
													{quantity} × Rp. {selectedItem.price.toLocaleString("id-ID")}
												</p>
											</div>
											<div className="text-right">
												<p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
													Rp. {(selectedItem.price * quantity).toLocaleString("id-ID")}
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div className="border-t border-gray-200 dark:border-gray-700 pt-6 pb-2 p-4">
								<div className="flex gap-3">
									<SheetClose asChild>
										<Button
											variant="outline"
											className="flex-1 h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 bg-transparent"
										>
											Close
										</Button>
									</SheetClose>
									<AlertDialogDemo
										onConfirm={() => {
											addToCart(selectedItem, quantity)
											setSelectedItem(null)
										}}
										title="Add to Cart"
										message={`Are you sure you want to add ${quantity} ${selectedItem.name}(s) to cart?`}
										actionText="Add to cart"
										variant="default"
									>
										<Button
											className="flex-1 h-12 bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
											disabled={cartItems.includes(selectedItem.id)}
										>
											<ShoppingCart className="w-5 h-5 mr-2" />
											{cartItems.includes(selectedItem.id) ? "Already in Cart" : `Add ${quantity} to Cart`}
										</Button>
									</AlertDialogDemo>
								</div>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	)
}

