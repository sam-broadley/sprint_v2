import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { getSessionCustomer } from '../lib/sessionCustomer'

export function useCart() {
  const [cart, setCart] = useState([])
  const [currentOrder, setCurrentOrder] = useState(null)
  const [cartItemsWithDetails, setCartItemsWithDetails] = useState([])
  const [cartLoading, setCartLoading] = useState(false)
  const [productCache, setProductCache] = useState(new Map())
  const [sessionCustomerId, setSessionCustomerId] = useState(null)
  const fetchTimeoutRef = useRef(null)





  // Optimized function to fetch cart items with product details
  const fetchCartItemsWithDetails = useCallback(async () => {
    const items = getCartItems()
    if (items.length === 0) {
      setCartItemsWithDetails([])
      return
    }

    // Clear any existing timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current)
    }

    // Debounce the fetch operation to avoid rapid successive calls
    fetchTimeoutRef.current = setTimeout(async () => {
      setCartLoading(true)
      
      try {
        // Get unique store_product_ids to avoid duplicate queries
        const uniqueProductIds = [...new Set(items.map(item => item.store_product_id))]
        
        // Check cache first
        const uncachedIds = uniqueProductIds.filter(id => !productCache.has(id))
        
        let newProducts = []
        
        // Only fetch uncached products
        if (uncachedIds.length > 0) {
          console.log(`Fetching ${uncachedIds.length} uncached products...`)
          
          const { data: productsData, error } = await supabase
            .from('store_products')
            .select(`
              id,
              name,
              base_price,
              products (
                id,
                name,
                description
              )
            `)
            .in('id', uncachedIds)

          if (error) {
            console.error('Error fetching product details:', error)
            throw error
          }

          console.log(`Successfully fetched ${productsData.length} products`)

          // Update cache with new products
          const newCache = new Map(productCache)
          productsData.forEach(product => {
            newCache.set(product.id, {
              name: product.name || product.products.name,
              description: product.products.description,
              image_url: null, // Will be handled by component fallback
              price: product.base_price
            })
          })
          setProductCache(newCache)
          newProducts = productsData
        } else {
          console.log('All products found in cache')
        }

        // Combine cached and new products
        const allProducts = new Map()
        
        // Add cached products
        productCache.forEach((product, id) => {
          allProducts.set(id, product)
        })
        
        // Add new products
        newProducts.forEach(product => {
          allProducts.set(product.id, {
            name: product.name || product.products.name,
            description: product.products.description,
            image_url: null, // Will be handled by component fallback
            price: product.base_price
          })
        })

        // Map cart items with product details
        const itemsWithDetails = items.map(item => ({
          ...item,
          product: allProducts.get(item.store_product_id) || null
        }))

        setCartItemsWithDetails(itemsWithDetails)
      } catch (error) {
        console.error('Error fetching cart items with details:', error)
        // Fallback to items without product details
        setCartItemsWithDetails(items.map(item => ({ ...item, product: null })))
      } finally {
        setCartLoading(false)
      }
    }, 100) // 100ms debounce
  }, [cart, productCache])

  // Fetch cart items with details when cart changes
  useEffect(() => {
    fetchCartItemsWithDetails()
  }, [cart, fetchCartItemsWithDetails])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current)
      }
    }
  }, [])

  const addToCart = async (design) => {
    try {
      // Get or create a session customer
      const customerId = await getSessionCustomer()
      
      // Call the function that handles both design and non-design cases
      const { data, error } = await supabase
        .rpc('add_to_cart', {
          p_store_product_id: design.store_product_id,
          p_customer_id: customerId,
          p_design_id: design.id || null
        })

      if (error) {
        console.error('Supabase RPC error:', error)
        return { success: false, error }
      }

      if (!data || !data.success) {
        console.error('Function returned error:', data)
        return { success: false, error: data.error }
      }

      // Update local state with the returned data
      setCurrentOrder(data.order)
      
      // Add to local cart
      const newCartItem = { 
        ...design, 
        orderItemId: data.order_item.id 
      }
      setCart(prev => {
        const newCart = [...prev, newCartItem]
        console.log('Updated cart:', newCart)
        return newCart
      })

      return { success: true, orderItem: data.order_item }
    } catch (error) {
      console.error('Error adding to cart:', error)
      return { success: false, error }
    }
  }

  const removeFromCart = (designId) => {
    setCart(prev => prev.filter(item => item.id !== designId))
  }

  const clearCart = () => {
    setCart([])
    setCurrentOrder(null)
    setCartItemsWithDetails([])
    setProductCache(new Map())
  }

  const getCartTotal = () => {
    return cart.length
  }

  const getCartItems = () => {
    return cart
  }

  return {
    cart,
    currentOrder,
    cartItemsWithDetails,
    cartLoading,
    addToCart,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartItems,
    fetchCartItemsWithDetails
  }
} 