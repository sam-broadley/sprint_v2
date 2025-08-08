import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useLocalization } from '../lib/localization'
import Header from './Header'
import FloatingCartButton from './FloatingCartButton'

const Layout = ({ children }) => {
  const { getCartTotal } = useCart()
  const { t } = useLocalization('GB') // Default to GB if no store context
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header onMobileMenuToggle={setMobileMenuOpen} />

      {/* Floating Cart Button */}
      <FloatingCartButton />

      {/* Main Content Area */}
      <main className={`transition-all duration-300 ${mobileMenuOpen ? 'pt-32' : 'pt-16'}`}>
        {children}
      </main>
    </div>
  )
}

export default Layout 