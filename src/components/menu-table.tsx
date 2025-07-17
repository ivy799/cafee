"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconLayoutColumns,
  IconPlus,
  IconSearch,
  IconStar,
  IconPackage,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
} from "@tabler/icons-react"
import { createClient } from '@supabase/supabase-js'

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface Menu {
  id: number
  name: string
  image: string
  description: string | null
  category: string
  stock: number
  price: number
  _count?: {
    orderItems: number
    reviews: number
  }
  _avg?: {
    rating: number
  }
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

const columns: ColumnDef<Menu>[] = [
  {
    accessorKey: "menu",
    header: "Menu Item",
    cell: ({ row }) => {
      const menu = row.original
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12 rounded-lg">
            <AvatarImage src={menu.image} alt={menu.name} className="object-cover" />
            <AvatarFallback className="rounded-lg">
              {menu.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {menu.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">
              {menu.description || "No description"}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      const categoryColors = {
        "appetizer": "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        "main": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        "dessert": "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
        "beverage": "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
        "side": "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      }
      return (
        <Badge
          variant="secondary"
          className={categoryColors[category as keyof typeof categoryColors] || ""}
        >
          {category}
        </Badge>
      )
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const price = row.getValue("price") as number
      return (
        <div className="flex items-center">
          <IconCurrencyDollar className="w-4 h-4 mr-1 text-green-600" />
          <span className="font-medium">
            {new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0,
            }).format(price)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number
      const isLowStock = stock < 10
      const isOutOfStock = stock === 0
      return (
        <div className="flex items-center">
          <IconPackage className={`w-4 h-4 mr-1 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-yellow-500' : 'text-green-500'}`} />
          <span className={`font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
            {stock}
          </span>
          {isLowStock && !isOutOfStock && (
            <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
              Low
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="destructive" className="ml-2">
              Out
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "orders",
    header: "Orders",
    cell: ({ row }) => {
      const count = row.original._count?.orderItems || 0
      return (
        <div className="text-center">
          <span className="font-medium">{count}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "reviews",
    header: "Reviews",
    cell: ({ row }) => {
      const count = row.original._count?.reviews || 0
      const avgRating = row.original._avg?.rating || 0
      return (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{count}</span>
          {count > 0 && (
            <div className="flex items-center">
              <IconStar className="w-4 h-4 text-yellow-500 fill-current" />
              <span className="text-sm ml-1">{avgRating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )
    },
  },
]

export function MenuTable() {
  const [menus, setMenus] = React.useState<Menu[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  React.useEffect(() => {
    fetchMenus()
  }, [])

  const fetchMenus = async () => {
    try {
      setLoading(true)
      
      const { data: menusData, error: menusError } = await supabase
        .from('menu')
        .select('id, name, image, description, category, stock, price')
        .order('name', { ascending: true })

      if (menusError) {
        throw menusError
      }

      const menusWithCounts = await Promise.all(
        (menusData || []).map(async (menu) => {
          const [orderItemsCount, reviewsData] = await Promise.all([
            supabase
              .from('orderItems')
              .select('id', { count: 'exact' })
              .eq('menuId', menu.id),
            supabase
              .from('reviews')
              .select('rating')
              .eq('menuId', menu.id)
          ])

          const avgRating = reviewsData.data && reviewsData.data.length > 0
            ? reviewsData.data.reduce((sum, review) => sum + review.rating, 0) / reviewsData.data.length
            : 0

          return {
            ...menu,
            _count: {
              orderItems: orderItemsCount.count || 0,
              reviews: reviewsData.data?.length || 0
            },
            _avg: {
              rating: avgRating
            }
          }
        })
      )

      setMenus(menusWithCounts)
    } catch (error) {
      console.error('Error fetching menus:', error)
    } finally {
      setLoading(false)
    }
  }

  const table = useReactTable({
    data: menus,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  })

  const totalMenus = menus.length
  const lowStockItems = menus.filter(menu => menu.stock < 10 && menu.stock > 0).length
  const outOfStockItems = menus.filter(menu => menu.stock === 0).length
  const totalValue = menus.reduce((sum, menu) => sum + (menu.price * menu.stock), 0)

  const categories = [...new Set(menus.map(menu => menu.category))]
  const mostPopularCategory = categories.reduce((prev, current) => {
    const prevCount = menus.filter(menu => menu.category === prev).length
    const currentCount = menus.filter(menu => menu.category === current).length
    return currentCount > prevCount ? current : prev
  }, categories[0] || "")

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="@container/card animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
              </CardHeader>
              <CardFooter className="flex-col items-start gap-1.5 text-sm">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </CardFooter>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @lg/main:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Menu Items</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalMenus.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                {categories.length} categories
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Active menu items <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Most popular: {mostPopularCategory}
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Low Stock Items</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {lowStockItems.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                <IconPackage />
                Warning
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Items need restocking <IconPackage className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Stock below 10 items
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Out of Stock</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {outOfStockItems.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="destructive">
                <IconTrendingDown />
                Critical
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Unavailable items <IconTrendingDown className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Need immediate restocking
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Inventory Value</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                notation: 'compact',
                maximumFractionDigits: 1,
              }).format(totalValue)}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconCurrencyDollar />
                Stock value
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Current inventory worth <IconCurrencyDollar className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Total stock × price
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Menu Table */}
      <Card>
        <CardHeader>
          <CardTitle>Menu Management</CardTitle>
          <CardDescription>
            Manage your menu items, update stock levels, and track performance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search menu items..."
                  value={(table.getColumn("menu")?.getFilterValue() as string) ?? ""}
                  onChange={(event) =>
                    table.getColumn("menu")?.setFilterValue(event.target.value)
                  }
                  className="pl-8 max-w-sm"
                />
              </div>
              <Select
                value={(table.getColumn("category")?.getFilterValue() as string) ?? ""}
                onValueChange={(value) =>
                  table.getColumn("category")?.setFilterValue(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <IconLayoutColumns className="mr-2 h-4 w-4" />
                    Columns
                    <IconChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      )
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button size="sm">
                <IconPlus className="mr-2 h-4 w-4" />
                Add Menu Item
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No menu items found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {menus.length} menu items found in table
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium">Rows per page</p>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value))
                  }}
                >
                  <SelectTrigger className="h-8 w-[70px]">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(0)}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to first page</span>
                  <IconChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <span className="sr-only">Go to previous page</span>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to next page</span>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                  disabled={!table.getCanNextPage()}
                >
                  <span className="sr-only">Go to last page</span>
                  <IconChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}