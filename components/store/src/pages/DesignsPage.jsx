import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useCart } from '../hooks/useCart'
import { useLocalization } from '../lib/localization'

const DesignsPage = () => {
  const { storeSlug } = useParams()
  const [designs, setDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [store, setStore] = useState(null)
  const { addToCart } = useCart()
  const { t } = useLocalization(store?.settings?.localization?.locale || 'GB') // Use store settings localization or default to GB
  const hasRun = useRef(false)

  // Debug: Log the current localization
  console.log('DesignsPage - Store settings:', store?.settings, 'Using locale:', store?.settings?.localization?.locale || 'GB')

  useEffect(() => {
    const fetchStore = async () => {
      if (storeSlug) {
        try {
          console.log('Fetching store for designs page:', storeSlug)
          const { data, error } = await supabase
            .from('stores')
            .select('name, settings')
            .eq('slug', storeSlug)
            .single()

          console.log('Store fetch result for designs:', { data, error })

          if (!error && data) {
            setStore(data)
            console.log('DesignsPage - Store data:', data)
          }
        } catch (error) {
          console.error('Error fetching store:', error)
        }
      }
    }

    const fetchDesigns = async () => {
      try {
        setLoading(true)
        console.log('Fetching designs for customer_id: 1')
        
        // Simplified query - just get the basic design info first
        const { data, error } = await supabase
          .from('designs')
          .select(`
            id,
            slug,
            name,
            customer_id,
            store_product_id,
            created_at
          `)
          .is('customer_id', null)

        console.log('Designs fetch result:', { data, error })

        if (error) {
          console.error('Error fetching designs:', error)
          setError(`Failed to load designs: ${error.message}`)
          return
        }

        setDesigns(data || [])
        console.log('Designs loaded:', data?.length || 0)
      } catch (err) {
        console.error('Error fetching designs:', err)
        setError(`Failed to load designs: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (storeSlug && !hasRun.current) {
      hasRun.current = true
      fetchStore()
      fetchDesigns()
    }
  }, [storeSlug]) // Removed t from dependency array

  const handleAddToCart = async (design) => {
    try {
      const result = await addToCart(design)
      if (result.success) {
        alert('Added to cart!')
      } else {
        console.error('Add to cart error:', result.error)
        alert('Failed to add to cart. Please try again.')
      }
    } catch (error) {
      console.error('Add to cart error:', error)
      alert('Failed to add to cart. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('loadingDesigns')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Please check:</p>
              <ul className="text-sm text-gray-600 list-disc list-inside">
                <li>Your .env file has REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY</li>
                <li>Your Supabase database is running and accessible</li>
                <li>The designs table exists in your database</li>
              </ul>
            </div>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4"
            >
              {t('tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" key={store?.settings?.localization?.locale || 'GB'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t('Your Designs')}</h1>
          <p className="mt-2 text-gray-600">
            {t('manageAndEdit')}
          </p>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{t('noDesignsYet')}</h3>
            <p className="mt-2 text-gray-600">
              {t('createFirstDesign')}
            </p>
            <div className="mt-6">
              <Link
                to={`/${storeSlug}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                {t('browseProducts')}
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <Card key={design.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">
                    Design #{design.id}
                  </CardTitle>
                  <CardDescription>
                    <div className="flex justify-between items-center">
                      <span>Created {new Date(design.created_at).toLocaleDateString()}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        design.status === 'completed' ? 'bg-green-100 text-green-800' :
                        design.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {design.status}
                      </span>
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="bg-gray-100 rounded-lg p-4 min-h-[120px] flex items-center justify-center">
                      <p className="text-gray-500 text-sm">
                        {t('designPreview')}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/${storeSlug}/design/${design.slug}`}
                        className="flex-1"
                      >
                        <Button className="w-full">
                          {t('editDesign')}
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleAddToCart(design)}
                      >
                        {t('addToCart')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DesignsPage 