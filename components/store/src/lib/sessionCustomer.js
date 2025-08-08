import { supabase } from './supabase'

// Helper function to get or create a session customer using Supabase function
export const getSessionCustomer = async () => {
  // Check localStorage for existing session ID
  const existingSessionId = localStorage.getItem('session_id')
  
  console.log('getSessionCustomer - existingSessionId:', existingSessionId)
  
  try {
    // Call the Supabase function to get or create session customer
    const { data, error } = await supabase
      .rpc('get_session_customer', {
        p_session_id: existingSessionId
      })

    console.log('getSessionCustomer - function response:', { data, error })

    if (error) {
      console.error('Error calling get_session_customer:', error)
      throw error
    }

    if (!data || !data.success) {
      console.error('Function returned error:', data)
      throw new Error(data?.error || 'Failed to get session customer')
    }

    // Store the session ID in localStorage for future use
    localStorage.setItem('session_id', data.session_id)
    
    console.log('getSessionCustomer - returning customer_id:', data.customer_id)
    return data.customer_id
  } catch (error) {
    console.error('Error in getSessionCustomer:', error)
    throw error
  }
}

// Helper function to clear session customer (for logout)
export const clearSessionCustomer = () => {
  localStorage.removeItem('session_id')
}

// Helper function to get current session ID without creating one
export const getCurrentSessionId = () => {
  return localStorage.getItem('session_id')
}

// Helper function to get current session customer ID without creating one
export const getCurrentSessionCustomerId = async () => {
  const sessionId = getCurrentSessionId()
  if (!sessionId) return null
  
  try {
    const { data, error } = await supabase
      .rpc('get_session_customer', {
        p_session_id: sessionId
      })

    if (error || !data?.success) {
      return null
    }

    return data.customer_id
  } catch (error) {
    console.error('Error getting current session customer ID:', error)
    return null
  }
}
