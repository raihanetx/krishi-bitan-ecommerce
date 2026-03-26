import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Order } from '@/types'

interface OrderState {
  orders: Order[]
  isLoading: boolean
  addOrder: (order: Order) => void
  updateOrder: (orderId: string, updates: Partial<Order>) => void
  clearOrders: () => void
  fetchOrderUpdates: (phone?: string, orderId?: string) => Promise<void>
}

export const useOrderStore = create<OrderState>()(
  persist(
    (set, get) => ({
      orders: [],
      isLoading: false,

      addOrder: (order: Order) => {
        set((state) => ({
          orders: [order, ...state.orders]
        }))
      },

      updateOrder: (orderId: string, updates: Partial<Order>) => {
        set((state) => ({
          orders: state.orders.map(order => 
            order.id === orderId ? { ...order, ...updates } : order
          )
        }))
      },

      clearOrders: () => {
        set({ orders: [] })
      },

      // Fetch updated order status from database
      fetchOrderUpdates: async (phone?: string, orderId?: string) => {
        const { orders } = get()
        if (orders.length === 0 && !orderId) return
        
        set({ isLoading: true })
        
        try {
          // If we have a phone number, fetch all orders for that phone
          // Otherwise, fetch only the specific order
          const params = new URLSearchParams()
          if (phone) {
            params.set('phone', phone)
          } else if (orderId) {
            params.set('orderId', orderId)
          } else if (orders.length > 0) {
            // Fetch the most recent order
            params.set('orderId', orders[0].id)
          }
          
          const response = await fetch(`/api/track-order?${params.toString()}`)
          const result = await response.json()
          
          if (result.success && result.data) {
            const dbOrders = result.data as Order[]
            
            // Update local orders with database status
            set((state) => ({
              orders: state.orders.map(localOrder => {
                const dbOrder = dbOrders.find((o: Order) => o.id === localOrder.id)
                if (dbOrder) {
                  // Update status from database
                  return {
                    ...localOrder,
                    status: dbOrder.status,
                    courierStatus: dbOrder.courierStatus,
                    canceledBy: dbOrder.canceledBy,
                    consignmentId: dbOrder.consignmentId,
                    trackingCode: dbOrder.trackingCode,
                  }
                }
                return localOrder
              }),
              isLoading: false
            }))
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Error fetching order updates:', error)
          set({ isLoading: false })
        }
      }
    }),
    {
      name: 'ecomart-orders',
    }
  )
)
