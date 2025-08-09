import React, { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

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

export function OrderDetailModal({ order, open, onOpenChange }) {
  const [uploads, setUploads] = useState([])
  const [orderItems, setOrderItems] = useState([])
  const [totalAmount, setTotalAmount] = useState(order?.total_amount || '')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (order?.id) {
      fetchUploads()
      fetchOrderItems()
      setTotalAmount(order.total_amount || '')
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
      onOpenChange(false)
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
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating status:', error)
    } finally {
      setUpdating(false)
    }
  }

  if (!order) return null

  const isQuote = ['quote_requested', 'quote_sent'].includes(order.status)
  const nextStatus = statusProgression[order.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Order #{order.order_number || order.id}
          </DialogTitle>
          <DialogDescription>
            Created on {format(new Date(order.created_at), 'MMMM d, yyyy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <Badge variant="secondary">
              {statusLabels[order.status]}
            </Badge>
          </div>

          {/* Customer Information */}
          <div>
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div><strong>Name:</strong> {`${order.customers?.first_name || ''} ${order.customers?.last_name || ''}`.trim() || 'Unknown'}</div>
              <div><strong>Email:</strong> {order.customers?.email || 'Not provided'}</div>
              {order.customers?.phone && (
                <div><strong>Phone:</strong> {order.customers.phone}</div>
              )}
              {order.customers?.company && (
                <div><strong>Company:</strong> {order.customers.company}</div>
              )}
            </div>
          </div>

          {/* Enquiry Notes */}
          <div>
            <h3 className="font-semibold mb-2">Enquiry Notes</h3>
            <div className="p-3 bg-muted rounded-md text-sm">
              {order.enquiry_notes || 'No notes provided'}
            </div>
          </div>

          {/* Order Items */}
          {orderItems.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Order Items</h3>
              <div className="space-y-2">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex justify-between p-2 bg-muted rounded">
                    <div>
                      <div className="font-medium">
                        {item.store_products?.name || item.designs?.name || `Item ${item.id}`}
                      </div>
                      {item.variants && (
                        <div className="text-sm text-muted-foreground">
                          Variant: {item.variants.name}
                        </div>
                      )}
                    </div>
                    <span>${item.unit_price || item.store_products?.base_price || 'TBD'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Uploads */}
          <div>
            <h3 className="font-semibold mb-2">Uploaded Files ({uploads.length})</h3>
            {uploads.length > 0 ? (
              <div className="space-y-2">
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex justify-between items-center p-2 border rounded">
                    <span className="text-sm">{upload.file_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {upload.file_size ? `${Math.round(upload.file_size / 1024)} KB` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No files uploaded</p>
            )}
          </div>

          {/* Total Amount */}
          {(order.total_amount || isQuote) && (
            <div>
              <h3 className="font-semibold mb-2">Total Amount</h3>
              <div className="text-lg font-semibold">
                {order.total_amount ? `$${order.total_amount}` : 'Not set'}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col space-y-2">
          {/* Quote Actions */}
          {isQuote && order.status === 'quote_requested' && (
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Input
                type="number"
                placeholder="Enter price"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleSetPrice}
                disabled={updating || !totalAmount}
                className="w-full sm:w-auto"
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
              className="w-full"
              variant="outline"
            >
              {updating ? 'Updating...' : `Mark as ${statusLabels[nextStatus]}`}
            </Button>
          )}

          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}