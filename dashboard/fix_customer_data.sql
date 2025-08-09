-- Fix the customer record with incorrect last_name
UPDATE customers 
SET last_name = 'Broadley'
WHERE email = 'sam@broadley.com.au' AND last_name = 'Quote';

-- Verify the fix
SELECT id, email, first_name, last_name FROM customers WHERE email = 'sam@broadley.com.au';