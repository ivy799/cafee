"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { MenuTable } from "@/components/menu-table"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Menu } from "lucide-react"

export default function UsersPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="px-4 lg:px-6 py-4">
              <div className="space-y-4 md:space-y-6">
                <div className="flex flex-col gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">Menu Management</h1>
                  <p className="text-muted-foreground">
                    Manage your Menu, view their activity, and control permissions.
                  </p>
                </div>
                <MenuTable />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}