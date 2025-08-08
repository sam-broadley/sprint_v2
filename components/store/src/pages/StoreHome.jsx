import React, { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useLocalization } from '../lib/localization'
import ProductCard from '../components/ProductCard'

const StoreHome = () => {
  const { storeSlug } = useParams()
  const location = useLocation()
  const [store, setStore] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { t } = useLocalization(store?.settings?.localization?.locale || 'GB') // Use store settings localization or default to GB
  const hasRun = useRef(false)

  // Debug: Log the current localization
  console.log('StoreHome - Store settings:', store?.settings, 'Using locale:', store?.settings?.localization?.locale || 'GB')

  // Get current category from URL query params
  const searchParams = new URLSearchParams(location.search)
  const currentCategory = searchParams.get('category')



  useEffect(() => {
    const fetchStoreAndProducts = async () => {
      try {
        setLoading(true)
        console.log('Fetching store:', storeSlug)
        
        // Get the store by slug (we know this field exists)
        console.log('Fetching store with slug:', storeSlug)
        
        // Try a simple query first
        let { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*, settings')
          .eq('slug', storeSlug)
          .single()
        
        console.log('Store query result:', { storeData, storeError })

        console.log('Store fetch result:', { storeData, storeError })

        if (storeError) {
          console.error('Store fetch error details:', storeError)
          if (storeError.code === 'PGRST116') {
            setError('Store not found')
          } else if (storeError.message?.includes('fetch')) {
            setError('Unable to connect to database. Please check your internet connection.')
          } else {
            setError(`Failed to load store data: ${storeError.message}`)
          }
          return
        }

        if (!storeData) {
          setError('Store not found - no data returned')
          return
        }

        setStore(storeData)
        console.log('Store set:', storeData)
        console.log('Store localization:', storeData.localization)

        // Then get all products for this store with product details
        const { data: productsData, error: productsError } = await supabase
          .from('store_products')
          .select(`
            id,
            name,
            base_price,
            product_id,
            default_variant_id,
            products (
              id,
              name,
              description,
              vendor
            )
          `)
          .eq('store_id', storeData.id)
          .eq('active', true)

        console.log('Products fetch result:', { productsData, productsError })

        if (productsError) {
          console.error('Products fetch error:', productsError)
          setError('Failed to load products')
          return
        }

        // Get variants for all products in a separate query
        const productIds = productsData.map(sp => sp.product_id)
        const { data: variantsData, error: variantsError } = await supabase
          .from('variants')
          .select('id, image_url, product_id, name, color_code')
          .in('product_id', productIds)

        // Get store product variants to know which variants are available for each store product
        const { data: storeProductVariantsData, error: storeProductVariantsError } = await supabase
          .from('store_product_variants')
          .select('store_product_id, variant_id, active')
          .eq('active', true)

        if (variantsError) {
          console.error('Variants fetch error:', variantsError)
        }

        console.log('Variants fetch result:', { variantsData, variantsError })

        // Transform the data to match what ProductCard expects
        const transformedProducts = productsData.map(sp => {
          // Find the default variant to get the image
          const defaultVariant = variantsData?.find(v => v.id === sp.default_variant_id)
          const imageUrl = defaultVariant?.image_url || null
          
          // Get all available variants for this store product
          const availableVariantIds = storeProductVariantsData
            ?.filter(spv => spv.store_product_id === sp.id)
            ?.map(spv => spv.variant_id) || []
          
          const availableVariants = variantsData
            ?.filter(v => availableVariantIds.includes(v.id))
            ?.map(v => ({
              id: v.id,
              name: v.name,
              color_code: v.color_code,
              image_url: v.image_url
            })) || []
          
          return {
            id: sp.id,
            name: sp.name || sp.products.name,
            description: sp.products.description,
            price: sp.base_price,
            image_url: imageUrl,
            category: sp.products.category,
            vendor: sp.products.vendor,
            status: 'active',
            variants: availableVariants,
            default_variant_id: sp.default_variant_id
          }
        })

        console.log('Transformed products:', transformedProducts)
        setProducts(transformedProducts)
      } catch (err) {
        console.error('Error fetching store data:', err)
        setError('Failed to load store. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (storeSlug && !hasRun.current) {
      hasRun.current = true
      fetchStoreAndProducts()
    }
  }, [storeSlug]) // Removed t from dependency array

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg">{t('loading')}</div>
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
            <div className="text-lg text-red-600 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {t('tryAgain')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="text-lg">{t('storeNotFound')}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50" key={store?.settings?.localization?.locale || 'GB'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Store Description */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('ourRange')}</h1>
          {store.description && (
            <p className="text-gray-600">{store.description}</p>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-4">
            <Link 
              to={`/${storeSlug}`} 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                !currentCategory 
                  ? 'bg-gray-200 text-gray-900' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              Our Favourites
            </Link>
            <Link 
              to={`/${storeSlug}?category=hoodies`} 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentCategory === 'hoodies'
                  ? 'bg-gray-200 text-gray-900' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              Hoodies
            </Link>
            <Link 
              to={`/${storeSlug}?category=tees`} 
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                currentCategory === 'tees'
                  ? 'bg-gray-200 text-gray-900' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
              }`}
            >
              Tees
            </Link>
          </nav>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              storeShortName={storeSlug}
              localization={store?.settings?.localization?.locale || 'GB'}
            />
          ))}
        </div>

        {products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('noProductsAvailable')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default StoreHome 