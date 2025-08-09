import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { useCart } from '../hooks/useCart'
import { useLocalization } from '../lib/localization'
import { updateDesignVariant } from '../lib/updateDesignVariant'

const DesignPage = () => {
  const { designSlug, storeSlug } = useParams()
  const navigate = useNavigate()
  const [design, setDesign] = useState(null)
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [store, setStore] = useState(null)
  const [availableVariants, setAvailableVariants] = useState([])
  const [currentVariant, setCurrentVariant] = useState(null)
  const [availablePositions, setAvailablePositions] = useState([])
  const [currentPosition, setCurrentPosition] = useState(null)
  const [showPositionCustomization, setShowPositionCustomization] = useState(false)
  const [availableSizes, setAvailableSizes] = useState([])
  const [sizeQuantities, setSizeQuantities] = useState({})
  const [showPricing, setShowPricing] = useState(false)
  const { addToCart } = useCart()
  const { t } = useLocalization(store?.store_settings?.localization?.locale || 'GB') // Use store settings localization or default to GB
  const hasRun = useRef(false)

  // Debug: Log the current localization
  console.log('DesignPage - Store settings:', store?.store_settings, 'Using locale:', store?.store_settings?.localization?.locale || 'GB')

  useEffect(() => {
    const fetchStore = async () => {
      try {
        // Get store info from the design's store_products
        const { data: designData, error: designError } = await supabase
          .from('designs')
          .select(`
            store_products (
              store_id,
              stores (
                name,
                store_settings
              )
            )
          `)
          .eq('slug', designSlug)
          .single()

        if (!designError && designData?.store_products?.stores) {
          setStore(designData.store_products.stores)
          console.log('DesignPage - Store data:', designData.store_products.stores)
        }
      } catch (error) {
        console.error('Error fetching store:', error)
      }
    }

    const fetchDesign = async () => {
      try {
        setLoading(true)
        console.log('Fetching design with slug:', designSlug)
        
        // Get the design by id with product and variant information
        const { data: designData, error: designError } = await supabase
          .from('designs')
          .select(`
            *,
            store_products (
              id,
              name,
              base_price,
              products (
                id,
                name,
                description,
                category
              )
            ),
            variants (
              id,
              name,
              color_code,
              image_url
            )
          `)
          .eq('slug', designSlug)
          .single()

        if (designError) {
          if (designError.code === 'PGRST116') {
            setError('Design not found')
          } else {
            console.error('Design fetch error:', designError)
            setError('Failed to load design')
          }
          return
        }

        console.log('Design data:', designData)
        setDesign(designData)

                  // Transform the product data to match what the component expects
          if (designData.store_products) {
            const transformedProduct = {
              id: designData.store_products.id,
              name: designData.store_products.name || designData.store_products.products.name,
              description: designData.store_products.products.description,
              price: designData.store_products.base_price,
              image_url: designData.variants?.image_url || null, // Use variant image if available
              category: designData.store_products.products.category,
              vendor: null,
              variant: designData.variants ? {
                id: designData.variants.id,
                name: designData.variants.name,
                color_code: designData.variants.color_code,
                image_url: designData.variants.image_url
              } : null
            }
            setProduct(transformedProduct)
            
            // Set current variant
            if (designData.variants) {
              setCurrentVariant({
                id: designData.variants.id,
                name: designData.variants.name,
                color_code: designData.variants.color_code,
                image_url: designData.variants.image_url
              })
            }
            
            // Fetch available variants, positions, and sizes for this store product
            fetchAvailableVariants(designData.store_products.id)
            fetchAvailablePositions(designData.store_products.id)
            fetchAvailableSizes(designData.store_products.id)
          }
      } catch (err) {
        console.error('Error fetching design:', err)
        setError('Failed to load design. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (designSlug && !hasRun.current) {
      hasRun.current = true
      fetchStore()
      fetchDesign()
    }
  }, [designSlug]) // Removed t from dependency array

  // Fetch available variants for the store product
  const fetchAvailableVariants = async (storeProductId) => {
    try {
      const { data, error } = await supabase
        .from('store_product_variants')
        .select(`
          variant_id,
          variants (
            id,
            name,
            color_code,
            image_url
          )
        `)
        .eq('store_product_id', storeProductId)
        .eq('active', true)

      if (error) {
        console.error('Error fetching variants:', error)
        return
      }

      const variants = data.map(item => item.variants).filter(Boolean)
      setAvailableVariants(variants)
      console.log('Available variants:', variants)
    } catch (error) {
      console.error('Error in fetchAvailableVariants:', error)
    }
  }

  // Fetch available positions for the store product
  const fetchAvailablePositions = async (storeProductId) => {
    try {
      const { data, error } = await supabase
        .from('store_product_positions')
        .select(`
          position_id,
          positions (
            id,
            name,
            max_width,
            max_height,
            image_overlay_url
          )
        `)
        .eq('store_product_id', storeProductId)
        .eq('active', true)

      if (error) {
        console.error('Error fetching positions:', error)
        return
      }

      const positions = data.map(item => item.positions).filter(Boolean)
      setAvailablePositions(positions)
      console.log('Available positions:', positions)
    } catch (error) {
      console.error('Error in fetchAvailablePositions:', error)
    }
  }

  // Fetch available sizes for the store product
  const fetchAvailableSizes = async (storeProductId) => {
    try {
      const { data, error } = await supabase
        .from('store_product_sizes')
        .select(`
          size_id,
          price_modifier,
          sizes (
            id,
            name,
            sort_order
          )
        `)
        .eq('store_product_id', storeProductId)
        .eq('active', true)

      if (error) {
        console.error('Error fetching sizes:', error)
        return
      }

      const sizes = data.map(item => ({
        ...item.sizes,
        price_modifier: item.price_modifier
      })).filter(Boolean)
      
      // Sort sizes by sort_order manually since we can't order by nested fields
      sizes.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      
      setAvailableSizes(sizes)
      
      // Initialize quantities object with all sizes set to 0
      const initialQuantities = {}
      sizes.forEach(size => {
        initialQuantities[size.id] = 0
      })
      setSizeQuantities(initialQuantities)
      
      console.log('Available sizes:', sizes)
    } catch (error) {
      console.error('Error in fetchAvailableSizes:', error)
    }
  }

  // Handle variant change
  const handleVariantChange = async (variant) => {
    if (!design || variant.id === currentVariant?.id) return

    try {
      const result = await updateDesignVariant(design.id, variant.id)
      if (result.success) {
        setCurrentVariant(variant)
        setDesign(result.design)
        // Update the product image to reflect the new variant
        setProduct(prev => ({
          ...prev,
          image_url: variant.image_url,
          variant: variant
        }))
        console.log('Variant updated successfully:', variant)
      } else {
        console.error('Failed to update variant:', result.error)
        alert('Failed to update variant. Please try again.')
      }
    } catch (error) {
      console.error('Error changing variant:', error)
      alert('Failed to update variant. Please try again.')
    }
  }

  // Handle position change
  const handlePositionChange = (position) => {
    if (position.id === currentPosition?.id) return
    setCurrentPosition(position)
    setShowPositionCustomization(true)
    console.log('Position changed to:', position)
  }

  // Handle quantity change
  const handleQuantityChange = (sizeId, quantity) => {
    const newQuantity = Math.max(0, parseInt(quantity) || 0)
    setSizeQuantities(prev => ({
      ...prev,
      [sizeId]: newQuantity
    }))
  }

  // Handle continue to pricing
  const handleContinueToPricing = () => {
    setShowPricing(true)
  }

  const handleAddToCart = async () => {
    if (!design) return
    
    const result = await addToCart(design)
    if (result.success) {
      alert('Added to cart!')
    } else {
      console.error('Add to cart error:', result.error)
      alert('Failed to add to cart. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg">{t('loadingDesign')}</div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">{error}</div>
            <button 
              onClick={() => window.close()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t('closeTab')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!design || !product) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg">{t('designNotFound')}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white" key={store?.store_settings?.localization?.locale || 'GB'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Design Header - Removed title and design ID */}
        <div className="mb-8">
          {/* Empty header space for layout consistency */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Preview */}
          <div>
            <div className="aspect-square bg-white rounded-lg flex items-center justify-center mb-4">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="text-gray-500">{t('noImageAvailable')}</div>
              )}
            </div>
            <p className="text-lg font-semibold text-gray-900">${product.price}</p>
          </div>

          {/* Design Editor */}
          <div>
            {/* Design Customization Interface */}
            <div 
              className="p-8 relative"
              style={{ 
                backgroundColor: '#FAFAFA', 
                borderRadius: '20px'
              }}
            >
              {/* Product Name and Description */}
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{product.name}</h3>
                {product.description && (
                  <p className="text-gray-600 mb-6 text-sm">{product.description}</p>
                )}
              </div>

              {/* Variant Selector */}
              {availableVariants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">1. Choose a colour</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {availableVariants.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => handleVariantChange(variant)}
                        className={`relative p-4 border-2 rounded-lg transition-all duration-200 flex-shrink-0 w-32 ${
                          currentVariant?.id === variant.id
                            ? ''
                            : 'border-gray-300'
                        }`}
                        data-variant-color={variant.color_code || ''}
                        data-is-selected={currentVariant?.id === variant.id}
                        style={{
                          '--variant-color': variant.color_code ? `${variant.color_code}1A` : undefined,
                          '--variant-border-color': variant.color_code ? `${variant.color_code}80` : undefined,
                          borderColor: currentVariant?.id === variant.id 
                            ? (variant.color_code || '#374151') 
                            : undefined
                        }}
                      >
                        {/* Variant Image */}
                        <div className="aspect-square rounded-md mb-3 overflow-hidden">
                          {variant.image_url ? (
                            <img
                              src={variant.image_url}
                              alt={variant.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">
                              No Image
                            </div>
                          )}
                        </div>
                        
                        {/* Variant Name */}
                        <p className="text-sm font-medium text-gray-900 text-center">
                          {variant.name}
                        </p>
                        
                        {/* Active indicator */}
                        {currentVariant?.id === variant.id && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Position Selector */}
              {availablePositions.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">2. Where would you like your design to go?</h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {availablePositions.map((position) => (
                      <button
                        key={position.id}
                        onClick={() => handlePositionChange(position)}
                        className={`relative p-4 border-2 rounded-lg transition-all duration-200 flex-shrink-0 w-32 ${
                          currentPosition?.id === position.id
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {/* Position Name */}
                        <p className="text-sm font-medium text-gray-900 text-center">
                          {position.name}
                        </p>
                        
                        {/* Active indicator */}
                        {currentPosition?.id === position.id && (
                          <div className="absolute top-2 right-2 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Size and Quantity Selector */}
              {availableSizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">3. How many would you like?</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {availableSizes.map((size) => (
                      <div key={size.id} className="flex flex-col items-center p-3 border border-gray-200 rounded-lg w-20 flex-shrink-0">
                        <input
                          type="number"
                          min="0"
                          value={sizeQuantities[size.id] || 0}
                          onChange={(e) => handleQuantityChange(size.id, e.target.value)}
                          className="w-full h-12 text-center border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2 text-lg font-medium"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-gray-900">{size.name}</span>
                          {size.price_modifier > 0 && (
                            <span className="text-xs text-gray-500">+${size.price_modifier}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Continue to Pricing Button */}
              <Button 
                onClick={handleContinueToPricing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium"
              >
                Continue to Pricing →
              </Button>

              {showPositionCustomization ? (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg bg-white z-10">
                  {/* Position Customization Header */}
                  <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                    <button
                      onClick={() => setShowPositionCustomization(false)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {currentPosition?.name}
                    </h3>
                  </div>
                  
                  {/* Position Customization Content */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-lg">
                      Position customization coming soon...
                    </p>
                  </div>
                </div>
              ) : showPricing ? (
                <div className="absolute inset-0 border-2 border-blue-500 rounded-lg bg-white z-10">
                  {/* Pricing Header */}
                  <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                    <button
                      onClick={() => setShowPricing(false)}
                      className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Design</span>
                    </button>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pricing
                    </h3>
                  </div>
                  
                  {/* Pricing Content */}
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-lg">
                      Pricing information coming soon...
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DesignPage 