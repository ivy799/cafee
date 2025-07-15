import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { transactionId } = await request.json()
    
    if (!transactionId) {
      return NextResponse.json({ 
        success: false,
        error: 'Transaction ID required' 
      }, { status: 400 })
    }

    const simulatedNotification = {
      order_id: transactionId,
      status_code: "200",
      gross_amount: "100000.00",
      transaction_status: "settlement", 
      fraud_status: "accept",
      payment_type: "credit_card",
      transaction_time: new Date().toISOString(),
      signature_key: "test_signature_for_development"
    }

    console.log('🔄 Sending simulated notification:', simulatedNotification)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   `${request.nextUrl.protocol}//${request.nextUrl.host}`

    const notificationResponse = await fetch(`${baseUrl}/api/payment/notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Midtrans-TestSuite/1.0'
      },
      body: JSON.stringify(simulatedNotification)
    })

    let result
    try {
      result = await notificationResponse.json()
    } catch (parseError) {
      console.error('Failed to parse notification response:', parseError)
      throw new Error('Invalid response from notification endpoint')
    }

    console.log('Notification response:', result)

    if (!notificationResponse.ok) {
      throw new Error(`Notification endpoint returned ${notificationResponse.status}: ${result.error || 'Unknown error'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Test notification sent successfully',
      notification_sent: simulatedNotification,
      notification_response: result,
      endpoint_used: `${baseUrl}/api/payment/notification`
    })

  } catch (error) {
    console.error('Test notification failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Test notification failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test notification endpoint is active',
    description: 'Use POST method with transactionId to test payment notifications',
    example_payload: {
      transactionId: 'ORDER-123-1234567890'
    },
    timestamp: new Date().toISOString()
  })
}