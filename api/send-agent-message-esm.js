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

    console.log('ESM function started');

    // Test if environment variables exist
    if (!process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({
        success: false,
        error: 'Missing GMAIL_APP_PASSWORD environment variable'
      });
    }

    // Test basic request parsing
    const { to, message } = req.body || {};
    if (!to || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, message'
      });
    }

    console.log('Creating transporter...');

    // Try to create transporter
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'beta.dom.ai@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Simple email options
    const mailOptions = {
      from: 'beta.dom.ai@gmail.com',
      to: to,
      subject: 'Test Message from Buyer (ESM)',
      text: message
    };

    console.log('Sending email...');

    // Try to send email
    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Email sent successfully via ESM',
      messageId: info.messageId
    });

  } catch (error) {
    console.error('ESM function error:', error);
    return res.status(500).json({
      success: false,
      error: 'Function error',
      details: error.message,
      stack: error.stack
    });
  }
}