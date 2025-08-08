import { supabase } from './supabase'

// Function to update a design's variant using Supabase RPC
export const updateDesignVariant = async (designId, variantId) => {
  try {
    const { data, error } = await supabase
      .rpc('update_design', {
        p_design_id: designId,
        p_variant_id: variantId
      })

    if (error) {
      console.error('Error calling update_design:', error)
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

// Function to update design data (artworks, etc.)
export const updateDesignData = async (designId, designData) => {
  try {
    console.log('updateDesignData called with:', { designId, designData })
    
    // Try RPC first
    const { data, error } = await supabase
      .rpc('update_design', {
        p_design_id: designId,
        p_design_data: designData
      })

    if (error) {
      console.error('RPC failed, trying direct update:', error)
      
      // Fallback to direct table update
      const { data: updateData, error: updateError } = await supabase
        .from('designs')
        .update({ 
          design_data: designData,
          updated_at: new Date().toISOString()
        })
        .eq('id', designId)
        .select()

      if (updateError) {
        console.error('Direct update also failed:', updateError)
        throw updateError
      }

      console.log('Direct update successful:', updateData)
      return { success: true, design: updateData[0] }
    }

    if (!data || !data.success) {
      console.error('Function returned error:', data)
      throw new Error(data?.error || 'Failed to update design data')
    }

    console.log('RPC update successful:', data)
    console.log('Returned design data:', JSON.stringify(data.design, null, 2))
    console.log('Returned design_data field:', JSON.stringify(data.design?.design_data, null, 2))
    return { success: true, design: data.design }
  } catch (error) {
    console.error('Error in updateDesignData:', error)
    return { success: false, error }
  }
}

// Function to upload file to Supabase storage
export const uploadFile = async (file, bucket = 'user-uploads') => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${fileName}`

    console.log('Attempting to upload file:', fileName, 'to bucket:', bucket)

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Error uploading file:', error)
      throw error
    }

    console.log('File uploaded successfully:', data)

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    console.log('Public URL:', publicUrl)

    return { success: true, url: publicUrl, path: filePath }
  } catch (error) {
    console.error('Error in uploadFile:', error)
    return { success: false, error }
  }
}
