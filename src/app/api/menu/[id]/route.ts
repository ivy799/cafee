import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching menu:', error)
    return NextResponse.json(
      { success: false, error: 'Menu item not found' },
      { status: 404 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, image, description, category, stock, price } = body

    if (!name || !category || price === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('menu')
      .update({
        name,
        image: image || '',
        description,
        category,
        stock: Number(stock) || 0,
        price: Number(price)
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error updating menu:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update menu item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: existingMenu, error: fetchError } = await supabase
      .from('menu')
      .select('id')
      .eq('id', params.id)
      .single()

    if (fetchError || !existingMenu) {
      return NextResponse.json(
        { success: false, error: 'Menu item not found' },
        { status: 404 }
      )
    }

    const [orderItemsCheck, cartItemsCheck] = await Promise.all([
      supabase
        .from('orderItems')
        .select('id')
        .eq('menuId', params.id)
        .limit(1),
      supabase
        .from('cartItem')
        .select('id')
        .eq('menuId', params.id)
        .limit(1)
    ])

    if (orderItemsCheck.data && orderItemsCheck.data.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete menu item that has been ordered' },
        { status: 400 }
      )
    }

    if (cartItemsCheck.data && cartItemsCheck.data.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete menu item that is in customer carts' },
        { status: 400 }
      )
    }

    await supabase
      .from('reviews')
      .delete()
      .eq('menuId', params.id)

    const { error: deleteError } = await supabase
      .from('menu')
      .delete()
      .eq('id', params.id)

    if (deleteError) throw deleteError

    return NextResponse.json({ success: true, message: 'Menu item deleted successfully' })
  } catch (error) {
    console.error('Error deleting menu:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete menu item' },
      { status: 500 }
    )
  }
}