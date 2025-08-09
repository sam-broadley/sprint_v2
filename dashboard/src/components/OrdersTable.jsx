import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Badge } from './ui/badge'
import { RealtimeIndicator } from './RealtimeIndicator'
import { getCustomerDisplayName } from '../lib/customerUtils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'

const statusColors = {
  paid: 'success',
  in_production: 'info',
  completed: 'secondary'
}

const statusLabels = {
  paid: 'Paid',
  in_production: 'In Production',
  completed: 'Completed'
}

export function OrdersTable({ searchQuery, onRowClick }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchOrders()
    
    const subscription = supabase
      .channel('orders_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: 'status=in.(paid,in_production,completed)'
        }, 
        (payload) => {
          console.log('Real-time orders update:', payload)
          setLastUpdated(new Date())
          fetchOrders()
        }
      )
      .subscribe((status) => {
        console.log('Orders subscription status:', status)
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected')
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected')
        } else if (status === 'TIMED_OUT') {
          setRealtimeStatus('disconnected')
        }
      })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .in('status', ['paid', 'in_production', 'completed'])
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('Orders data:', data) // Debug log
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    const customerName = getCustomerDisplayName(order)
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower) ||
      order.customers?.email?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="p-4">
        <span>Loading orders...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          {filteredOrders.length} Order{filteredOrders.length !== 1 ? 's' : ''}
        </h3>
      </div>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Total Amount</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredOrders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No orders found
            </TableCell>
          </TableRow>
        ) : (
          filteredOrders.map((order) => (
            <TableRow 
              key={order.id} 
              onClick={() => onRowClick(order)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                {order.order_number || `#${order.id}`}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {getCustomerDisplayName(order)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {order.customers?.email}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {order.total_amount ? `$${order.total_amount}` : 'Not set'}
              </TableCell>
              <TableCell>
                {format(new Date(order.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[order.status]}>
                  {statusLabels[order.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      </Table>
    </div>
  )
}