-- Updated function to handle customer creation more robustly
CREATE OR REPLACE FUNCTION create_quote_request(
  store_slug_param TEXT,
  form_data JSONB
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER AS $$
DECLARE
  store_record RECORD;
  customer_record RECORD;
  order_record RECORD;
  order_number_val TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
BEGIN
  -- Get store
  SELECT * INTO store_record FROM stores WHERE slug = store_slug_param;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Store not found');
  END IF;

  -- Extract and validate name fields
  first_name_val := COALESCE(form_data->>'firstName', form_data->>'first_name', '');
  last_name_val := COALESCE(form_data->>'lastName', form_data->>'last_name', '');
  
  -- Debug logging (remove after fixing)
  RAISE NOTICE 'Creating customer with firstName: %, lastName: %', first_name_val, last_name_val;

  -- Create or get customer
  SELECT * INTO customer_record FROM customers WHERE email = form_data->>'email';

  IF NOT FOUND THEN
    INSERT INTO customers (first_name, last_name, email, phone, company)
    VALUES (
      first_name_val,
      last_name_val,
      form_data->>'email',
      form_data->>'phone',
      form_data->>'company'
    )
    RETURNING * INTO customer_record;
  ELSE
    -- Update existing customer with latest info if names are different
    IF customer_record.first_name != first_name_val OR customer_record.last_name != last_name_val THEN
      UPDATE customers 
      SET 
        first_name = first_name_val,
        last_name = last_name_val,
        phone = COALESCE(form_data->>'phone', phone),
        company = COALESCE(form_data->>'company', company),
        updated_at = NOW()
      WHERE id = customer_record.id
      RETURNING * INTO customer_record;
    END IF;
  END IF;

  -- Generate order number
  order_number_val := 'QUO-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' ||
                     SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5);

  -- Create order (store entire form_data as enquiry_notes)
  INSERT INTO orders (store_id, customer_id, order_number, status, enquiry_notes)
  VALUES (store_record.id, customer_record.id, order_number_val, 'quote_requested', form_data::TEXT)
  RETURNING * INTO order_record;

  RETURN json_build_object(
    'success', true,
    'orderNumber', order_number_val,
    'message', 'Quote request submitted successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;