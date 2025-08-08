-- Function to update a design's variant and design data
CREATE OR REPLACE FUNCTION update_design(
  p_design_id INTEGER,
  p_variant_id INTEGER DEFAULT NULL,
  p_design_data JSONB DEFAULT NULL
) RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
DECLARE
  updated_design designs%ROWTYPE;
BEGIN
  -- Check if design exists
  IF NOT EXISTS (SELECT 1 FROM designs WHERE id = p_design_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Design not found'
    );
  END IF;

  -- Check if variant exists (optional - remove if you want to allow NULL variant_id)
  IF p_variant_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM variants WHERE id = p_variant_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Variant not found'
    );
  END IF;

  -- Update the design
  UPDATE designs 
  SET 
    variant_id = COALESCE(p_variant_id, variant_id),
    design_data = COALESCE(p_design_data, design_data),
    updated_at = NOW()
  WHERE id = p_design_id
  RETURNING * INTO updated_design;

  -- Return the updated design
  RETURN json_build_object(
    'success', true,
    'design', row_to_json(updated_design)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;
