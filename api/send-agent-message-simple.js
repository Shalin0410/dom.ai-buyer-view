import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  try {
    // Basic CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    // Check environment variables
    if (!process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'Missing GMAIL_APP_PASSWORD environment variable'
      });
    }

    // Parse request body
    const { to, buyerName, buyerEmail, property, message } = req.body || {};

    if (!to || !buyerName || !buyerEmail || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, buyerName, buyerEmail, message'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'beta.dom.ai@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Simple HTML email template
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Message from Buyer</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <h2>Buyer Information</h2>
          <p><strong>Name:</strong> ${buyerName}</p>
          <p><strong>Email:</strong> ${buyerEmail}</p>

          ${property ? `
            <h2>Property Details</h2>
            <p><strong>Address:</strong> ${property.address || 'N/A'}</p>
            <p><strong>City:</strong> ${property.city || 'N/A'}, ${property.state || 'N/A'}</p>
            <p><strong>Price:</strong> $${(property.price || property.listing_price || 0).toLocaleString()}</p>
            ${property.bedrooms ? `<p><strong>Bedrooms:</strong> ${property.bedrooms}</p>` : ''}
            ${property.bathrooms ? `<p><strong>Bathrooms:</strong> ${property.bathrooms}</p>` : ''}
          ` : ''}

          <h2>Message</h2>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap;">${message}</p>
          </div>
        </div>
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #6b7280;">Reply directly to this email to respond to the buyer.</p>
        </div>
      </div>
    `;

    // Email options
    const mailOptions = {
      from: {
        name: 'Buyer Journey Platform',
        address: 'beta.dom.ai@gmail.com'
      },
      to: to,
      cc: buyerEmail,
      subject: property
        ? `Message from ${buyerName} - ${property.address}`
        : `Message from ${buyerName}`,
      html: htmlContent,
      text: `Message from ${buyerName} (${buyerEmail})\n\n${message}`,
      replyTo: buyerEmail
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
}