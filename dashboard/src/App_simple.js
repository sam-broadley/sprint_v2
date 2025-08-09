import React, { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Quotes } from './pages/Quotes'
import { Orders } from './pages/Orders'
import { Products } from './pages/Products'
import { Customers } from './pages/Customers'
import { ComponentStore } from './pages/ComponentStore'
import { ComponentForms } from './pages/ComponentForms'
import './index.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch(currentPage) {
      case 'dashboard': return <Dashboard />
      case 'quotes': return <Quotes />
      case 'orders': return <Orders />
      case 'products': return <Products />
      case 'customers': return <Customers />
      case 'component-store': return <ComponentStore />
      case 'component-forms': return <ComponentForms />
      default: return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SidebarSimple currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="pl-64">
        <main className="py-8 px-8">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

function SidebarSimple({ currentPage, onNavigate }) {
  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: '🏠' },
    { id: 'quotes', name: 'Quotes', icon: '📄' },
    { id: 'orders', name: 'Orders', icon: '🛍️' },
    { id: 'products', name: 'Products', icon: '📦' },
    { id: 'customers', name: 'Customers', icon: '👥' },
  ]

  const components = [
    { id: 'component-store', name: 'Store', icon: '🏪' },
    { id: 'component-forms', name: 'Forms', icon: '📝' },
  ]

  return (
    <div className="flex h-screen w-64 flex-col fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-200">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src="https://res.cloudinary.com/stitchify/image/upload/t_stitchify/Stores/Sprint/szf2fnz5nq6xziziuk3c.jpg" 
            alt="Sprint Logo" 
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = currentPage === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </button>
          )
        })}

        {/* Components Section */}
        <div className="pt-6">
          <div className="px-3 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Components
            </h3>
          </div>
          {components.map((item) => {
            const isActive = currentPage === item.id
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

export default App