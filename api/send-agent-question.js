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
    const { to, buyerName, buyerEmail, subject, message, originalQuestion, agentName } = req.body || {};

    if (!to || !buyerName || !buyerEmail || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, buyerName, buyerEmail, message'
      });
    }

    // Create transporter
    const transporter = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'beta.dom.ai@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Enhanced HTML email template for agent questions
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">Question from Buyer via Dom AI</h1>
        </div>
        <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
          <h2>Buyer Information</h2>
          <p><strong>Name:</strong> ${buyerName}</p>
          <p><strong>Email:</strong> ${buyerEmail}</p>

          ${originalQuestion ? `
            <h2>Original Question from Chat</h2>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; border-left: 4px solid #2563eb;">
              <p style="white-space: pre-wrap; margin: 0;">${originalQuestion}</p>
            </div>
          ` : ''}

          <h2>AI-Enhanced Message for Agent</h2>
          <div style="background-color: #f1f5f9; padding: 15px; border-radius: 5px;">
            <p style="white-space: pre-wrap; margin: 0;">${message}</p>
          </div>

          <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border-radius: 5px; border: 1px solid #bfdbfe;">
            <p style="margin: 0; color: #1e40af; font-size: 14px;">
              📧 This message was automatically generated and sent through Dom AI when the buyer requested to contact their agent during a chat conversation.
            </p>
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
        name: 'Dom AI - Buyer Journey Platform',
        address: 'beta.dom.ai@gmail.com'
      },
      to: to,
      cc: buyerEmail,
      subject: subject || `Question from ${buyerName} via Dom AI`,
      html: htmlContent,
      text: `Question from ${buyerName} (${buyerEmail}) via Dom AI\n\n${originalQuestion ? `Original Question: ${originalQuestion}\n\n` : ''}AI-Enhanced Message:\n${message}`,
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