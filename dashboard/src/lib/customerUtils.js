// Utility function to extract the correct customer name
export function getCustomerDisplayName(quote) {
  try {
    // First try to use the customer record fields
    const firstName = quote.customers?.first_name;
    const lastName = quote.customers?.last_name;
    
    // If last_name is "Quote" (data issue), try to extract from enquiry_notes
    if (lastName === 'Quote' && quote.enquiry_notes) {
      const enquiryData = JSON.parse(quote.enquiry_notes);
      const correctFirstName = enquiryData.firstName || firstName;
      const correctLastName = enquiryData.lastName;
      
      if (correctLastName && correctLastName !== 'Quote') {
        return `${correctFirstName || ''} ${correctLastName}`.trim();
      }
    }
    
    // Default to customer record data
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
  } catch (error) {
    // Fallback if JSON parsing fails
    const firstName = quote.customers?.first_name;
    const lastName = quote.customers?.last_name;
    return `${firstName || ''} ${lastName || ''}`.trim() || 'Unknown';
  }
}