import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { X, Phone, Building2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'

const statusProgression = {
  quote_requested: 'quote_sent',
  quote_sent: 'paid',
  paid: 'in_production',
  in_production: 'completed'
}

const statusLabels = {
  quote_requested: 'Quote Requested',
  quote_sent: 'Quote Sent',
  paid: 'Paid',
  in_production: 'In Production',
  completed: 'Completed'
}

export function OrderRightSidebar({ order, isOpen, onClose }) {
  const [uploads, setUploads] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [totalAmount, setTotalAmount] = useState(order?.total_amount || '')
  const [updating, setUpdating] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(order)

  useEffect(() => {
    if (order?.id) {
      setCurrentOrder(order)
      fetchUploads()
      fetchOrderItems()
      setTotalAmount(order.total_amount || '')
      
      // Set up real-time subscription for this specific order
      const subscription = supabase
        .channel(`order_${order.id}_changes`)
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'orders',
            filter: `id=eq.${order.id}`
          }, 
          (payload) => {
            console.log('Real-time order update:', payload)
            if (payload.new) {
              setCurrentOrder({...currentOrder, ...payload.new})
              setTotalAmount(payload.new.total_amount || '')
            }
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [order])

  const fetchUploads = async () => {
    try {
      // Get uploads through designs and order_items since uploads are linked to designs
      const { data, error } = await supabase
        .from('uploads')
        .select(`
          *,
          designs!inner (
            id,
            customer_id,
            order_items!inner (
              order_id
            )
          )
        `)
        .eq('designs.order_items.order_id', order.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setUploads(data || [])
    } catch (error) {
      console.error('Error fetching uploads:', error)
      // Fallback: try to get uploads through order_items
      try {
        const { data: orderItems } = await supabase
          .from('order_items')
          .select(`
            id,
            order_item_uploads (
              upload_id,
              uploads (*)
            )
          `)
          .eq('order_id', order.id)

        const uploadsFromItems = orderItems?.flatMap(item => 
          item.order_item_uploads?.map(oiu => oiu.uploads)
        ).filter(Boolean) || []
        
        setUploads(uploadsFromItems)
      } catch (fallbackError) {
        console.error('Error fetching uploads fallback:', fallbackError)
        setUploads([])
      }
    }
  }

  const fetchOrderItems = async () => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          *,
          store_products (
            name,
            base_price
          ),
          variants (
            name,
            color_code
          ),
          designs (
            name
          )
        `)
        .eq('order_id', order.id)

      if (error) throw error
      setOrderItems(data || [])
    } catch (error) {
      console.error('Error fetching order items:', error)
    }
  }

  const handleSetPrice = async () => {
    if (!totalAmount) return
    
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          total_amount: parseFloat(totalAmount),
          status: 'quote_sent'
        })
        .eq('id', order.id)

      if (error) throw error
      onClose()
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id)

      if (error) throw error
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  const displayOrder = currentOrder || order
  if (!displayOrder) return null

  const isQuote = ['quote_requested', 'quote_sent'].includes(displayOrder.status)
  const nextStatus = statusProgression[displayOrder.status]

  return (
    <>
      {/* Right Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-[40%] bg-white border-l border-gray-200 transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Order #{displayOrder.order_number || displayOrder.id}
            </h2>
            <p className="text-sm text-gray-600">
              {format(new Date(displayOrder.created_at), 'MMMM d, yyyy')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Status</h3>
            <Badge variant="secondary">
              {statusLabels[displayOrder.status]}
            </Badge>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Customer</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="font-medium">
                  {`${displayOrder.customers?.first_name || ''} ${displayOrder.customers?.last_name || ''}`.trim() || 'Unknown'}
                </span>
              </div>
              <div className="text-sm text-gray-600">{displayOrder.customers?.email || 'No email'}</div>
              {displayOrder.customers?.phone && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Phone className="h-3 w-3" />
                  <span>{displayOrder.customers.phone}</span>
                </div>
              )}
              {displayOrder.customers?.company && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Building2 className="h-3 w-3" />
                  <span>{displayOrder.customers.company}</span>
                </div>
              )}
            </div>
          </div>

          {/* Enquiry Notes */}
          <div>
            <h3 className="font-semibold mb-2 text-gray-900">Notes</h3>
            <div className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
              {displayOrder.enquiry_notes || 'No notes provided'}
            </div>
          </div>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">Items</h3>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start p-3 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {item.store_products?.name || item.designs?.name || `Item ${item.id}`}
                      </div>
                      {item.variants && (
                        <div className="text-xs text-gray-500 mt-1">
                          {item.variants.name}
                        </div>
                      )}
                    </div>
                    <div className="text-sm font-medium">
                      ${item.unit_price || item.store_products?.base_price || 'TBD'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploads */}
          <div>
            <h3 className="font-semibold mb-3 text-gray-900">Files ({uploads.length})</h3>
            {uploads.length > 0 ? (
              <div className="space-y-2">
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex justify-between items-center p-2 border border-gray-200 rounded text-sm">
                    <span className="flex-1 truncate">{upload.file_name}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {upload.file_size ? `${Math.round(upload.file_size / 1024)} KB` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No files uploaded</p>
            )}
          </div>

          {/* Total Amount */}
          {(displayOrder.total_amount || isQuote) && (
            <div>
              <h3 className="font-semibold mb-2 text-gray-900">Total</h3>
              <div className="text-xl font-bold text-gray-900">
                {displayOrder.total_amount ? `$${displayOrder.total_amount}` : 'Not set'}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-200 p-6 space-y-3">
          {/* Quote Actions */}
          {isQuote && displayOrder.status === 'quote_requested' && (
            <div className="space-y-3">
              <Input
                type="number"
                placeholder="Enter price"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
              />
              <Button 
                onClick={handleSetPrice}
                disabled={updating || !totalAmount}
                className="w-full"
              >
                {updating ? 'Setting...' : 'Set Price & Send Quote'}
              </Button>
            </div>
          )}

          {/* Status Progression */}
          {nextStatus && (
            <Button 
              onClick={() => handleStatusUpdate(nextStatus)}
              disabled={updating}
              variant="outline"
              className="w-full"
            >
              {updating ? 'Updating...' : `Mark as ${statusLabels[nextStatus]}`}
            </Button>
          )}
        </div>
      </div>
    </>
  )
}