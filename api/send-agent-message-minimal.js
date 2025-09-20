// Minimal version to test basic functionality
module.exports = async function handler(req, res) {
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

    // Test if we can require nodemailer
    let nodemailer;
    try {
      nodemailer = require('nodemailer');
    } catch (requireError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to load nodemailer',
        details: requireError.message
      });
    }

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

    // Try to create transporter
    let transporter;
    try {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'beta.dom.ai@gmail.com',
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });
    } catch (transportError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create email transporter',
        details: transportError.message
      });
    }

    // Simple email options
    const mailOptions = {
      from: 'beta.dom.ai@gmail.com',
      to: to,
      subject: 'Test Message from Buyer',
      text: message
    };

    // Try to send email
    try {
      const info = await transporter.sendMail(mailOptions);
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId
      });
    } catch (emailError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to send email',
        details: emailError.message,
        code: emailError.code
      });
    }

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Function error',
      details: error.message
    });
  }
};