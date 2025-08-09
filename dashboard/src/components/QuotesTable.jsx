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
  quote_requested: 'warning',
  quote_sent: 'info'
}

const statusLabels = {
  quote_requested: 'Quote Requested',
  quote_sent: 'Quote Sent'
}

export function QuotesTable({ searchQuery, onRowClick }) {
  const [quotes, setQuotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [realtimeStatus, setRealtimeStatus] = useState('connecting')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => {
    fetchQuotes()
    
    const subscription = supabase
      .channel('quotes_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: 'status=in.(quote_requested,quote_sent)'
        }, 
        (payload) => {
          console.log('Real-time quotes update:', payload)
          setLastUpdated(new Date())
          fetchQuotes()
        }
      )
      .subscribe((status) => {
        console.log('Quotes subscription status:', status)
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

  const fetchQuotes = async () => {
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
        .in('status', ['quote_requested', 'quote_sent'])
        .order('created_at', { ascending: false })

      if (error) throw error
      console.log('Quotes data:', data) // Debug log
      setQuotes(data || [])
    } catch (error) {
      console.error('Error fetching quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredQuotes = quotes.filter(quote => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    const customerName = getCustomerDisplayName(quote)
    return (
      quote.order_number?.toLowerCase().includes(searchLower) ||
      customerName.toLowerCase().includes(searchLower) ||
      quote.customers?.email?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="p-4">
        <span>Loading quotes...</span>
      </div>
    )
  }

  return (
    <div>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-medium text-gray-900">
          {filteredQuotes.length} Quote{filteredQuotes.length !== 1 ? 's' : ''}
        </h3>
      </div>
      <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order Number</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Enquiry Notes</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredQuotes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground">
              No quotes found
            </TableCell>
          </TableRow>
        ) : (
          filteredQuotes.map((quote) => (
            <TableRow 
              key={quote.id} 
              onClick={() => onRowClick(quote)}
              className="cursor-pointer hover:bg-muted/50"
            >
              <TableCell className="font-medium">
                {quote.order_number || `#${quote.id}`}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {getCustomerDisplayName(quote)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {quote.customers?.email}
                  </div>
                </div>
              </TableCell>
              <TableCell className="max-w-xs">
                <div className="truncate">
                  {quote.enquiry_notes || 'No notes'}
                </div>
              </TableCell>
              <TableCell>
                {format(new Date(quote.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[quote.status]}>
                  {statusLabels[quote.status]}
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