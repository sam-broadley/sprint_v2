import React from 'react'
import { FormInput, ExternalLink, Code, Settings, Mail } from 'lucide-react'
import { Button } from '../components/ui/button'

export function ComponentForms() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Forms Component</h1>
        <p className="text-gray-600">Quote request forms and lead generation</p>
      </div>

      <div className="grid gap-6">
        {/* Component Info */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <FormInput className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Quote Forms</h2>
              <p className="text-gray-600">Embeddable quote request forms</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Features</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Customizable form fields</li>
                <li>• File upload support</li>
                <li>• Email notifications</li>
                <li>• Brand customization</li>
              </ul>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Status</h3>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active & Deployed</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Location: /components/quote</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <Button>
              <ExternalLink className="h-4 w-4 mr-2" />
              Preview Form
            </Button>
            <Button variant="outline">
              <Code className="h-4 w-4 mr-2" />
              Get Embed Code
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Form Settings
            </Button>
          </div>
        </div>

        {/* Form Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <FormInput className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-gray-900">Form Submissions</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center space-x-2 mb-2">
              <Mail className="h-4 w-4 text-green-600" />
              <h4 className="font-medium text-gray-900">Quotes Sent</h4>
            </div>
            <p className="text-2xl font-bold text-gray-900">--</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900">Conversion Rate</h4>
            <p className="text-2xl font-bold text-gray-900">--%</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900">Avg. Response Time</h4>
            <p className="text-2xl font-bold text-gray-900">-- hrs</p>
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Submissions</h3>
          </div>
          <div className="p-8 text-center">
            <FormInput className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Recent form submissions will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}