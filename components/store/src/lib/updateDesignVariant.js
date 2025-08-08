import { supabase } from './supabase'

// Function to update a design's variant using Supabase RPC
export const updateDesignVariant = async (designId, variantId) => {
  try {
    const { data, error } = await supabase
      .rpc('update_design_variant', {
        p_design_id: designId,
        p_variant_id: variantId
      })

    if (error) {
      console.error('Error calling update_design_variant:', error)
      throw error
    }

    if (!data || !data.success) {
      console.error('Function returned error:', data)
      throw new Error(data?.error || 'Failed to update design variant')
    }

    return { success: true, design: data.design }
  } catch (error) {
    console.error('Error in updateDesignVariant:', error)
    return { success: false, error }
  }
}
