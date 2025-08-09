import React, { useState, useEffect } from 'react'
import { SidebarSimple } from './components/SidebarSimple'
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

  // Initialize page from URL
  useEffect(() => {
    const path = window.location.pathname
    const pageMap = {
      '/': 'dashboard',
      '/quotes': 'quotes',
      '/orders': 'orders',
      '/products': 'products',
      '/customers': 'customers',
      '/components/store': 'component-store',
      '/components/forms': 'component-forms'
    }
    
    const page = pageMap[path] || 'dashboard'
    setCurrentPage(page)
  }, [])

  // Update URL when page changes
  const handleNavigate = (page) => {
    const urlMap = {
      'dashboard': '/',
      'quotes': '/quotes',
      'orders': '/orders',
      'products': '/products',
      'customers': '/customers',
      'component-store': '/components/store',
      'component-forms': '/components/forms'
    }
    
    const url = urlMap[page] || '/'
    window.history.pushState(null, '', url)
    setCurrentPage(page)
  }

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      const pageMap = {
        '/': 'dashboard',
        '/quotes': 'quotes',
        '/orders': 'orders',
        '/products': 'products',
        '/customers': 'customers',
        '/components/store': 'component-store',
        '/components/forms': 'component-forms'
      }
      
      const page = pageMap[path] || 'dashboard'
      setCurrentPage(page)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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
      <SidebarSimple currentPage={currentPage} onNavigate={handleNavigate} />
      <div className="pl-64">
        <main className="py-8 px-8">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App