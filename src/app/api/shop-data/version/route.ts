import { NextResponse } from 'next/server'
import { getShopDataLastModified } from '@/db'

// GET /api/shop-data/version - Lightweight check if data has changed
// Frontend can call this to check if they need to refetch data
export async function GET() {
  const lastModified = getShopDataLastModified()
  
  return NextResponse.json({
    success: true,
    lastModified,
  }, {
    headers: {
      // Don't cache this - always fresh
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    }
  })
}
