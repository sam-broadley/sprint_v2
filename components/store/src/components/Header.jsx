import React, { useState, useEffect } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { supabase } from '../lib/supabase'
import { Home } from 'lucide-react'

const Header = ({ onMobileMenuToggle }) => {
  const { storeSlug } = useParams()
  const location = useLocation()
  const { getCartTotal } = useCart()
  const [store, setStore] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const fetchStore = async () => {
      if (storeSlug) {
        try {
          console.log('Header fetching store with slug:', storeSlug)
          const { data, error } = await supabase
            .from('stores')
            .select('name')
            .eq('slug', storeSlug)
            .single()

          if (!error && data) {
            setStore(data)
          } else if (error) {
            console.error('Header store fetch error:', error)
          }
        } catch (error) {
          console.error('Error fetching store:', error)
        }
      }
    }

    fetchStore()
  }, [storeSlug])

  const isDesignPage = location.pathname.includes('/design/')
  const isDesignsPage = location.pathname.includes('/designs')

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b z-10 h-16">
      <div className="px-4 lg:px-6 py-4 h-full flex items-center">
        <div className="flex justify-between items-center w-full">
          {/* Left side - Logo */}
          <div className="flex items-center space-x-6">
            {/* Mobile menu button */}
            <button
              onClick={() => {
                const newState = !mobileMenuOpen
                setMobileMenuOpen(newState)
                onMobileMenuToggle?.(newState)
              }}
              className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo */}
            <Link to={`/${storeSlug}`} className="flex items-center">
              <h1 className="text-lg lg:text-2xl font-bold text-gray-900">
                {store ? store.name : (storeSlug ? storeSlug.charAt(0).toUpperCase() + storeSlug.slice(1) : 'Store')}
              </h1>
            </Link>
          </div>

          {/* Center - Search Bar with Home Icon (only on design page) */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
            {isDesignPage && (
              <Link 
                to={`/${storeSlug}`}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 mr-3"
                title="Back to store"
              >
                <Home className="w-5 h-5" />
              </Link>
            )}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search our collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Right side - Cart and Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart and Actions */}
            <div className="flex items-center space-x-2">
              <div className="text-xs lg:text-sm text-gray-600">
                Cart: {getCartTotal()} items
              </div>
              <button className="p-2 text-gray-600 hover:text-gray-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
              <button className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800 flex items-center space-x-1">
                <span>Continue to Quote</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-4 py-2 space-y-1">
            <Link 
              to={`/${storeSlug}`} 
              className={`block px-3 py-2 text-sm font-medium rounded-md ${
                !isDesignPage && !isDesignsPage 
                  ? 'text-gray-900 bg-gray-100' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => {
                setMobileMenuOpen(false)
                onMobileMenuToggle?.(false)
              }}
            >
              Our Favourites
            </Link>
            <Link 
              to={`/${storeSlug}?category=hoodies`} 
              className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => {
                setMobileMenuOpen(false)
                onMobileMenuToggle?.(false)
              }}
            >
              Hoodies
            </Link>
            <Link 
              to={`/${storeSlug}?category=tees`} 
              className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md"
              onClick={() => {
                setMobileMenuOpen(false)
                onMobileMenuToggle?.(false)
              }}
            >
              Tees
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header 