'use client'

import { Suspense, useCallback, useEffect } from 'react'
import MainLayout from '@/components/layout/MainLayout'
import Orders from '@/components/orders/Orders'
import { useOrderStore } from '@/store'
import { useAppRouter } from '@/hooks/useAppRouter'

function HistoryContent() {
  const { navigate } = useAppRouter()
  const { orders, fetchOrderUpdates, isLoading } = useOrderStore()
  
  // Fetch order status updates from database on mount
  useEffect(() => {
    if (orders.length > 0) {
      // Get unique phone numbers from orders
      const phones = [...new Set(orders.map(o => o.phone).filter(Boolean))]
      if (phones.length > 0) {
        // Fetch updates for the first phone number
        fetchOrderUpdates(phones[0])
      }
    }
  }, []) // Only on mount
  
  // Handle navigation
  const handleNavigate = useCallback(() => {
    navigate('shop')
  }, [navigate])

  return <Orders orders={orders} setView={handleNavigate} isLoading={isLoading} />
}

export default function HistoryPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full h-full absolute inset-0 skeleton-shimmer" />
      </div>
    }>
      <MainLayout>
        <HistoryContent />
      </MainLayout>
    </Suspense>
  )
}
