import React, { useState } from 'react'
import { useCart } from '../hooks/useCart'
import SlidingCart from './SlidingCart'

const FloatingCartButton = () => {
  const { getCartTotal } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)
  
  const cartTotal = getCartTotal()

  const handleOpenCart = () => {
    console.log('Opening cart, current state:', isCartOpen)
    setIsCartOpen(true)
  }

  const handleCloseCart = () => {
    console.log('Closing cart, current state:', isCartOpen)
    setIsCartOpen(false)
  }

  if (cartTotal === 0) return null

  return (
    <>
      {/* Floating Cart Button */}
      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={handleOpenCart}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 shadow-lg border-2 border-white flex items-center space-x-2 font-medium"
        >
          <div className="relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
            </svg>
            {/* Cart Badge */}
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
              {cartTotal}
            </div>
          </div>
          <span>Cart</span>
        </button>
      </div>

      {/* Sliding Cart Panel */}
      <SlidingCart 
        isOpen={isCartOpen} 
        onClose={handleCloseCart} 
      />
    </>
  )
}

export default FloatingCartButton 