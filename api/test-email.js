module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('Test endpoint called');

    // Test basic functionality
    const result = {
      success: true,
      message: 'Test endpoint working',
      hasNodemailer: false,
      hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
      method: req.method,
      timestamp: new Date().toISOString()
    };

    // Test if we can require nodemailer
    try {
      const nodemailer = require('nodemailer');
      result.hasNodemailer = true;
      result.nodemailerVersion = nodemailer.VERSION || 'unknown';
      console.log('Nodemailer loaded successfully');
    } catch (nodemailerError) {
      console.error('Nodemailer error:', nodemailerError);
      result.nodemailerError = nodemailerError.message;
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
};