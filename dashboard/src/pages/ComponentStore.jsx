import React from 'react'
import { Store, ExternalLink, Code, Settings } from 'lucide-react'
import { Button } from '../components/ui/button'

export function ComponentStore() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Component</h1>
        <p className="text-gray-600">Customer-facing storefront component</p>
      </div>

      <div className="grid gap-6">
        {/* Component Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Store Frontend</h2>
              <p className="text-gray-600">React component for customer shopping experience</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Product catalog with variants</li>
                <li>• Shopping cart functionality</li>
                <li>• Design customization</li>
                <li>• Checkout integration</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active & Deployed</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Location: /components/store</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Store
            </Button>
            <Button variant="outline">
              <Code className="h-4 w-4 mr-2" />
              View Code
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900">Active Products</h4>
            <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900">Store Views</h4>
            <p className="text-2xl font-bold text-gray-900 mt-1">--</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900">Conversion Rate</h4>
            <p className="text-2xl font-bold text-gray-900 mt-1">--%</p>
          </div>
        </div>
      </div>
    </div>
  )
}