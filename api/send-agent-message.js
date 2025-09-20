import nodemailer from 'nodemailer';

// Create transporter with Gmail SMTP (reusing existing configuration)
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'beta.dom.ai@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD // App-specific password for Gmail
    }
  });
};

// Generate email HTML template for agent messages
const generateEmailHTML = (data) => {
  const { buyerName, buyerEmail, property, message } = data;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Message from Buyer</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .property-details { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .buyer-info { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .message-section { background-color: #f1f5f9; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">💬 Message from Buyer</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">New message from buyer journey platform</p>
        </div>

        <div class="content">
          <h2 style="color: #1f2937; margin-top: 0;">Buyer Message</h2>

          <div class="buyer-info">
            <h3 style="margin: 0 0 10px 0; color: #059669;">👤 From Buyer</h3>
            <p><strong>Name:</strong> ${buyerName}</p>
            <p><strong>Email:</strong> <a href="mailto:${buyerEmail}">${buyerEmail}</a></p>
          </div>

${property ? `
          <div class="property-details">
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">🏡 Property Details</h3>
            <p><strong>Address:</strong> ${property.address || 'N/A'}</p>
            <p><strong>Location:</strong> ${property.city || 'N/A'}, ${property.state || 'N/A'} ${property.zipCode || property.zip_code || ''}</p>
            <p><strong>Price:</strong> $${(property.price || property.listing_price)?.toLocaleString() || 'N/A'}</p>
            ${property.bedrooms ? `<p><strong>Bedrooms:</strong> ${property.bedrooms}</p>` : ''}
            ${property.bathrooms ? `<p><strong>Bathrooms:</strong> ${property.bathrooms}</p>` : ''}
            ${property.square_feet ? `<p><strong>Square Feet:</strong> ${property.square_feet.toLocaleString()}</p>` : ''}
            ${property.year_built ? `<p><strong>Year Built:</strong> ${property.year_built}</p>` : ''}
            ${property.property_type ? `<p><strong>Property Type:</strong> ${property.property_type.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</p>` : ''}
            ${property.mls_number || property.mlsNumber ? `<p><strong>MLS Number:</strong> ${property.mls_number || property.mlsNumber}</p>` : ''}
            ${property.lot_size ? `<p><strong>Lot Size:</strong> ${property.lot_size} acres</p>` : ''}
          </div>
` : ''}

          <div class="message-section">
            <h3 style="margin: 0 0 15px 0; color: #3b82f6;">📝 Message</h3>
            <div style="background-color: #ffffff; padding: 15px; border-radius: 5px; border: 1px solid #e5e7eb;">
              <p style="margin: 0; white-space: pre-wrap; font-size: 16px; line-height: 1.5;">${message}</p>
            </div>
          </div>

          <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">📞 Next Steps</h3>
            <p style="margin: 0;">Please reply directly to this email to respond to the buyer.</p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            This email was sent automatically from the buyer journey platform.
          </p>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">
            Generated at ${new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Generate plain text email for fallback
const generateEmailText = (data) => {
  const { buyerName, buyerEmail, property, message } = data;

  return `
MESSAGE FROM BUYER

FROM BUYER:
Name: ${buyerName}
Email: ${buyerEmail}

PROPERTY DETAILS:
Address: ${property?.address || 'N/A'}
Location: ${property?.city || 'N/A'}, ${property?.state || 'N/A'} ${property?.zipCode || property?.zip_code || ''}
Price: $${(property?.price || property?.listing_price)?.toLocaleString() || 'N/A'}
${property?.bedrooms ? `Bedrooms: ${property.bedrooms}` : ''}
${property?.bathrooms ? `Bathrooms: ${property.bathrooms}` : ''}
${property?.square_feet ? `Square Feet: ${property.square_feet.toLocaleString()}` : ''}
${property?.year_built ? `Year Built: ${property.year_built}` : ''}
${property?.property_type ? `Property Type: ${property.property_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : ''}
${property?.mls_number || property?.mlsNumber ? `MLS Number: ${property.mls_number || property.mlsNumber}` : ''}
${property?.lot_size ? `Lot Size: ${property.lot_size} acres` : ''}

MESSAGE:
${message}

Please reply directly to this email to respond to the buyer.

---
This email was sent automatically from the buyer journey platform.
Generated at ${new Date().toLocaleString()}
  `.trim();
};

export default async function handler(req, res) {
  // Set CORS headers for development
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle OPTIONS request for CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, buyerName, buyerEmail, property, message, subject } = req.body;

    // Log incoming request for debugging
    console.log('🚀 SERVERLESS FUNCTION - Agent message email request received:', {
      to,
      buyerName,
      buyerEmail,
      hasProperty: !!property,
      hasSubject: !!subject,
      propertyAddress: property?.address,
      messageLength: message?.length,
      source: property ? 'PropertyDetailPage' : subject ? 'AgentMessageModal' : 'Unknown',
      endpoint: 'VERCEL_SERVERLESS_FUNCTION'
    });

    // Validate required fields
    if (!to || !buyerName || !buyerEmail || !message) {
      console.log('Missing required fields:', { to: !!to, buyerName: !!buyerName, buyerEmail: !!buyerEmail, message: !!message });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid agent email address' });
    }
    if (!emailRegex.test(buyerEmail)) {
      return res.status(400).json({ error: 'Invalid buyer email address' });
    }

    // Check if Gmail credentials are configured
    console.log('Environment check - GMAIL_APP_PASSWORD exists:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('Environment check - Available env vars:', Object.keys(process.env).filter(key => key.includes('GMAIL')));

    if (!process.env.GMAIL_APP_PASSWORD) {
      console.error('Gmail app password not configured');
      return res.status(500).json({
        success: false,
        error: 'Email service not configured',
        details: 'GMAIL_APP_PASSWORD environment variable is missing'
      });
    }

    console.log('Creating email transporter...');

    // Create transporter
    const transporter = createTransporter();

    // Test connection
    try {
      await transporter.verify();
      console.log('SMTP connection verified successfully');
    } catch (verifyError) {
      console.error('SMTP connection verification failed:', verifyError);
      return res.status(500).json({
        error: 'Email service connection failed',
        details: verifyError.message
      });
    }

    // Prepare email data
    const emailData = {
      buyerName,
      buyerEmail,
      property,
      message
    };

    // Email options
    const mailOptions = {
      from: {
        name: 'Buyer Journey AI Platform',
        address: 'beta.dom.ai@gmail.com'
      },
      to: to,
      cc: buyerEmail, // CC the buyer for confirmation
      subject: subject
        ? `💬 Message from ${buyerName}: ${subject}`
        : property
        ? `💬 Message from ${buyerName} - ${property.address}`
        : `💬 Message from ${buyerName}`,
      html: generateEmailHTML(emailData),
      text: generateEmailText(emailData),
      replyTo: buyerEmail // Allow agent to reply directly to buyer
    };

    // Send email
    console.log('Sending agent message email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Agent message email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Message sent successfully to agent'
    });

  } catch (error) {
    console.error('Error sending agent message email:', error);
    console.error('Error stack:', error.stack);

    // Ensure we always return JSON response
    try {
      // Return appropriate error message
      if (error.code === 'EAUTH') {
        return res.status(500).json({
          success: false,
          error: 'Email authentication failed',
          details: 'Invalid Gmail credentials'
        });
      } else if (error.code === 'ENOTFOUND') {
        return res.status(500).json({
          success: false,
          error: 'Network error',
          details: 'Unable to connect to email service'
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to send email',
          details: error.message || 'Unknown error occurred'
        });
      }
    } catch (responseError) {
      console.error('Error sending error response:', responseError);
      // Fallback response
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: 'Unable to process request'
      });
    }
  }
}