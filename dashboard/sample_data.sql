-- Sample data for testing the dashboard
-- Run this in your Supabase SQL editor to create test data

-- Insert sample stores (if you need one for "haloprintco")
INSERT INTO stores (name, slug, domain, store_type, branding, quote_settings) VALUES
('Halo Print Co', 'haloprintco', 'haloprintco.com', 'permanent', 
 '{"primaryColor": "#3b82f6", "accentColor": "#1d4ed8"}',
 '{"notification_email": "admin@haloprintco.com"}')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample customers
INSERT INTO customers (email, first_name, last_name, phone, company) VALUES
('john.doe@example.com', 'John', 'Doe', '+1-555-0123', 'ABC Corp'),
('jane.smith@company.com', 'Jane', 'Smith', '+1-555-0124', 'XYZ Ltd'),
('mike.wilson@startup.io', 'Mike', 'Wilson', '+1-555-0125', 'StartupCo')
ON CONFLICT (email) DO NOTHING;

-- Insert sample orders
WITH store_data AS (
  SELECT id FROM stores WHERE slug = 'haloprintco' LIMIT 1
),
customer_data AS (
  SELECT * FROM (VALUES 
    ('john.doe@example.com'),
    ('jane.smith@company.com'), 
    ('mike.wilson@startup.io')
  ) AS emails(email)
)
INSERT INTO orders (store_id, customer_id, order_number, status, enquiry_notes, total_amount, subtotal) 
SELECT 
  store_data.id,
  customers.id,
  'QUO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  CASE ROW_NUMBER() OVER() % 5
    WHEN 1 THEN 'quote_requested'
    WHEN 2 THEN 'quote_sent' 
    WHEN 3 THEN 'paid'
    WHEN 4 THEN 'in_production'
    ELSE 'completed'
  END,
  CASE ROW_NUMBER() OVER() % 3
    WHEN 1 THEN 'Need custom t-shirts for company event. Looking for high quality prints with our logo.'
    WHEN 2 THEN 'Bulk order for promotional items. Need pricing for different quantities.'
    ELSE 'Custom design for trade show booth. Rush order if possible.'
  END,
  CASE ROW_NUMBER() OVER() % 5
    WHEN 1 THEN NULL  -- quote_requested has no price yet
    WHEN 2 THEN 299.99
    WHEN 3 THEN 450.00
    WHEN 4 THEN 675.50
    ELSE 850.00
  END,
  CASE ROW_NUMBER() OVER() % 5
    WHEN 1 THEN NULL
    WHEN 2 THEN 299.99
    WHEN 3 THEN 450.00  
    WHEN 4 THEN 675.50
    ELSE 850.00
  END
FROM store_data, customer_data
JOIN customers ON customers.email = customer_data.email;