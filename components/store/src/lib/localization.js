// Localization configuration
export const localizations = {
  GB: {
    customize: 'Customise',
    customizeProduct: 'Customise {product}',
    ourRange: 'Our Range',
    myDesigns: 'My Designs',
    manageAndEdit: 'Manage and edit your custom designs',
    noDesignsYet: 'No designs yet',
    createFirstDesign: 'Create your first design by browsing our products',
    browseProducts: 'Browse Products',
    editDesign: 'Edit Design',
    addToCart: 'Add to Cart',
    designPreview: 'Design preview would go here',
    designEditor: 'Design Editor',
    designCustomization: 'Design customisation interface would go here',
    designCustomizationTools: 'This is where users would customise their design with tools like:',
    textEditor: 'Text editor',
    imageUpload: 'Image upload',
    colorPicker: 'Colour picker',
    layoutTools: 'Layout tools',
    previewFunctionality: 'Preview functionality',
    noProductsAvailable: 'No products available at this time',
    noImage: 'No image',
    noImageAvailable: 'No image available',
    categories: 'Categories',
    comingSoon: 'Coming soon...',
    cart: 'Cart',
    cartItems: 'Cart: {count} items',
    loading: 'Loading...',
    loadingDesigns: 'Loading your designs...',
    loadingDesign: 'Loading design...',
    storeNotFound: 'Store not found',
    designNotFound: 'Design not found',
    failedToLoad: 'Failed to load',
    tryAgain: 'Try Again',
    closeTab: 'Close Tab'
  },
  US: {
    customize: 'Customize',
    customizeProduct: 'Customize {product}',
    ourRange: 'Our Range',
    myDesigns: 'My Designs',
    manageAndEdit: 'Manage and edit your custom designs',
    noDesignsYet: 'No designs yet',
    createFirstDesign: 'Create your first design by browsing our products',
    browseProducts: 'Browse Products',
    editDesign: 'Edit Design',
    addToCart: 'Add to Cart',
    designPreview: 'Design preview would go here',
    designEditor: 'Design Editor',
    designCustomization: 'Design customization interface would go here',
    designCustomizationTools: 'This is where users would customize their design with tools like:',
    textEditor: 'Text editor',
    imageUpload: 'Image upload',
    colorPicker: 'Color picker',
    layoutTools: 'Layout tools',
    previewFunctionality: 'Preview functionality',
    noProductsAvailable: 'No products available at this time',
    noImage: 'No image',
    noImageAvailable: 'No image available',
    categories: 'Categories',
    comingSoon: 'Coming soon...',
    cart: 'Cart',
    cartItems: 'Cart: {count} items',
    loading: 'Loading...',
    loadingDesigns: 'Loading your designs...',
    loadingDesign: 'Loading design...',
    storeNotFound: 'Store not found',
    designNotFound: 'Design not found',
    failedToLoad: 'Failed to load',
    tryAgain: 'Try Again',
    closeTab: 'Close Tab'
  }
}

// Default to GB if no localization is specified
const defaultLocale = 'GB'

// Helper function to get localized text
export const getLocalizedText = (localization, key, replacements = {}) => {
  // Map locale codes to our localization keys
  let localeKey = 'GB' // default
  
  if (localization) {
    if (localization === 'en-GB' || localization === 'GB') {
      localeKey = 'GB'
    } else if (localization === 'en-US' || localization === 'US') {
      localeKey = 'US'
    }
  }
  
  const locale = localizations[localeKey] || localizations['GB']
  let text = locale[key] || localizations['GB'][key] || key
  
  // Replace placeholders
  Object.keys(replacements).forEach(placeholder => {
    text = text.replace(`{${placeholder}}`, replacements[placeholder])
  })
  
  return text
}

// Hook for easy access to localized text
export const useLocalization = (localization) => {
  return {
    t: (key, replacements = {}) => getLocalizedText(localization, key, replacements),
    locale: localization || 'GB'
  }
} 