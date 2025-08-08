import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/button'
import { useCart } from '../hooks/useCart'
import { useLocalization } from '../lib/localization'
import { updateDesignVariant, updateDesignData, uploadFile } from '../lib/updateDesign'

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
  const [hoveredPosition, setHoveredPosition] = useState(null)
  const [availableSizes, setAvailableSizes] = useState([])
  const [sizeQuantities, setSizeQuantities] = useState({})
  const [showPricing, setShowPricing] = useState(false)
  const [artworks, setArtworks] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selectedArtwork, setSelectedArtwork] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const isDraggingRef = useRef(false)
  const isResizingRef = useRef(false)
  const latestArtworksRef = useRef([])
  const realtimeSubscriptionRef = useRef(null)
  const { addToCart } = useCart()
  const { t } = useLocalization(store?.settings?.localization?.locale || 'GB') // Use store settings localization or default to GB
  const hasRun = useRef(false)

  // Debug: Log the current localization
  console.log('DesignPage - Store settings:', store?.settings, 'Using locale:', store?.settings?.localization?.locale || 'GB')

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
                settings
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
        console.log('Design data.artworks from database:', designData.design_data?.artworks)
        console.log('Full design_data JSON:', JSON.stringify(designData.design_data, null, 2))
        setDesign(designData)
        
        // Load existing artworks from design_data
        if (designData.design_data && designData.design_data.artworks) {
          console.log('Loading existing artworks:', designData.design_data.artworks)
          console.log('First artwork details:', JSON.stringify(designData.design_data.artworks[0], null, 2))
          setArtworks(designData.design_data.artworks)
        }
        
        // Set up real-time subscription for this design
        setupRealtimeSubscription(designData.id)

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
          position_data,
          positions (
            id,
            name,
            max_width,
            max_height,
            position_data
          )
        `)
        .eq('store_product_id', storeProductId)
        .eq('active', true)

      if (error) {
        console.error('Error fetching positions:', error)
        return
      }

      const positions = data.map(item => {
        // Use store_product_positions.position_data if it exists and is not null/empty
        let positionData = null
        
        if (item.position_data && item.position_data !== null && item.position_data !== '') {
          positionData = item.position_data
        } else if (item.positions.position_data && item.positions.position_data !== null && item.positions.position_data !== '') {
          positionData = item.positions.position_data
        }
        
        // If position_data is a string, try to parse it as JSON
        if (typeof positionData === 'string') {
          try {
            positionData = JSON.parse(positionData)
          } catch (e) {
            console.error('Failed to parse position_data:', e)
          }
        }
        
        return {
          ...item.positions,
          position_data: positionData
        }
      }).filter(Boolean)
      setAvailablePositions(positions)
      console.log('Available positions:', positions)
      console.log('Position data for first position:', positions[0]?.position_data)
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
      console.log('=== VARIANT CHANGE REQUESTED ===')
      console.log('Changing variant to:', variant)
      console.log('Current variant:', currentVariant)
      console.log('Design ID:', design.id)
      
      const result = await updateDesignVariant(design.id, variant.id)
      if (result.success) {
        console.log('Variant update successful, waiting for realtime update...')
        console.log('Update result:', result)
        // Don't update local state immediately - let the realtime subscription handle it
        // This prevents conflicts and ensures consistency across multiple users
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
    setHoveredPosition(null) // Clear hover state when entering position customization
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

  // Handle file upload
  const handleFileUpload = async (file) => {
    console.log('Starting file upload...')
    console.log('File:', file)
    console.log('Current position:', currentPosition)
    console.log('Design:', design)
    
    if (!currentPosition || !design) {
      console.error('Missing currentPosition or design')
      return
    }

    setUploading(true)
    try {
      // Upload file to Supabase storage
      const uploadResult = await uploadFile(file)
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error)
      }

      // Create new artwork entry - position it slightly offset from the position boundary
      const newArtwork = {
        position_id: currentPosition.id,
        upload_id: Date.now(), // Using timestamp as upload_id for now
        coordinates: {
          top_percent: currentPosition.position_data.coordinates.top_percent + 5, // Offset slightly
          left_percent: currentPosition.position_data.coordinates.left_percent + 5, // Offset slightly
          width_percent: Math.min(30, currentPosition.position_data.coordinates.width_percent), // Smaller initial size
          height_percent: Math.min(30, currentPosition.position_data.coordinates.height_percent) // Smaller initial size
        },
        properties: {
          rotation: 0,
          opacity: 1.0,
          z_index: artworks.length + 1
        },
        url: uploadResult.url
      }

      // Add to local state
      const updatedArtworks = [...artworks, newArtwork]
      setArtworks(updatedArtworks)

      // Update design data in database
      const designData = {
        artworks: updatedArtworks.map(artwork => ({
          position_id: artwork.position_id,
          upload_id: artwork.upload_id,
          coordinates: artwork.coordinates,
          properties: artwork.properties,
          url: artwork.url // Include the URL so we can display the image
        }))
      }

      const result = await updateDesignData(design.id, designData)
      if (!result.success) {
        throw new Error(result.error)
      }

      console.log('File uploaded and design updated successfully')
      console.log('Upload result:', uploadResult)
      console.log('New artwork:', newArtwork)
      console.log('Updated artworks:', updatedArtworks)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert('Failed to upload file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // Handle file input change
  const handleFileInputChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Handle artwork selection
  const handleArtworkSelect = (artwork) => {
    console.log('Artwork selected:', artwork)
    setSelectedArtwork(artwork)
  }

  // Handle artwork drag start
  const handleMouseDown = (e, artwork) => {
    console.log('Mouse down on artwork:', artwork)
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    isDraggingRef.current = true
    setSelectedArtwork(artwork)
    
    const handleMouseMove = (e) => {
      console.log('Mouse move event triggered, isDragging:', isDraggingRef.current)
      if (!isDraggingRef.current) return
      
      const productImage = document.querySelector('.product-image-container')
      if (!productImage) {
        console.log('Product image container not found')
        return
      }
      
      const rect = productImage.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // Convert to percentages
      const xPercent = (x / rect.width) * 100
      const yPercent = (y / rect.height) * 100
      
      // Update artwork coordinates
      const updatedArtwork = {
        ...artwork,
        coordinates: {
          ...artwork.coordinates,
          left_percent: Math.max(0, Math.min(100 - artwork.coordinates.width_percent, xPercent)),
          top_percent: Math.max(0, Math.min(100 - artwork.coordinates.height_percent, yPercent))
        }
      }
      
      // Update artworks array
      const updatedArtworks = artworks.map(a => 
        a.upload_id === artwork.upload_id ? updatedArtwork : a
      )
      console.log('Updating artwork coordinates during drag:', updatedArtwork.coordinates)
      setArtworks(updatedArtworks)
      latestArtworksRef.current = updatedArtworks // Store the latest coordinates
      
      // Update database in real-time during drag
      const designData = {
        artworks: updatedArtworks.map(a => ({
          position_id: a.position_id,
          upload_id: a.upload_id,
          coordinates: a.coordinates,
          properties: a.properties,
          url: a.url
        })),
        last_updated: new Date().toISOString()
      }
      
      console.log('=== DRAG UPDATE ===')
      console.log('Design ID:', design.id)
      console.log('Sending to update_design:', JSON.stringify(designData, null, 2))
      console.log('Current artwork coordinates:', JSON.stringify(updatedArtworks[0]?.coordinates, null, 2))
      
      // Use a debounced update to avoid too many database calls
      if (window.dragUpdateTimeout) {
        clearTimeout(window.dragUpdateTimeout)
      }
      
      window.dragUpdateTimeout = setTimeout(async () => {
        try {
          console.log('Attempting to update design during drag with data:', designData)
          const result = await updateDesignData(design.id, designData)
          console.log('Update result:', result)
          if (!result.success) {
            console.error('Failed to update design during drag:', result.error)
          } else {
            console.log('Design updated during drag successfully')
          }
        } catch (error) {
          console.error('Error updating design during drag:', error)
        }
      }, 100) // Update every 100ms during drag
    }
    
    const handleMouseUp = async () => {
      setIsDragging(false)
      isDraggingRef.current = false
      
      // Clear any pending drag updates
      if (window.dragUpdateTimeout) {
        clearTimeout(window.dragUpdateTimeout)
        window.dragUpdateTimeout = null
      }
      
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      // Final database update to ensure the last position is saved
      // Use the latest artworks from the ref to get the most recent coordinates
      const finalArtworks = latestArtworksRef.current.length > 0 ? latestArtworksRef.current : artworks
      const designData = {
        artworks: finalArtworks.map(a => ({
          position_id: a.position_id,
          upload_id: a.upload_id,
          coordinates: a.coordinates,
          properties: a.properties,
          url: a.url
        })),
        last_updated: new Date().toISOString()
      }
      
      console.log('=== FINAL DRAG UPDATE ===')
      console.log('Design ID:', design.id)
      console.log('Current artworks state:', JSON.stringify(artworks, null, 2))
      console.log('Latest artworks from ref:', JSON.stringify(latestArtworksRef.current, null, 2))
      console.log('Final artworks being sent:', JSON.stringify(finalArtworks, null, 2))
      console.log('Sending to update_design:', JSON.stringify(designData, null, 2))
      console.log('Final artwork coordinates:', JSON.stringify(finalArtworks[0]?.coordinates, null, 2))
      
      try {
        console.log('Final update after drag with data:', designData)
        const result = await updateDesignData(design.id, designData)
        if (!result.success) {
          console.error('Failed to update design:', result.error)
        } else {
          console.log('Final design update successful')
          // Real-time subscription will automatically update the UI
        }
      } catch (error) {
        console.error('Error updating design:', error)
      }
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // Handle artwork resize
  const handleResizeStart = (e, artwork, direction) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    isResizingRef.current = true
    
    const handleResizeMove = (e) => {
      if (!isResizingRef.current) return
      
      const productImage = document.querySelector('.product-image-container')
      if (!productImage) return
      
      const rect = productImage.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      
      // Convert to percentages
      const xPercent = (x / rect.width) * 100
      const yPercent = (y / rect.height) * 100
      
      let newCoordinates = { ...artwork.coordinates }
      
      switch (direction) {
        case 'se':
          newCoordinates.width_percent = Math.max(5, Math.min(80, xPercent - artwork.coordinates.left_percent))
          newCoordinates.height_percent = Math.max(5, Math.min(80, yPercent - artwork.coordinates.top_percent))
          break
        case 'sw':
          const newLeft = Math.max(0, Math.min(artwork.coordinates.left_percent + artwork.coordinates.width_percent - 5, xPercent))
          newCoordinates.left_percent = newLeft
          newCoordinates.width_percent = Math.max(5, artwork.coordinates.left_percent + artwork.coordinates.width_percent - newLeft)
          newCoordinates.height_percent = Math.max(5, Math.min(80, yPercent - artwork.coordinates.top_percent))
          break
        case 'ne':
          newCoordinates.width_percent = Math.max(5, Math.min(80, xPercent - artwork.coordinates.left_percent))
          const newTop = Math.max(0, Math.min(artwork.coordinates.top_percent + artwork.coordinates.height_percent - 5, yPercent))
          newCoordinates.top_percent = newTop
          newCoordinates.height_percent = Math.max(5, artwork.coordinates.top_percent + artwork.coordinates.height_percent - newTop)
          break
        case 'nw':
          const newLeftNW = Math.max(0, Math.min(artwork.coordinates.left_percent + artwork.coordinates.width_percent - 5, xPercent))
          newCoordinates.left_percent = newLeftNW
          newCoordinates.width_percent = Math.max(5, artwork.coordinates.left_percent + artwork.coordinates.width_percent - newLeftNW)
          const newTopNW = Math.max(0, Math.min(artwork.coordinates.top_percent + artwork.coordinates.height_percent - 5, yPercent))
          newCoordinates.top_percent = newTopNW
          newCoordinates.height_percent = Math.max(5, artwork.coordinates.top_percent + artwork.coordinates.height_percent - newTopNW)
          break
      }
      
      // Update artwork coordinates
      const updatedArtwork = {
        ...artwork,
        coordinates: newCoordinates
      }
      
      // Update artworks array
      const updatedArtworks = artworks.map(a => 
        a.upload_id === artwork.upload_id ? updatedArtwork : a
      )
      setArtworks(updatedArtworks)
      latestArtworksRef.current = updatedArtworks // Store the latest coordinates for resize
      
      // Update database in real-time during resize
      const designData = {
        artworks: updatedArtworks.map(a => ({
          position_id: a.position_id,
          upload_id: a.upload_id,
          coordinates: a.coordinates,
          properties: a.properties,
          url: a.url
        })),
        last_updated: new Date().toISOString()
      }
      
      console.log('=== RESIZE UPDATE ===')
      console.log('Design ID:', design.id)
      console.log('Sending to update_design:', JSON.stringify(designData, null, 2))
      console.log('Current artwork coordinates:', JSON.stringify(updatedArtworks[0]?.coordinates, null, 2))
      
      // Use a debounced update to avoid too many database calls
      if (window.resizeUpdateTimeout) {
        clearTimeout(window.resizeUpdateTimeout)
      }
      
      window.resizeUpdateTimeout = setTimeout(async () => {
        try {
          const result = await updateDesignData(design.id, designData)
          if (!result.success) {
            console.error('Failed to update design during resize:', result.error)
          } else {
            console.log('Design updated during resize')
          }
        } catch (error) {
          console.error('Error updating design during resize:', error)
        }
      }, 100) // Update every 100ms during resize
    }
    
    const handleResizeEnd = async () => {
      setIsResizing(false)
      isResizingRef.current = false
      
      // Clear any pending resize updates
      if (window.resizeUpdateTimeout) {
        clearTimeout(window.resizeUpdateTimeout)
        window.resizeUpdateTimeout = null
      }
      
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeEnd)
      
      // Final database update to ensure the last position is saved
      // Use the latest artworks from the ref to get the most recent coordinates
      const finalArtworks = latestArtworksRef.current.length > 0 ? latestArtworksRef.current : artworks
      const designData = {
        artworks: finalArtworks.map(a => ({
          position_id: a.position_id,
          upload_id: a.upload_id,
          coordinates: a.coordinates,
          properties: a.properties,
          url: a.url
        })),
        last_updated: new Date().toISOString()
      }
      
      console.log('=== FINAL RESIZE UPDATE ===')
      console.log('Design ID:', design.id)
      console.log('Current artworks state:', JSON.stringify(artworks, null, 2))
      console.log('Latest artworks from ref:', JSON.stringify(latestArtworksRef.current, null, 2))
      console.log('Final artworks being sent:', JSON.stringify(finalArtworks, null, 2))
      console.log('Sending to update_design:', JSON.stringify(designData, null, 2))
      console.log('Final artwork coordinates:', JSON.stringify(finalArtworks[0]?.coordinates, null, 2))
      
      try {
        console.log('Final update after resize with data:', designData)
        const result = await updateDesignData(design.id, designData)
        if (!result.success) {
          console.error('Failed to update design:', result.error)
        } else {
          console.log('Final design update successful')
          // Real-time subscription will automatically update the UI
        }
      } catch (error) {
        console.error('Error updating design:', error)
      }
    }
    
    document.addEventListener('mousemove', handleResizeMove)
    document.addEventListener('mouseup', handleResizeEnd)
  }

  // Set up real-time subscription for design updates
  const setupRealtimeSubscription = (designId) => {
    // Clean up any existing subscription
    if (realtimeSubscriptionRef.current) {
      supabase.removeChannel(realtimeSubscriptionRef.current)
    }
    
    console.log('Setting up real-time subscription for design:', designId)
    console.log('Available variants at subscription setup:', availableVariants)
    
    // Subscribe to changes on the designs table for this specific design
    realtimeSubscriptionRef.current = supabase
      .channel(`design-${designId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'designs',
          filter: `id=eq.${designId}`
        },
        (payload) => {
          console.log('Real-time design update received:', payload)
          
          // Only update if we're not currently dragging/resizing to avoid conflicts
          if (!isDraggingRef.current && !isResizingRef.current) {
            // Handle design data updates (artworks)
            if (payload.new.design_data && payload.new.design_data.artworks) {
              console.log('Updating artworks from real-time subscription:', payload.new.design_data.artworks)
              setArtworks(payload.new.design_data.artworks)
            }
            
            // Handle variant changes
            if (payload.new.variant_id !== payload.old?.variant_id) {
              console.log('=== VARIANT CHANGE DETECTED ===')
              console.log('Old variant_id:', payload.old?.variant_id)
              console.log('New variant_id:', payload.new.variant_id)
              console.log('Available variants:', availableVariants)
              console.log('Current variant:', currentVariant)
              
              // Find the new variant from available variants
              const newVariant = availableVariants.find(v => v.id === payload.new.variant_id)
              console.log('Found new variant:', newVariant)
              
              if (newVariant) {
                console.log('Updating current variant to:', newVariant)
                setCurrentVariant(newVariant)
                
                // Update the product image to reflect the new variant
                setProduct(prev => ({
                  ...prev,
                  image_url: newVariant.image_url,
                  variant: newVariant
                }))
                
                console.log('Variant update completed successfully')
              } else {
                console.error('Variant not found in availableVariants:', payload.new.variant_id)
                console.log('Available variant IDs:', availableVariants.map(v => v.id))
              }
            }
          } else {
            console.log('Ignoring real-time update during drag/resize')
          }
        }
      )
      .subscribe()
  }
  
  // Clean up real-time subscription on unmount
  useEffect(() => {
    return () => {
      if (realtimeSubscriptionRef.current) {
        console.log('Cleaning up real-time subscription')
        supabase.removeChannel(realtimeSubscriptionRef.current)
      }
    }
  }, [])

  // Keyboard controls for moving selected artwork
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedArtwork) return

      // Prevent default behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
      }

      const moveAmount = e.shiftKey ? 5 : 1 // Larger movement with Shift
      let updatedArtwork = { ...selectedArtwork }

      switch (e.key) {
        case 'ArrowUp':
          updatedArtwork.coordinates = {
            ...updatedArtwork.coordinates,
            top_percent: Math.max(0, updatedArtwork.coordinates.top_percent - moveAmount)
          }
          break
        case 'ArrowDown':
          updatedArtwork.coordinates = {
            ...updatedArtwork.coordinates,
            top_percent: Math.min(100 - updatedArtwork.coordinates.height_percent, updatedArtwork.coordinates.top_percent + moveAmount)
          }
          break
        case 'ArrowLeft':
          updatedArtwork.coordinates = {
            ...updatedArtwork.coordinates,
            left_percent: Math.max(0, updatedArtwork.coordinates.left_percent - moveAmount)
          }
          break
        case 'ArrowRight':
          updatedArtwork.coordinates = {
            ...updatedArtwork.coordinates,
            left_percent: Math.min(100 - updatedArtwork.coordinates.width_percent, updatedArtwork.coordinates.left_percent + moveAmount)
          }
          break
        default:
          return
      }

      // Update artworks array
      const updatedArtworks = artworks.map(a => 
        a.upload_id === selectedArtwork.upload_id ? updatedArtwork : a
      )
      setArtworks(updatedArtworks)
      setSelectedArtwork(updatedArtwork)

      // Update database
      const designData = {
        artworks: updatedArtworks.map(a => ({
          position_id: a.position_id,
          upload_id: a.upload_id,
          coordinates: a.coordinates,
          properties: a.properties,
          url: a.url
        })),
        last_updated: new Date().toISOString()
      }

      // Debounced database update
      if (window.keyboardUpdateTimeout) {
        clearTimeout(window.keyboardUpdateTimeout)
      }
      
      window.keyboardUpdateTimeout = setTimeout(async () => {
        try {
          const result = await updateDesignData(design.id, designData)
          if (!result.success) {
            console.error('Failed to update design during keyboard movement:', result.error)
          }
        } catch (error) {
          console.error('Error updating design during keyboard movement:', error)
        }
      }, 100)
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (window.keyboardUpdateTimeout) {
        clearTimeout(window.keyboardUpdateTimeout)
      }
    }
  }, [selectedArtwork, artworks, design])
  
  // Re-setup real-time subscription when availableVariants changes
  useEffect(() => {
    if (design && availableVariants.length > 0) {
      console.log('Re-setting up real-time subscription due to availableVariants change')
      setupRealtimeSubscription(design.id)
    }
  }, [availableVariants, design])

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

  const handleDeleteArtwork = async (artwork) => {
    if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return
    }

    try {
      // Extract file path from URL for storage deletion
      const urlParts = artwork.url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      // Delete from Supabase storage
      const { error: storageError } = await supabase.storage
        .from('user-uploads')
        .remove([fileName])

      if (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Continue with design data update even if storage deletion fails
      }

      // Remove artwork from local state
      const updatedArtworks = artworks.filter(a => a.upload_id !== artwork.upload_id)
      setArtworks(updatedArtworks)

      // Update design data in database
      const designData = {
        artworks: updatedArtworks.map(a => ({
          position_id: a.position_id,
          upload_id: a.upload_id,
          coordinates: a.coordinates,
          properties: a.properties,
          url: a.url
        }))
      }

      const result = await updateDesignData(design.id, designData)
      if (!result.success) {
        console.error('Failed to update design data after deletion:', result.error)
        alert('Design deleted from storage but failed to update design data. Please refresh the page.')
      } else {
        console.log('Artwork deleted successfully')
      }
    } catch (error) {
      console.error('Error deleting artwork:', error)
      alert('Failed to delete design. Please try again.')
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
    <div className="min-h-screen bg-white" key={store?.settings?.localization?.locale || 'GB'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Design Header - Removed title and design ID */}
        <div className="mb-8">
          {/* Empty header space for layout consistency */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Preview */}
          <div>
                            <div 
                  className="aspect-square bg-white rounded-lg flex items-center justify-center mb-4 relative product-image-container"
                  onClick={() => setSelectedArtwork(null)}
                >
              {product.image_url ? (
                <>
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                  {/* Position Boundary Overlay */}
                  {(hoveredPosition || currentPosition) && (hoveredPosition?.position_data || currentPosition?.position_data) && (
                    <div 
                      className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none z-10"
                      style={{
                        top: `${(hoveredPosition || currentPosition).position_data.coordinates.top_percent}%`,
                        left: `${(hoveredPosition || currentPosition).position_data.coordinates.left_percent}%`,
                        width: `${(hoveredPosition || currentPosition).position_data.coordinates.width_percent}%`,
                        height: `${(hoveredPosition || currentPosition).position_data.coordinates.height_percent}%`,
                      }}
                    />
                  )}

                  {/* Artwork Overlays */}
                  {console.log('Artworks for product display:', artworks)}
                  {console.log('Selected artwork:', selectedArtwork)}
                  {console.log('First artwork for display:', JSON.stringify(artworks[0], null, 2))}
                  {artworks.map((artwork, index) => (
                    <div
                      key={index}
                      className="absolute pointer-events-auto"
                      style={{
                        top: `${artwork.coordinates.top_percent}%`,
                        left: `${artwork.coordinates.left_percent}%`,
                        width: `${artwork.coordinates.width_percent}%`,
                        height: `${artwork.coordinates.height_percent}%`,
                        transform: `rotate(${artwork.properties.rotation}deg)`,
                        opacity: artwork.properties.opacity,
                        zIndex: artwork.properties.z_index + 20, // Higher than position boundary
                        cursor: selectedArtwork?.upload_id === artwork.upload_id ? 'move' : 'pointer',
                        border: selectedArtwork?.upload_id === artwork.upload_id ? '3px solid #ef4444' : 'none', // Red border for artwork
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleArtworkSelect(artwork)
                      }}
                      onMouseDown={(e) => {
                        console.log('Mouse down event triggered on artwork:', artwork.upload_id)
                        console.log('Selected artwork:', selectedArtwork?.upload_id)
                        if (selectedArtwork?.upload_id === artwork.upload_id) {
                          console.log('Calling handleMouseDown')
                          handleMouseDown(e, artwork)
                        } else {
                          console.log('Artwork not selected, selecting it first')
                          handleArtworkSelect(artwork)
                        }
                      }}
                    >
                      <img
                        src={artwork.url}
                        alt={`Design ${index + 1}`}
                        className="w-full h-full object-contain pointer-events-none"
                        onError={(e) => {
                          console.error('Failed to load image on product:', artwork.url)
                        }}
                      />
                      
                      {/* Resize handles */}
                      {selectedArtwork?.upload_id === artwork.upload_id && (
                        <>
                          {/* Top-left resize handle */}
                          <div
                            className="absolute top-0 left-0 w-3 h-3 bg-blue-500 cursor-nw-resize"
                            onMouseDown={(e) => handleResizeStart(e, artwork, 'nw')}
                          />
                          {/* Top-right resize handle */}
                          <div
                            className="absolute top-0 right-0 w-3 h-3 bg-blue-500 cursor-ne-resize"
                            onMouseDown={(e) => handleResizeStart(e, artwork, 'ne')}
                          />
                          {/* Bottom-left resize handle */}
                          <div
                            className="absolute bottom-0 left-0 w-3 h-3 bg-blue-500 cursor-sw-resize"
                            onMouseDown={(e) => handleResizeStart(e, artwork, 'sw')}
                          />
                          {/* Bottom-right resize handle */}
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                            onMouseDown={(e) => handleResizeStart(e, artwork, 'se')}
                          />
                        </>
                      )}
                    </div>
                  ))}

                </>
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
                        onMouseEnter={() => setHoveredPosition(position)}
                        onMouseLeave={() => setHoveredPosition(null)}
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
                        {(currentPosition?.id === position.id || artworks.some(artwork => artwork.position_id === position.id)) && (
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
                <div className="absolute inset-0 rounded-lg bg-white z-10"
                style={{ 
                  backgroundColor: '#FAFAFA', 
                  borderRadius: '20px'
                }}>
                  {/* Position Customization Header */}
                  <div className="flex items-center gap-4 p-6 border-b border-gray-200">
                    <button
                      onClick={() => {
                        setShowPositionCustomization(false)
                        setCurrentPosition(null) // Clear current position when exiting
                        setHoveredPosition(null) // Clear hover state when exiting
                      }}
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
                  <div className="p-6">
                    {/* Upload Section */}
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Upload Design</h4>
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors duration-200"
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.classList.add('border-blue-500', 'bg-blue-50')
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                        }}
                        onDrop={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50')
                          
                          const files = Array.from(e.dataTransfer.files)
                          const imageFiles = files.filter(file => 
                            file.type.startsWith('image/') && 
                            ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)
                          )
                          
                          if (imageFiles.length > 0) {
                            handleFileUpload(imageFiles[0])
                          } else {
                            alert('Please drop a valid image file (PNG, JPG, or SVG)')
                          }
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                          id="file-upload"
                          disabled={uploading}
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {uploading ? 'Uploading...' : 'Choose File'}
                        </label>
                        <p className="mt-2 text-sm text-gray-500">
                          Upload PNG, JPG, or SVG files
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Or drag and drop files here
                        </p>
                      </div>
                    </div>

                    {/* Uploaded Artworks */}
                    {console.log('Current artworks:', artworks)}
                    {console.log('Current position:', currentPosition)}
                    {console.log('Filtered artworks:', artworks.filter(artwork => artwork.position_id === currentPosition?.id))}
                    {artworks.filter(artwork => artwork.position_id === currentPosition?.id).length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Uploaded Designs</h4>
                        <div className="grid grid-cols-2 gap-4">
                          {artworks
                            .filter(artwork => artwork.position_id === currentPosition?.id)
                            .map((artwork, index) => (
                              <div key={index} className="border rounded-lg p-3 relative">
                                <img
                                  src={artwork.url}
                                  alt={`Design ${index + 1}`}
                                  className="w-full h-24 object-cover rounded"
                                  onError={(e) => {
                                    console.error('Failed to load image:', artwork.url)
                                  }}
                                />
                                <div className="flex justify-between items-center mt-2">
                                  <p className="text-sm text-gray-600">Design {index + 1}</p>
                                  <button
                                    onClick={() => handleDeleteArtwork(artwork)}
                                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors duration-200"
                                    title="Delete design"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
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