import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('menu')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching menus:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menus' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, image, description, category, stock, price } = body

    if (!name || !category || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('menu')
      .insert([{
        name,
        image: image || '',
        description,
        category,
        stock: Number(stock) || 0,
        price: Number(price)
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error creating menu:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create menu item' },
      { status: 500 }
    )
  }
}