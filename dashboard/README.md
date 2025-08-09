# Dashboard

A comprehensive dashboard for managing quotes and orders, complementing the Sprint v2 ecosystem.

## Features

- **Quotes Management**: View and manage orders with status `quote_requested`, `quote_sent`, `approved`
- **Orders Management**: Track orders with status `paid`, `in_production`, `completed`
- **Real-time Updates**: Supabase subscriptions for live data updates
- **Order Details**: Full customer info, enquiry notes, uploaded files, and order items
- **Status Progression**: Update order statuses through the workflow
- **Search & Filter**: Find orders by customer name, email, or order number
- **Mobile Responsive**: Works on all device sizes

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Setup:**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url_here
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

3. **Start the application:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Database Schema Requirements

The dashboard expects these Supabase tables:

- `orders` - Main orders table with columns: id, order_number, status, total_amount, enquiry_notes, created_at, customer_id
- `customers` - Customer information with columns: id, name, email
- `uploads` - File uploads with columns: id, order_id, file_name, file_size, created_at
- `order_items` - Order line items with columns: id, order_id, description, price, product_name, amount

## Technology Stack

- **React** - Frontend framework
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Supabase** - Backend and real-time subscriptions
- **Lucide React** - Icons
- **date-fns** - Date formatting

## Integration

This dashboard works alongside:
- `/components/store` - Customer-facing store
- `/components/quote` - Quote request form

Together they provide a complete order management system.