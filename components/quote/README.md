# Quote Request Embed

An embeddable quote request form that creates draft orders with status 'quote_requested'. The form captures customer details, product requirements, and handles file uploads while matching store branding.

## Features

- 📋 Comprehensive quote request form with validation
- 🎨 Automatic store branding integration
- 📁 File upload support with drag & drop
- 🔔 Email notifications to store owners
- 👤 Automatic customer creation/lookup
- 📦 Draft order creation with enquiry notes
- 🌐 Single script tag embedding
- 📱 Responsive design

## Quick Start

### 1. Development Setup

```bash
npm install
npm start
```

### 2. Build for Production

```bash
npm run build
```

### 3. Deploy Supabase Function

```bash
# Deploy the email notification function
supabase functions deploy send-quote-request-email
```

## Embedding the Form

### Option 1: Auto-initialization with data attributes

```html
<script src="https://your-domain.com/embed.js"></script>

<div id="quote-form" 
     data-quote-embed
     data-store-slug="your-store-slug"
     data-api-url="https://your-supabase-url.supabase.co"
     data-anon-key="your-supabase-anon-key">
</div>
```

### Option 2: Manual initialization

```html
<script src="https://your-domain.com/embed.js"></script>
<div id="quote-form"></div>

<script>
QuoteEmbed.init('quote-form', {
    storeSlug: 'your-store-slug',
    apiUrl: 'https://your-supabase-url.supabase.co',
    anonKey: 'your-supabase-anon-key',
    branding: {
        primaryColor: '#3b82f6',
        accentColor: '#1d4ed8'
    }
});
</script>
```

## Form Fields

The form captures the following information:

**Customer Details:**
- First Name (required)
- Last Name (required)
- Email (required)
- Phone
- Company

**Product Requirements:**
- Product Categories (required) - shirts, jumpers, polo, workwear, caps, bags, other
- Decoration Methods - screen print, embroidery, heat transfer, DTG, vinyl
- Print Placements - location descriptions
- Quantities (required)
- Turnaround Time - rush, standard, extended, flexible
- Budget Range - various price brackets
- Design Status - artwork ready, need design, have idea, need consultation

**Additional:**
- File Uploads - artwork, designs, reference images
- Additional Notes - free text for special requirements

## Data Flow

1. **Form Submission** → Customer fills out form and submits
2. **Customer Creation** → System creates new customer or finds existing by email
3. **Order Creation** → Draft order created with status 'quote_requested'
4. **File Storage** → Uploaded files stored in Supabase Storage
5. **Email Notifications** → Store owner and customer receive emails
6. **Enquiry Notes** → All form data stored as JSON in order.enquiry_notes

## Store Configuration

The form automatically adapts to store branding using the `stores.branding` JSONB field:

```json
{
  "primaryColor": "#3b82f6",
  "accentColor": "#1d4ed8"
}
```

Email notifications use `stores.quote_settings` for configuration:

```json
{
  "notification_email": "quotes@yourstore.com"
}
```

## File Uploads

Files are uploaded to Supabase Storage in the `uploads` bucket under:
```
quote-uploads/{store_id}/{timestamp}-{random}.{extension}
```

Supported file types:
- Images: PNG, JPG, JPEG, GIF, SVG
- Documents: PDF
- Design files: AI, EPS, PSD

## Email Notifications

Two emails are sent on form submission:

1. **Store Owner Notification** - Complete quote request details
2. **Customer Confirmation** - Acknowledgment with order number

Configure email service in the Supabase function (SendGrid, AWS SES, etc.).

## Customization

The embed supports extensive customization:

- Store branding colors
- Custom CSS styling
- Field visibility/requirements
- Validation rules
- Email templates
- File upload restrictions

## Security

- Uses Supabase Row Level Security (RLS)
- File uploads validated by type and size
- Form data sanitized before storage
- CORS headers properly configured
- Anon key usage for public access

## Browser Support

- Chrome/Chromium 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - see LICENSE file for details.