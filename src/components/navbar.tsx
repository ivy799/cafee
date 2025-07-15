"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"

import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu"
import { navigationMenuTriggerStyle } from "@/components/ui/navigation-menu"
import { ModeToggle } from "@/components/ui/mode-toggle"

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
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

  if (!isMounted || !isLoaded) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 h-16 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border transition-all duration-100">
        <div className="flex items-center">
          {/* Enhanced Logo */}
          <div className="flex items-center space-x-3">
            <div className="relative w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3H6V5h10zm2.5 3H18V5h.5c.83 0 1.5.67 1.5 1.5S19.33 8 18.5 8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Cafee</span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="h-10 w-80 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 h-16 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border transition-all duration-100">
      <div className="flex items-center">
        {/* Enhanced Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 rounded-xl flex items-center justify-center shadow-lg">
            <svg className="w-6 h-6 text-white dark:text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.5 3H6c-1.1 0-2 .9-2 2v5.71c0 3.83 2.95 7.18 6.78 7.29 3.96.12 7.22-3.06 7.22-7v-1h.5c1.93 0 3.5-1.57 3.5-3.5S20.43 3 18.5 3zM16 5v3H6V5h10zm2.5 3H18V5h.5c.83 0 1.5.67 1.5 1.5S19.33 8 18.5 8z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">Cafee</span>
        </div>
      </div>

      <div className="flex justify-center">
        <NavigationMenu>
          <NavigationMenuList>
            {navigationItems.map((item) => (
              <NavigationMenuItem key={item.href}>
                <NavigationMenuLink
                  asChild
                  className={`${navigationMenuTriggerStyle()} ${
                    isScrolled
                      ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                      : "hover:bg-accent hover:text-accent-foreground"
                  } transition-all duration-300`}
                >
                  <Link href={item.href}>{item.label}</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <Link href="/cart" passHref>
            <Button
              variant={isScrolled ? "ghost" : "outline"}
              size="icon"
              className={`transition-all duration-300 ${
                isScrolled ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-transparent" : ""
              }`}
            >
              <ShoppingCart />
            </Button>
          </Link>
        )}

        <div
          className={`transition-all duration-300 ${
            isScrolled
              ? "[&_button]:bg-transparent [&_button]:hover:bg-black/5 [&_button]:dark:hover:bg-white/5 [&_button]:border-transparent"
              : ""
          }`}
        >
          <ModeToggle />
        </div>

        <SignedOut>
          <SignInButton>
            <Button
              variant={isScrolled ? "ghost" : "outline"}
              className={`transition-all duration-300 ${
                isScrolled ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 border-transparent" : ""
              }`}
            >
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton>
            <button
              className={`rounded-full font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer transition-all duration-300 ${
                isScrolled
                  ? "bg-[#6c47ff]/90 hover:bg-[#6c47ff] text-white backdrop-blur-sm"
                  : "bg-[#6c47ff] hover:bg-[#6c47ff]/90 text-white"
              }`}
            >
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>

        <SignedIn>
          <div
            className={`transition-all duration-300 ${
              isScrolled ? "[&_button]:bg-transparent [&_button]:hover:bg-black/5 [&_button]:dark:hover:bg-white/5" : ""
            }`}
          >
            <UserButton />
          </div>
        </SignedIn>
      </div>
    </header>
  )
}
