import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useCart } from '../hooks/useCart'
import { useLocalization } from '../lib/localization'
import { getSessionCustomer } from '../lib/sessionCustomer'

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
        
        // Get the current session customer
        const customerId = await getSessionCustomer()
        console.log('Fetching designs for customer_id:', customerId)
        
        if (!customerId) {
          setError('Unable to identify customer. Please refresh the page.')
          return
        }
        
        // Get designs for the current customer with product and variant info
        const { data, error } = await supabase
          .from('designs')
          .select(`
            id,
            slug,
            name,
            customer_id,
            store_product_id,
            created_at,
            design_data,
            store_products (
              id,
              name,
              base_price
            ),
            variants (
              id,
              name,
              color_code,
              image_url
            )
          `)
          .eq('customer_id', customerId)

        console.log('Designs fetch result:', { data, error })

        if (error) {
          console.error('Error fetching designs:', error)
          setError(`Failed to load designs: ${error.message}`)
          return
        }

        // Filter out designs with empty design_data
        const designsWithArtworks = (data || []).filter(design => 
          design.design_data && 
          design.design_data.artworks && 
          design.design_data.artworks.length > 0
        )
        
        setDesigns(designsWithArtworks)
        console.log('Total designs:', data?.length || 0)
        console.log('Designs with artworks:', designsWithArtworks.length)
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

  const handleDeleteDesign = async (design) => {
    console.log('Delete button clicked for design:', design.id)
    if (!window.confirm(`Are you sure you want to delete Design #${design.id}? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('designs')
        .delete()
        .eq('id', design.id)

      if (error) {
        console.error('Error deleting design:', error)
        alert('Failed to delete design. Please try again.')
        return
      }

      // Remove the design from local state
      setDesigns(prevDesigns => prevDesigns.filter(d => d.id !== design.id))
      alert('Design deleted successfully!')
    } catch (error) {
      console.error('Error deleting design:', error)
      alert('Failed to delete design. Please try again.')
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
              <Card key={design.id} className="w-full max-w-sm">
                <CardContent className="p-0">
                  {/* Design Image with Artworks Overlay */}
                  <div 
                    className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity duration-200"
                    onClick={() => window.location.href = `/${storeSlug}/design/${design.slug}`}
                  >
                    {/* Base product image */}
                    {design.variants?.image_url ? (
                      <img 
                        src={design.variants.image_url} 
                        alt="Product base"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error('Failed to load product image:', design.variants.image_url)
                          e.target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <p className="text-gray-500 text-sm">Product Base</p>
                      </div>
                    )}
                    
                    {/* Artworks overlay from design_data */}
                    {console.log('Design data for design', design.id, ':', design.design_data)}
                    {design.design_data && design.design_data.artworks && design.design_data.artworks.map((artwork, index) => (
                      <div
                        key={index}
                        className="absolute pointer-events-none"
                        style={{
                          top: `${artwork.coordinates.top_percent}%`,
                          left: `${artwork.coordinates.left_percent}%`,
                          width: `${artwork.coordinates.width_percent}%`,
                          height: `${artwork.coordinates.height_percent}%`,
                          transform: `rotate(${artwork.properties?.rotation || 0}deg)`,
                          opacity: artwork.properties?.opacity || 1.0,
                          zIndex: artwork.properties?.z_index || 1,
                        }}
                      >
                        <img
                          src={artwork.url}
                          alt={`Design ${index + 1}`}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            console.error('Failed to load artwork image:', artwork.url)
                            e.target.style.display = 'none'
                          }}
                          onLoad={() => {
                            console.log('Successfully loaded artwork image:', artwork.url)
                          }}
                        />
                      </div>
                    ))}
                    
                    {/* Delete button overlay */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDesign(design)
                      }}
                      className="absolute top-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 shadow-lg z-10"
                      title="Delete design"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Design Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Design #{design.id}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Created {new Date(design.created_at).toLocaleDateString()}
                    </p>
                    {design.design_data && design.design_data.artworks && (
                      <p className="text-xs text-gray-500 mb-4">
                        {design.design_data.artworks.length} artwork{design.design_data.artworks.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter className="pt-0">
                  <div className="flex gap-2 w-full">
                    <Link
                      to={`/${storeSlug}/design/${design.slug}`}
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        {t('editDesign')}
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => handleAddToCart(design)}
                      className="flex-1"
                    >
                      {t('addToCart')}
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DesignsPage 