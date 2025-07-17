"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart, Menu, X } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { createClient } from '@supabase/supabase-js'

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { cn } from "@/lib/utils"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [cartItemsCount, setCartItemsCount] = useState(0)
  const { user, isLoaded } = useUser()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Fetch cart items count
  useEffect(() => {
    if (user) {
      fetchCartItemsCount()
    } else {
      setCartItemsCount(0)
    }
  }, [user])

  const fetchCartItemsCount = async () => {
    if (!user) return

    try {
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('clerkUserId', user.id)
        .single()

      if (userError) {
        console.error('User not found:', userError)
        return
      }

      // Get cart data
      const { data: cartData, error: cartError } = await supabase
        .from('cart')
        .select('id')
        .eq('userId', userData.id)
        .single()

      if (cartError) {
        if (cartError.code === 'PGRST116') {
          // No cart found, count is 0
          setCartItemsCount(0)
        } else {
          console.error('Error fetching cart:', cartError)
        }
        return
      }

      // Get cart items count
      const { data: cartItemsData, error: cartItemsError } = await supabase
        .from('cartItem')
        .select('quantity')
        .eq('cartId', cartData.id)

      if (cartItemsError) {
        console.error('Error fetching cart items:', cartItemsError)
        return
      }

      // Calculate total quantity
      const totalQuantity = cartItemsData?.reduce((sum, item) => sum + item.quantity, 0) || 0
      setCartItemsCount(totalQuantity)

    } catch (error) {
      console.error('Error fetching cart items count:', error)
    }
  }

  // Listen for cart updates (you can call this function when items are added/removed)
  const updateCartCount = () => {
    fetchCartItemsCount()
  }

  // Expose updateCartCount globally so other components can call it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).updateCartCount = updateCartCount
    }
  }, [user])

  if (!isMounted || !isLoaded) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 h-16 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border transition-all duration-100">
        <div className="flex items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3H6V5h10zm2.5 3H18V5h.5c.83 0 1.5.67 1.5 1.5S19.33 8 18.5 8z" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Cafee</span>
          </div>
        </div>
        
        <div className="hidden md:flex justify-center">
          <div className="h-10 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-8 sm:h-10 sm:w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-8 w-16 sm:h-10 sm:w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </header>
    )
  }

  const getNavigationItems = () => {
    const baseItems = [
      { href: "/", label: "Home" },
      { href: "/menu", label: "Menu" },
      { href: "/about", label: "About" },
    ]

    if (user) {
      const userItems = [
        { href: "/orders", label: "Orders" },
      ]

      if (user.publicMetadata?.role === 'admin' || user.emailAddresses[0]?.emailAddress === 'admin@example.com') {
        userItems.push({ href: "/dashboard", label: "Dashboard" })
      }

      return [...baseItems, ...userItems]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const CartIcon = ({ className }: { className?: string }) => (
    <div className="relative">
      <ShoppingCart className={cn("h-4 w-4", className)} />
      {cartItemsCount > 0 && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold border-2 border-white dark:border-gray-900">
          <span className="text-[10px]">
            {cartItemsCount > 99 ? '99+' : cartItemsCount}
          </span>
        </div>
      )}
    </div>
  )

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 h-16 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border transition-all duration-100">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3H6V5h10zm2.5 3H18V5h.5c.83 0 1.5.67 1.5 1.5S19.33 8 18.5 8z" />
              </svg>
            </div>
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Cafee</span>
          </Link>
        </div>

        <div className="hidden md:flex justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <NavigationMenuLink
                    asChild
                    className={cn(
                      navigationMenuTriggerStyle(),
                      isScrolled
                        ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                        : "hover:bg-accent hover:text-accent-foreground",
                      "transition-all duration-300"
                    )}
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {user && (
            <Link href="/cart" passHref>
              <Button
                variant={isScrolled ? "ghost" : "outline"}
                size="icon"
                className={cn(
                  "transition-all duration-300 relative",
                  isScrolled && "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                )}
              >
                <CartIcon />
              </Button>
            </Link>
          )}

          <div
            className={cn(
              "transition-all duration-300",
              isScrolled && "[&_button]:bg-transparent [&_button]:hover:bg-black/5 [&_button]:dark:hover:bg-white/5 [&_button]:border-transparent"
            )}
          >
            <ModeToggle />
          </div>

          <SignedOut>
            <SignInButton>
              <Button
                variant={isScrolled ? "ghost" : "outline"}
                size="sm"
                className={cn(
                  "transition-all duration-300",
                  isScrolled && "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                )}
              >
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button
                className={cn(
                  "transition-all duration-300",
                  isScrolled
                    ? "bg-[#6c47ff]/90 hover:bg-[#6c47ff] text-white backdrop-blur-sm"
                    : "bg-[#6c47ff] hover:bg-[#6c47ff]/90 text-white"
                )}
                size="sm"
              >
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <div
              className={cn(
                "transition-all duration-300",
                isScrolled && "[&_button]:bg-transparent [&_button]:hover:bg-black/5 [&_button]:dark:hover:bg-white/5"
              )}
            >
              <UserButton />
            </div>
          </SignedIn>
        </div>

        <div className="flex md:hidden items-center gap-2">
          {user && (
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                <CartIcon />
              </Button>
            </Link>
          )}
          
          <ModeToggle />
          
          <SignedIn>
            <UserButton />
          </SignedIn>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleMobileMenu}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-black/20 dark:bg-black/40" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative bg-white dark:bg-background border-b border-border shadow-lg">
            <nav className="px-4 py-6 space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-900 dark:text-gray-100 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              
              <SignedOut>
                <div className="pt-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
                  <SignInButton>
                    <Button variant="outline" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Button>
                  </SignInButton>
                  <SignUpButton>
                    <Button className="w-full bg-[#6c47ff] hover:bg-[#6c47ff]/90" onClick={() => setIsMobileMenuOpen(false)}>
                      Sign Up
                    </Button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}
