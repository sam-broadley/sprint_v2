# Sprint V2 - Store Product Catalog

A React app built with Radix UI primitives that allows customers to browse store products, create custom designs, and add items to cart.

## Features

- **Store-specific URLs**: Each store has a unique URL based on their `short_name` (e.g., `/haloprintco`)
- **Product Grid**: Displays all products for a specific store
- **Design Creation**: Users can create custom designs for products
- **Cart Management**: Add items to cart with automatic order creation
- **Responsive Design**: Works on desktop and mobile devices

## Database Schema

The app works with the following Supabase tables:

- `stores` - Store information with `short_name` for URL routing
- `store_products` - Products available at each store
- `designs` - Custom designs created by users
- `orders` - Customer orders
- `order_items` - Individual items within orders

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `env.example` to `.env` and add your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Access the app**:
   - Default store: `http://localhost:3000/haloprintco`
   - Any store: `http://localhost:3000/{store_short_name}`

## Database Setup

Make sure your Supabase database has the following tables and indexes:

```sql
-- Stores table
CREATE TABLE stores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT UNIQUE NOT NULL,
  description TEXT
);

-- Store products table
CREATE TABLE store_products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT
);

-- Designs table
CREATE TABLE designs (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL,
  store_product_id INTEGER REFERENCES store_products(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  design_id INTEGER REFERENCES designs(id),
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes (as provided)
CREATE INDEX idx_designs_slug ON public.designs(slug);
CREATE INDEX idx_designs_customer_id ON public.designs(customer_id);
CREATE INDEX idx_designs_store_product_id ON public.designs(store_product_id);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_design_id ON public.order_items(design_id);
```

## Sample Data

Add some sample data to test the app:

```sql
-- Insert a sample store
INSERT INTO stores (name, short_name, description) 
VALUES ('Halo Print Co', 'haloprintco', 'Custom printing and design services');

-- Insert sample products
INSERT INTO store_products (store_id, name, description, price, image_url) 
VALUES 
  (1, 'Custom T-Shirt', 'High-quality cotton t-shirt with custom design', 25.00, NULL),
  (1, 'Business Cards', 'Professional business cards with your design', 50.00, NULL),
  (1, 'Posters', 'Large format posters for events and advertising', 15.00, NULL);
```

## Missing Features

Based on your requirements, here are some things you might want to add:

1. **Authentication**: Currently uses a hardcoded `customer_id = 1`
2. **Design Editor**: The design creation is basic - you'll want a proper design interface
3. **Stripe Integration**: For payment processing
4. **Cart Page**: Currently just shows cart count in header
5. **Order Management**: View order history, order status, etc.
6. **Image Upload**: For product images and design assets
7. **Error Handling**: More robust error handling and user feedback

## Tech Stack

- **React 18** - UI framework
- **React Router** - Client-side routing
- **Radix UI** - Accessible UI primitives
- **Tailwind CSS** - Styling
- **Supabase** - Backend database and API 