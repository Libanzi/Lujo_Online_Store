import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { FunctionLogger, checkAndRecordEmailLimit } from "../_shared/function-logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const EmailRequestSchema = z.object({
  orderId: z.string().uuid({ message: "orderId must be a valid UUID" }),
  type: z.enum(['confirmation', 'status_update', 'shipped'], {
    errorMap: () => ({ message: "type must be 'confirmation', 'status_update', or 'shipped'" })
  }),
});

serve(async (req) => {
  const logger = new FunctionLogger('send-order-email');
  let user: any = null;
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user for logging
    const { data: { user: authUser } } = await supabaseClient.auth.getUser();
    user = authUser;

    // Validate input
    const body = await req.json();
    const validationResult = EmailRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.warn("Invalid email request input:", validationResult.error.errors);
      await logger.logError('Validation failed', {
        user_id: user?.id,
        request_method: req.method,
        response_status: 400,
        metadata: { validation_errors: validationResult.error.errors }
      });
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format",
          details: validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId, type } = validationResult.data;
    console.log(`Sending ${type} email for order ${orderId}`);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        profiles!inner(*),
        order_items (
          *,
          product:products (
            name,
            image_url,
            price
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;
    if (!order) throw new Error('Order not found');

    const email = order.profiles.email;
    const customerName = order.profiles.full_name || 'Customer';

    // Check email rate limit
    const rateLimitCheck = await checkAndRecordEmailLimit(
      user?.id,
      `order_${type}`,
      email
    );

    if (!rateLimitCheck.allowed) {
      console.warn(`Email rate limit exceeded for user ${user?.id}`);
      await logger.logError(rateLimitCheck.reason || 'Rate limit exceeded', {
        user_id: user?.id,
        request_method: req.method,
        response_status: 429,
        metadata: { order_id: orderId, email_type: type, recipient: email }
      });
      return new Response(
        JSON.stringify({ error: rateLimitCheck.reason }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let subject = '';
    let htmlContent = '';

    switch (type) {
      case 'confirmation':
        subject = `Order Confirmation - ${order.order_number}`;
        htmlContent = generateConfirmationEmail(order, customerName);
        break;
      case 'status_update':
        subject = `Order Status Update - ${order.order_number}`;
        htmlContent = generateStatusUpdateEmail(order, customerName);
        break;
      case 'shipped':
        subject = `Your Order Has Been Shipped - ${order.order_number}`;
        htmlContent = generateShippedEmail(order, customerName);
        break;
    }

    const emailResponse = await resend.emails.send({
      from: 'Store <onboarding@resend.dev>',
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log('Email sent successfully:', emailResponse);

    await logger.logSuccess({
      user_id: user?.id,
      request_method: req.method,
      response_status: 200,
      metadata: { order_id: orderId, email_type: type, recipient: email }
    });

    return new Response(
      JSON.stringify({ success: true, response: emailResponse }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error sending email:', error);
    
    await logger.logError(error, {
      user_id: user?.id,
      request_method: req.method,
      response_status: 500,
      metadata: { error_stack: error.stack }
    });
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateConfirmationEmail(order: any, customerName: string): string {
  const itemsHtml = order.order_items
    .map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">
          ${item.product.name}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
          R${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>
    `)
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Order Confirmation</h1>
      
      <p>Hi ${customerName},</p>
      
      <p>Thank you for your order! We've received your order and will process it shortly.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <strong>Order Number:</strong> ${order.order_number}<br>
        <strong>Order Date:</strong> ${new Date(order.created_at).toLocaleDateString()}<br>
        <strong>Status:</strong> ${order.status}
      </div>
      
      <h2 style="color: #2c3e50; margin-top: 30px;">Order Items</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="text-align: right; margin-top: 20px; font-size: 18px;">
        <strong>Total: R${order.total_amount.toFixed(2)}</strong>
      </div>
      
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <strong>Shipping Address:</strong><br>
        ${order.shipping_address}
      </div>
      
      <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact us.</p>
      
      <p>Best regards,<br>The Store Team</p>
      
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        This is an automated email. Please do not reply directly to this message.
      </div>
    </body>
    </html>
  `;
}

function generateStatusUpdateEmail(order: any, customerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Status Update</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Order Status Update</h1>
      
      <p>Hi ${customerName},</p>
      
      <p>Your order status has been updated.</p>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <strong>Order Number:</strong> ${order.order_number}<br>
        <strong>New Status:</strong> <span style="color: #3498db; font-weight: bold;">${order.status}</span>
      </div>
      
      ${order.notes ? `<div style="background: #e8f4f8; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0;">
        <strong>Note:</strong><br>
        ${order.notes}
      </div>` : ''}
      
      <p>Thank you for your patience!</p>
      
      <p>Best regards,<br>The Store Team</p>
    </body>
    </html>
  `;
}

function generateShippedEmail(order: any, customerName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Shipped</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2c3e50; border-bottom: 2px solid #27ae60; padding-bottom: 10px;">🎉 Your Order Has Been Shipped!</h1>
      
      <p>Hi ${customerName},</p>
      
      <p>Great news! Your order has been shipped and is on its way to you.</p>
      
      <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #27ae60;">
        <strong>Order Number:</strong> ${order.order_number}<br>
        ${order.tracking_number ? `<strong>Tracking Number:</strong> ${order.tracking_number}<br>` : ''}
        <strong>Status:</strong> ${order.status}
      </div>
      
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
        <strong>Shipping To:</strong><br>
        ${order.shipping_address}
      </div>
      
      <p>You should receive your order within 3-5 business days.</p>
      
      <p>Thank you for shopping with us!</p>
      
      <p>Best regards,<br>The Store Team</p>
    </body>
    </html>
  `;
}
