"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

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

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      setIsScrolled(scrollTop > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center p-4 h-16 bg-white/80 dark:bg-background/80 backdrop-blur-md border-b border-border transition-all duration-100">
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" className="fill-[#6c47ff] dark:fill-[#8b5cf6]">
            <path d="M6 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8z" />
            <path d="M22 10h2a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-2" className="fill-[#6c47ff]/70 dark:fill-[#8b5cf6]/70" />
            <circle cx="10" cy="12" r="1" className="fill-white dark:fill-gray-900" />
            <circle cx="14" cy="12" r="1" className="fill-white dark:fill-gray-900" />
            <path
              d="M9 16a3 3 0 0 0 6 0"
              stroke="white"
              strokeWidth="1.5"
              fill="none"
              className="stroke-white dark:stroke-gray-900"
            />
          </svg>
          <div className="text-xl font-bold text-[#6c47ff] dark:text-[#8b5cf6]">Cafee</div>
        </div>
      </div>

      <div className="flex justify-center">
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={`${navigationMenuTriggerStyle()} ${
                  isScrolled
                    ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                    : "hover:bg-accent hover:text-accent-foreground"
                } transition-all duration-300`}
              >
                <Link href="/">Home</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={`${navigationMenuTriggerStyle()} ${
                  isScrolled
                    ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                    : "hover:bg-accent hover:text-accent-foreground"
                } transition-all duration-300`}
              >
                <Link href="/menu">Menu</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={`${navigationMenuTriggerStyle()} ${
                  isScrolled
                    ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                    : "hover:bg-accent hover:text-accent-foreground"
                } transition-all duration-300`}
              >
                <Link href="/about">About</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                asChild
                className={`${navigationMenuTriggerStyle()} ${
                  isScrolled
                    ? "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                    : "hover:bg-accent hover:text-accent-foreground"
                } transition-all duration-300`}
              >
                <Link href="/dashboard">dashboard</Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      <div className="flex items-center gap-4">
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
