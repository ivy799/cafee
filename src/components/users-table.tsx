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
  IconUserCheck,
  IconUserX,
  IconTrendingUp,
  IconTrendingDown,
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

interface User {
  id: number
  clerkUserId: string
  email: string
  name: string | null
  imageUrl: string | null
  role: string
  createdAt: string
  _count?: {
    orders: number
    reviews: number
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

const columns: ColumnDef<User>[] = [
  {
    accessorKey: "user",
    header: "User",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.imageUrl || ""} alt={user.name || user.email} />
            <AvatarFallback>
              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 dark:text-white">
              {user.name || "No name"}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
    // Custom filter function for searching across name and email
    filterFn: (row, columnId, filterValue) => {
      const user = row.original
      const searchValue = filterValue.toLowerCase()
      
      const name = user.name?.toLowerCase() || ""
      const email = user.email.toLowerCase()
      
      return name.includes(searchValue) || email.includes(searchValue)
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge
          variant={role === "admin" ? "default" : "secondary"}
          className={role === "admin" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" : ""}
        >
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "orders",
    header: "Orders",
    cell: ({ row }) => {
      const count = row.original._count?.orders || 0
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
      return (
        <div className="text-center">
          <span className="font-medium">{count}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const user = row.original
      const isActive = user.role !== "banned"
      return (
        <Badge variant={isActive ? "default" : "destructive"}>
          {isActive ? (
            <>
              <IconUserCheck className="w-3 h-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <IconUserX className="w-3 h-3 mr-1" />
              Banned
            </>
          )}
        </Badge>
      )
    },
  },
]

export function UsersTable() {
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  React.useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, clerkUserId, email, name, imageUrl, role, createdAt')
        .order('createdAt', { ascending: false })

      if (usersError) {
        throw usersError
      }

      const usersWithCounts = await Promise.all(
        (usersData || []).map(async (user) => {
          const [ordersCount, reviewsCount] = await Promise.all([
            supabase
              .from('order')
              .select('id', { count: 'exact' })
              .eq('userId', user.id),
            supabase
              .from('reviews')
              .select('id', { count: 'exact' })
              .eq('userId', user.id)
          ])

          return {
            ...user,
            _count: {
              orders: ordersCount.count || 0,
              reviews: reviewsCount.count || 0
            }
          }
        })
      )

      setUsers(usersWithCounts)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  // Custom global filter function
  const globalFilterFn = React.useCallback((row: any, columnId: string, filterValue: string) => {
    const user = row.original as User
    const searchValue = filterValue.toLowerCase()
    
    // Search across multiple fields
    const searchableFields = [
      user.name?.toLowerCase() || "",
      user.email.toLowerCase(),
      user.role.toLowerCase(),
      user.clerkUserId.toLowerCase()
    ]
    
    return searchableFields.some(field => field.includes(searchValue))
  }, [])

  const table = useReactTable({
    data: users,
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
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      globalFilter,
    },
  })

  const totalUsers = users.length
  const activeUsers = users.filter(user => user.role !== "banned").length
  const adminUsers = users.filter(user => user.role === "admin").length

  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  
  const thisMonthUsers = users.filter(user => {
    const userDate = new Date(user.createdAt)
    return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear
  })
  
  const lastMonthUsers = users.filter(user => {
    const userDate = new Date(user.createdAt)
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
    return userDate.getMonth() === lastMonth && userDate.getFullYear() === lastMonthYear
  })

  const userGrowth = lastMonthUsers.length > 0 
    ? ((thisMonthUsers.length - lastMonthUsers.length) / lastMonthUsers.length * 100)
    : thisMonthUsers.length > 0 ? 100 : 0

  const activeRate = totalUsers > 0 ? (activeUsers / totalUsers * 100) : 0
  const adminRate = totalUsers > 0 ? (adminUsers / totalUsers * 100) : 0

  // Clear search function
  const clearSearch = () => {
    setGlobalFilter("")
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
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

  const filteredUsers = table.getFilteredRowModel().rows.length

  return (
    <div className="space-y-4">
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @lg/main:grid-cols-3">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {totalUsers.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {userGrowth >= 0 ? <IconTrendingUp /> : <IconTrendingDown />}
                {userGrowth >= 0 ? '+' : ''}{userGrowth.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {userGrowth >= 0 ? 'Growing user base' : 'Declining users'}{' '}
              {userGrowth >= 0 ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              User registration this month
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {activeUsers.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                {activeRate.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              High activity rate <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Users with active status
            </div>
          </CardFooter>
        </Card>
        
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>Admin Users</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {adminUsers.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                {adminRate.toFixed(1)}%
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Admin privileges <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Users with admin access
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
          <CardDescription>
            Manage your users, view their activity, and control permissions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users"
                  value={globalFilter}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  className="pl-8 max-w-sm"
                />
              </div>
              {globalFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearch}
                  className="h-8 px-2 lg:px-3"
                >
                  Clear
                </Button>
              )}
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
            </div>
          </div>

          {/* Search Results Info */}
          {globalFilter && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between text-sm">
                <div className="text-blue-800 dark:text-blue-200">
                  <strong>{filteredUsers}</strong> user{filteredUsers !== 1 ? 's' : ''} found for "{globalFilter}"
                </div>
                {filteredUsers !== totalUsers && (
                  <div className="text-blue-600 dark:text-blue-400">
                    ({totalUsers - filteredUsers} hidden)
                  </div>
                )}
              </div>
            </div>
          )}

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
                      {globalFilter ? (
                        <div className="flex flex-col items-center gap-2">
                          <p>No users found matching "{globalFilter}"</p>
                          <Button variant="outline" size="sm" onClick={clearSearch}>
                            Clear search
                          </Button>
                        </div>
                      ) : (
                        "No users found."
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              {globalFilter ? (
                <span>
                  Showing {filteredUsers} of {totalUsers} user{totalUsers !== 1 ? 's' : ''}
                </span>
              ) : (
                <span>
                  {totalUsers} user{totalUsers !== 1 ? 's' : ''} total
                </span>
              )}
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