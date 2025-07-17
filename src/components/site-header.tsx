"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/dashboard":
      return "Dashboard"
    case "/dashboard/users":
      return "Users Management"
    case "/dashboard/menu":
      return "Menu Management"
    case "/dashboard/analytics":
      return "Analytics"
    case "/dashboard/settings":
      return "Settings"
    default:
      return "Dashboard"
  }
}

export function SiteHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{pageTitle}</h1>
        </div>
      </div>
    </header>
  )
}
