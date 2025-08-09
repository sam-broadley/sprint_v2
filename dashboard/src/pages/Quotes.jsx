import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { QuotesTable } from '../components/QuotesTable'
import { OrderRightSidebar } from '../components/OrderRightSidebar'
import { Input } from '../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

export function Quotes() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dateFilter, setDateFilter] = useState('all')

  const handleRowClick = (order) => {
    setSelectedOrder(order)
    setSidebarOpen(true)
  }

  const handleCloseSidebar = () => {
    setSidebarOpen(false)
    setSelectedOrder(null)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        <p className="text-gray-600">Manage quote requests and send pricing</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, email, or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Date filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This week</SelectItem>
            <SelectItem value="month">This month</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quote Requests</h2>
          <p className="text-sm text-gray-600">
            Orders awaiting quotes or approval
          </p>
        </div>
        <QuotesTable 
          searchQuery={searchQuery} 
          onRowClick={handleRowClick}
        />
      </div>

      {/* Right Sidebar */}
      <OrderRightSidebar
        order={selectedOrder}
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
      />
    </div>
  )
}