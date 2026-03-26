import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orders, orderItems } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { checkRateLimit, rateLimitErrorResponse } from '@/lib/validation'

// GET /api/track-order - Public endpoint to track order status by order ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const phone = searchParams.get('phone')
    
    if (!orderId && !phone) {
      return NextResponse.json(
        { success: false, error: 'Order ID or phone number is required' },
        { status: 400 }
      )
    }
    
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const rateLimitKey = `track-order:${ip}`
    const rateLimit = checkRateLimit(rateLimitKey, 30, 60000) // 30 requests per minute

    if (!rateLimit.allowed) {
      return rateLimitErrorResponse(rateLimit.resetAt)
    }
    
    let orderResult: any[] = []
    
    if (orderId) {
      // Fetch by order ID
      orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1)
    } else if (phone) {
      // Fetch by phone number (get all orders for this phone)
      orderResult = await db.select().from(orders).where(eq(orders.phone, phone))
    }
    
    if (orderResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }
    
    // Fetch items for the order(s)
    const orderIds = orderResult.map(o => o.id)
    const allItems = await db.select().from(orderItems)
    
    // Build items lookup
    const itemsByOrderId: Record<string, any[]> = {}
    for (const item of allItems) {
      if (orderIds.includes(item.orderId || '')) {
        if (!itemsByOrderId[item.orderId || '']) {
          itemsByOrderId[item.orderId || ''] = []
        }
        itemsByOrderId[item.orderId || ''].push({
          name: item.name,
          variant: item.variant,
          qty: item.qty,
          basePrice: item.basePrice,
          offerText: item.offerText,
          offerDiscount: item.offerDiscount || 0,
          couponCode: item.couponCode,
          couponDiscount: item.couponDiscount || 0,
          productId: item.productId,
        })
      }
    }
    
    // Attach items to orders
    const ordersWithItems = orderResult.map(order => ({
      id: order.id,
      customer: order.customerName,
      phone: order.phone,
      address: order.address,
      date: order.date,
      time: order.time,
      paymentMethod: order.paymentMethod,
      status: order.status,
      courierStatus: order.courierStatus,
      subtotal: order.subtotal,
      delivery: order.delivery,
      discount: order.discount,
      couponCodes: order.couponCodes ? JSON.parse(order.couponCodes) : [],
      couponAmount: order.couponAmount,
      total: order.total,
      canceledBy: order.canceledBy,
      consignmentId: order.consignmentId,
      trackingCode: order.trackingCode,
      items: itemsByOrderId[order.id] || []
    }))
    
    return NextResponse.json({
      success: true,
      data: ordersWithItems
    })
  } catch (error) {
    console.error('Error tracking order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to track order' },
      { status: 500 }
    )
  }
}
