import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLocalization } from '../lib/localization'

// Cache for store data to prevent unnecessary re-fetching
const storeCache = new Map()

const Sidebar = ({ isOpen, onClose }) => {
  const { storeSlug } = useParams()
  const [store, setStore] = useState(null)
  const [userDesigns, setUserDesigns] = useState([])
  const [hasDesigns, setHasDesigns] = useState(false)
  const { t } = useLocalization('GB') // Default to GB localization
  const hasRun = useRef(false)

  useEffect(() => {
    const fetchStore = async () => {
      if (storeSlug) {
        // Check if we already have this store in cache
        if (storeCache.has(storeSlug)) {
          const cachedStore = storeCache.get(storeSlug)
          setStore(cachedStore)
          return
        }

        try {
          console.log('Sidebar fetching store with slug:', storeSlug)
          const { data, error } = await supabase
            .from('stores')
            .select('name')
            .eq('slug', storeSlug)
            .single()

          if (!error && data) {
            // Cache the store data
            storeCache.set(storeSlug, data)
            setStore(data)
          } else if (error) {
            console.error('Sidebar store fetch error:', error)
          }
        } catch (error) {
          console.error('Error fetching store:', error)
        }
      }
    }

    const fetchUserDesigns = async () => {
      try {
        // Check if we already have designs for this store
        const cacheKey = `designs_${storeSlug}`
        if (storeCache.has(cacheKey)) {
          const cachedDesigns = storeCache.get(cacheKey)
          setUserDesigns(cachedDesigns)
          setHasDesigns(cachedDesigns.length > 0)
          return
        }

        // Check if user has designs (no customer_id filter for anonymous users)
        const { data, error } = await supabase
          .from('designs')
          .select('id, name')
          .is('customer_id', null)

        if (!error && data) {
          // Cache the designs data
          storeCache.set(cacheKey, data)
          setUserDesigns(data)
          setHasDesigns(data.length > 0)
        }
      } catch (error) {
        console.error('Error fetching user designs:', error)
      }
    }

    if (storeSlug && !hasRun.current) {
      hasRun.current = true
      fetchStore()
      fetchUserDesigns()
    }
  }, [storeSlug])

  return (
    <div className={`fixed left-0 top-0 bottom-0 w-64 bg-white border border-gray-300 rounded-lg overflow-y-auto transform transition-transform duration-300 ease-in-out z-30 lg:translate-x-0 lg:left-4 lg:top-4 lg:bottom-4 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      {/* Store Logo/Name and Mobile close button */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-gray-900">
              {store ? store.name : (storeSlug ? storeSlug.charAt(0).toUpperCase() + storeSlug.slice(1) : 'Store')}
            </h1>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <div className="space-y-2">
          <Link 
            to={`/${storeSlug}`} 
            className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
            onClick={onClose}
          >
            Products
          </Link>
          
          {/* Product Sub-categories */}
          <div className="ml-4 space-y-1">
            <Link 
              to={`/${storeSlug}?category=same-day`} 
              className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 flex items-center"
              onClick={onClose}
            >
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#965000' }}></div>
              Same Day
            </Link>
            <Link 
              to={`/${storeSlug}?category=express`} 
              className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 flex items-center"
              onClick={onClose}
            >
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#FFD436' }}></div>
              Express
            </Link>
            <Link 
              to={`/${storeSlug}?category=standard`} 
              className="block px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100 flex items-center"
              onClick={onClose}
            >
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: '#FF9389' }}></div>
              Standard
            </Link>
          </div>

          {hasDesigns && (
            <Link 
              to={`/${storeSlug}/designs`} 
              className="block px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
              onClick={onClose}
            >
              {t('Designs')} ({userDesigns.length})
            </Link>
          )}
          {/* Future: Add more navigation items like categories, filters, etc. */}
        </div>
      </nav>

      {/* Filters Section (Future) */}
      <div className="p-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('categories')}</h3>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">{t('comingSoon')}</div>
          {/* Future: Add category filters */}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        <div className="text-xs text-gray-500">
          © 2025 Sprint
        </div>
      </div>
    </div>
  )
}

export default Sidebar 