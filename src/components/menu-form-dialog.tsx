"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { IconX, IconLoader2 } from "@tabler/icons-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const menuFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().max(500, "Description too long").optional(),
  category: z.string().min(1, "Category is required"),
  stock: z.number().min(0, "Stock must be 0 or greater"),
  price: z.number().min(0, "Price must be 0 or greater"),
})

type MenuFormValues = z.infer<typeof menuFormSchema>

interface Menu {
  id: number
  name: string
  image: string
  description: string | null
  category: string
  stock: number
  price: number
}

interface MenuFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  menu?: Menu | null
  onSuccess: () => void
}

const categories = [
  { value: "appetizer", label: "Appetizer" },
  { value: "main", label: "Main Course" },
  { value: "dessert", label: "Dessert" },
  { value: "beverage", label: "Beverage" },
  { value: "side", label: "Side Dish" },
]

export function MenuFormDialog({
  open,
  onOpenChange,
  menu,
  onSuccess,
}: MenuFormDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const isEditing = !!menu

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuFormSchema),
    defaultValues: {
      name: "",
      image: "",
      description: "",
      category: "",
      stock: 0,
      price: 0,
    },
  })

  React.useEffect(() => {
    if (menu) {
      form.reset({
        name: menu.name,
        image: menu.image,
        description: menu.description || "",
        category: menu.category,
        stock: menu.stock,
        price: menu.price,
      })
    } else {
      form.reset({
        name: "",
        image: "",
        description: "",
        category: "",
        stock: 0,
        price: 0,
      })
    }
  }, [menu, form])

  const onSubmit = async (values: MenuFormValues) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/menu/${menu.id}` : '/api/menu'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save menu item')
      }

      toast.success(
        isEditing ? 'Menu item updated successfully!' : 'Menu item created successfully!'
      )
      onSuccess()
      onOpenChange(false)
      form.reset()
    } catch (error) {
      console.error('Error saving menu:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save menu item')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the menu item details below.'
              : 'Fill in the details to create a new menu item.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter menu item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter menu item description"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="stock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (IDR) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update' : 'Create'} Menu Item
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}