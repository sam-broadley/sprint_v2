import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { useCart } from '../hooks/useCart'
import { supabase } from '../lib/supabase'
import { generateSlug } from '../lib/utils'
import { useLocalization } from '../lib/localization'
import { getSessionCustomer } from '../lib/sessionCustomer'
import { Paintbrush } from 'lucide-react'

const ProductCard = ({ product, storeShortName, localization = 'GB' }) => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const [isCreatingDesign, setIsCreatingDesign] = React.useState(false)
  const [design, setDesign] = React.useState(null)
  const { t } = useLocalization(localization) // Use passed localization
  
  // Variant state
  const [currentVariantIndex, setCurrentVariantIndex] = React.useState(0)
  const [isHovered, setIsHovered] = React.useState(false)
  
  // Debug: Log the localization being used
  console.log('ProductCard - Using localization:', localization)

  // Get current variant
  const currentVariant = product.variants?.[currentVariantIndex] || null
  const hasMultipleVariants = product.variants && product.variants.length > 1

  // Handle variant navigation
  const nextVariant = () => {
    if (hasMultipleVariants) {
      setCurrentVariantIndex((prev) => (prev + 1) % product.variants.length)
    }
  }

  const prevVariant = () => {
    if (hasMultipleVariants) {
      setCurrentVariantIndex((prev) => (prev - 1 + product.variants.length) % product.variants.length)
    }
  }

  // Set initial variant to default if available
  React.useEffect(() => {
    if (product.variants && product.default_variant_id) {
      const defaultIndex = product.variants.findIndex(v => v.id === product.default_variant_id)
      if (defaultIndex !== -1) {
        setCurrentVariantIndex(defaultIndex)
      }
    }
  }, [product.variants, product.default_variant_id])

  const handleCreateDesign = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsCreatingDesign(true)
    try {
      // Debug: Log the product object to see what we're working with
      console.log('Product object:', product)
      console.log('Product ID type:', typeof product.id, 'Value:', product.id)
      
      // Get or create a session customer for the design
      const customerId = await getSessionCustomer()
      
      // Debug: Log the parameters being sent
      const params = {
        p_store_product_id: product.id,
        p_customer_id: customerId,
        p_variant_id: currentVariant?.id || null
      }
      console.log('Calling create_design with params:', params)
      
      // Call the Supabase function to create design
      const { data, error } = await supabase
        .rpc('create_design', params)

      console.log('create_design response:', { data, error })

      if (error) {
        console.error('Supabase RPC error:', error)
        alert('Failed to create design. Please try again.')
        return
      }

      if (!data || !data.success) {
        console.error('Function returned error:', data)
        alert('Failed to create design. Please try again.')
        return
      }

      const newDesign = data.design
      setDesign(newDesign)
      
      // Check if Cmd/Ctrl key is pressed for new tab
      if (e.metaKey || e.ctrlKey) {
        window.open(`/${storeShortName}/design/${newDesign.slug}`, '_blank')
      } else {
        navigate(`/${storeShortName}/design/${newDesign.slug}`)
      }
    } catch (error) {
      console.error('Error creating design:', error)
      alert('Failed to create design. Please try again.')
    } finally {
      setIsCreatingDesign(false)
    }
  }

  const handleAddToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    try {
      // Get or create a session customer
      const customerId = await getSessionCustomer()
      
      // For homepage "Add to Cart", we don't create a design
      // We just add the product directly to cart with NULL design_id
      console.log('Adding product to cart from homepage (no design)')
      
      // Create a mock design object with NULL design_id for the cart
      const mockDesign = {
        id: null, // No design ID since we're not creating a design
        customer_id: customerId,
        store_product_id: product.id,
        variant_id: currentVariant?.id || null,
        name: product.name,
        // Add other product info that might be needed
        price: product.price,
        image_url: currentVariant?.image_url || product.image_url
      }

      // Add to cart (the addToCart function will handle the NULL design_id)
      const result = await addToCart(mockDesign)
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

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-0">
        {/* Product Image with Variant Support */}
        <div 
          className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleCreateDesign}
        >
          {/* Current variant image */}
          <img 
            src={currentVariant?.image_url || product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover rounded-lg transition-opacity duration-300"
          />
          
          {/* Customise button - show on hover in top right corner */}
          {isHovered && (
            <div className="absolute top-3 right-3 transition-all duration-300 z-20">
              <Button
                onClick={handleCreateDesign}
                disabled={isCreatingDesign}
                className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg text-sm"
              >
                {isCreatingDesign ? 'Creating...' : t('customize')}
              </Button>
            </div>
          )}
          
          {/* Navigation buttons - only show on hover if multiple variants */}
          {hasMultipleVariants && isHovered && (
            <>
              {/* Previous button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  prevVariant()
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all duration-200 z-10"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Next button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  nextVariant()
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 shadow-md transition-all duration-200 z-10"
              >
                <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* Fallback for no image */}
          {!currentVariant?.image_url && !product.image_url && (
            <div className="text-gray-500">{t('noImage')}</div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {product.vendor ? `${product.vendor} ${product.name}` : product.name}
          </h3>
          <p className="text-base font-medium text-gray-600 mb-2">
            From ${product.price}
          </p>
          
          {/* Color variant dots */}
          {product.variants && product.variants.length > 0 && (
            <div className="flex space-x-2 mb-4">
              {product.variants.map((variant, index) => (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setCurrentVariantIndex(index)
                  }}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    index === currentVariantIndex 
                      ? 'border-gray-900 scale-110' 
                      : 'border-gray-300 hover:border-gray-600'
                  }`}
                  style={{ 
                    backgroundColor: variant.color_code || '#ccc',
                    cursor: hasMultipleVariants ? 'pointer' : 'default'
                  }}
                  title={variant.name}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            onClick={handleCreateDesign}
            disabled={isCreatingDesign}
            type="button"
            className="flex-1"
          >
            {isCreatingDesign ? 'Creating...' : t('customize')}
          </Button>
          <Button 
            onClick={handleAddToCart}
            type="button"
            className="flex-1"
          >
            {t('addToCart')}
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export default ProductCard 