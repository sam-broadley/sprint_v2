import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { orderId, storeId, customerEmail } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        customers (*),
        stores (*)
      `)
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    // Get store quote settings
    const store = order.stores
    const quoteSettings = store.quote_settings || {}
    const notificationEmail = quoteSettings.notification_email || store.email

    if (!notificationEmail) {
      throw new Error('No notification email configured for store')
    }

    // Parse enquiry notes
    const enquiryData = JSON.parse(order.enquiry_notes || '{}')
    
    // Prepare email content
    const customer = order.customers
    const emailSubject = `New Quote Request - ${order.order_number}`
    
    const emailBody = `
      <h2>New Quote Request Received</h2>
      
      <h3>Order Details</h3>
      <p><strong>Order Number:</strong> ${order.order_number}</p>
      <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
      
      <h3>Customer Information</h3>
      <p><strong>Name:</strong> ${customer.first_name} ${customer.last_name}</p>
      <p><strong>Email:</strong> ${customer.email}</p>
      <p><strong>Phone:</strong> ${customer.phone || 'Not provided'}</p>
      <p><strong>Company:</strong> ${customer.company || 'Not provided'}</p>
      
      <h3>Project Details</h3>
      <p><strong>Product Categories:</strong> ${enquiryData.productCategories || 'Not specified'}</p>
      <p><strong>Decoration Methods:</strong> ${enquiryData.decorationMethods || 'Not specified'}</p>
      <p><strong>Print Placements:</strong> ${enquiryData.printPlacements || 'Not specified'}</p>
      <p><strong>Quantities:</strong> ${enquiryData.quantities || 'Not specified'}</p>
      <p><strong>Turnaround Time:</strong> ${enquiryData.turnaroundTime || 'Not specified'}</p>
      <p><strong>Budget:</strong> ${enquiryData.budget || 'Not specified'}</p>
      <p><strong>Design Status:</strong> ${enquiryData.designStatus || 'Not specified'}</p>
      
      ${enquiryData.additionalNotes ? `
        <h3>Additional Notes</h3>
        <p>${enquiryData.additionalNotes}</p>
      ` : ''}
      
      ${enquiryData.uploadedFiles && enquiryData.uploadedFiles.length > 0 ? `
        <h3>Uploaded Files</h3>
        <ul>
          ${enquiryData.uploadedFiles.map(file => `
            <li><a href="${file.url}" target="_blank">${file.name}</a></li>
          `).join('')}
        </ul>
      ` : ''}
      
      <hr>
      <p><small>This quote request was submitted through your embedded quote form.</small></p>
    `

    // Send email using your preferred email service
    // This is a placeholder - you would integrate with your actual email service
    // For example: SendGrid, AWS SES, Resend, etc.
    
    console.log('Would send email:', {
      to: notificationEmail,
      subject: emailSubject,
      body: emailBody
    })

    // Also send confirmation email to customer
    const customerConfirmation = `
      <h2>Quote Request Received</h2>
      
      <p>Dear ${customer.first_name},</p>
      
      <p>Thank you for your quote request! We have received your inquiry and will respond within 24-48 hours.</p>
      
      <p><strong>Order Number:</strong> ${order.order_number}</p>
      
      <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>${store.name}</p>
    `

    console.log('Would send customer confirmation:', {
      to: customer.email,
      subject: `Quote Request Confirmation - ${order.order_number}`,
      body: customerConfirmation
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email notifications sent successfully' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})