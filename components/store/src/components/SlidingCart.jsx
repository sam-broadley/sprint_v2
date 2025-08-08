import React from 'react'
import { useCart } from '../hooks/useCart'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

const SlidingCart = ({ isOpen, onClose }) => {
  const { cartItemsWithDetails, cartLoading, removeFromCart } = useCart()

  console.log('SlidingCart render - isOpen:', isOpen)

  const handleRemoveFromCart = (designId) => {
    removeFromCart(designId)
  }

  const handleContinueToCheckout = () => {
    // For now, redirect to Stripe
    window.open('https://stripe.com', '_blank')
  }

  const handleClose = () => {
    console.log('Cart close button clicked')
    onClose()
  }

  const totalPrice = cartItemsWithDetails.reduce((sum, item) => sum + (item.product?.price || 0), 0)

  return (
    <>
      {/* Sliding Cart Panel */}
      <div className={`fixed right-0 top-0 bottom-0 w-80 bg-white border border-gray-300 rounded-l-lg overflow-y-auto transform transition-transform duration-300 ease-in-out z-50 lg:right-4 lg:top-4 lg:bottom-4 lg:rounded-lg ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Cart Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
            <button
              onClick={handleClose}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading cart...</p>
            </div>
          ) : cartItemsWithDetails.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItemsWithDetails.map((item, index) => (
                <Card key={`${item.id}-${index}`} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-sm">
                          {item.product?.name || `Design #${item.id}`}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {item.product?.description || 'Custom design'}
                        </CardDescription>
                      </div>
                      <button
                        onClick={() => handleRemoveFromCart(item.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="bg-gray-100 rounded-lg p-2 w-16 h-16 flex items-center justify-center">
                        {item.product?.image_url ? (
                          <img 
                            src={item.product.image_url} 
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="text-gray-400 text-xs">No image</div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${item.product?.price || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cart Footer */}
        {cartItemsWithDetails.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-semibold">${totalPrice.toFixed(2)}</span>
            </div>
            <Button 
              onClick={handleContinueToCheckout}
              className="w-full"
            >
              Continue to Checkout
            </Button>
          </div>
        )}
      </div>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={handleClose}
        />
      )}
    </>
  )
}

export default SlidingCart 