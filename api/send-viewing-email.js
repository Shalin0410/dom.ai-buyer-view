const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP (correct Nodemailer API)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'beta.dom.ai@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD // App-specific password for Gmail
    }
  });
};

// Generate email HTML template
const generateEmailHTML = (data) => {
  const { buyerName, buyerEmail, property, selectedDatesAndTimes, additionalInfo } = data;
  
  const timeSlotsHTML = selectedDatesAndTimes.map(item => `
    <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
      <strong style="color: #2563eb;">${item.date}</strong>
      ${item.times.length > 0 ? `
        <div style="margin-top: 5px;">
          ${item.times.map(time => `
            <span style="display: inline-block; background-color: #3b82f6; color: white; padding: 2px 8px; margin: 2px; border-radius: 3px; font-size: 12px;">
              ${time}
            </span>
          `).join('')}
        </div>
      ` : `
        <div style="margin-top: 5px; color: #6b7280; font-style: italic; font-size: 14px;">
          No specific times selected
        </div>
      `}
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Property Viewing Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .footer { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
        .property-details { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .buyer-info { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .dates-section { margin: 20px 0; }
        .additional-info { background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; font-size: 24px;">🏠 Property Viewing Request</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">New viewing request from buyer journey platform</p>
        </div>
        
        <div class="content">
          <h2 style="color: #1f2937; margin-top: 0;">Viewing Request Details</h2>
          
          <div class="buyer-info">
            <h3 style="margin: 0 0 10px 0; color: #059669;">👤 Buyer Information</h3>
            <p><strong>Name:</strong> ${buyerName}</p>
            <p><strong>Email:</strong> <a href="mailto:${buyerEmail}">${buyerEmail}</a></p>
          </div>
          
          <div class="property-details">
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">🏡 Property Details</h3>
            <p><strong>Address:</strong> ${property.address}</p>
            <p><strong>Location:</strong> ${property.city}, ${property.state} ${property.zipCode}</p>
            <p><strong>Price:</strong> $${property.price?.toLocaleString() || 'N/A'}</p>
            ${property.mlsNumber ? `<p><strong>MLS Number:</strong> ${property.mlsNumber}</p>` : ''}
          </div>
          
          <div class="dates-section">
            <h3 style="color: #1f2937;">📅 Preferred Viewing Dates & Times</h3>
            ${timeSlotsHTML}
          </div>
          
          ${additionalInfo ? `
            <div class="additional-info">
              <h3 style="margin: 0 0 10px 0; color: #3b82f6;">💬 Additional Information</h3>
              <p style="margin: 0; white-space: pre-wrap;">${additionalInfo}</p>
            </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px; text-align: center;">
            <h3 style="margin: 0 0 10px 0; color: #1f2937;">📞 Next Steps</h3>
            <p style="margin: 0;">Please contact the buyer directly to confirm the viewing appointment.</p>
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
  const { buyerName, buyerEmail, property, selectedDatesAndTimes, additionalInfo } = data;
  
  const timeSlotsText = selectedDatesAndTimes.map(item => {
    const timesText = item.times.length > 0 
      ? `Times: ${item.times.join(', ')}`
      : 'No specific times selected';
    return `${item.date}\n${timesText}`;
  }).join('\n\n');

  return `
PROPERTY VIEWING REQUEST

BUYER INFORMATION:
Name: ${buyerName}
Email: ${buyerEmail}

PROPERTY DETAILS:
Address: ${property.address}
Location: ${property.city}, ${property.state} ${property.zipCode}
Price: $${property.price?.toLocaleString() || 'N/A'}
${property.mlsNumber ? `MLS Number: ${property.mlsNumber}` : ''}

PREFERRED VIEWING DATES & TIMES:
${timeSlotsText}

${additionalInfo ? `ADDITIONAL INFORMATION:\n${additionalInfo}` : ''}

Please contact the buyer directly to confirm the viewing appointment.

---
This email was sent automatically from the buyer journey platform.
Generated at ${new Date().toLocaleString()}
  `.trim();
};

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { to, buyerName, buyerEmail, property, selectedDatesAndTimes, additionalInfo } = req.body;

    // Log incoming request for debugging
    console.log('Email request received:', {
      to,
      buyerName,
      buyerEmail,
      propertyAddress: property?.address,
      datesCount: selectedDatesAndTimes?.length
    });

    // Validate required fields
    if (!to || !buyerName || !buyerEmail || !property || !selectedDatesAndTimes) {
      console.log('Missing required fields:', { to: !!to, buyerName: !!buyerName, buyerEmail: !!buyerEmail, property: !!property, selectedDatesAndTimes: !!selectedDatesAndTimes });
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
    if (!process.env.GMAIL_APP_PASSWORD) {
      console.error('Gmail app password not configured');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    console.log('Gmail app password configured:', !!process.env.GMAIL_APP_PASSWORD);
    console.log('Gmail app password length:', process.env.GMAIL_APP_PASSWORD?.length);
    console.log('Gmail app password (masked):', process.env.GMAIL_APP_PASSWORD?.substring(0, 5) + '...' + process.env.GMAIL_APP_PASSWORD?.slice(-3));
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
      selectedDatesAndTimes,
      additionalInfo
    };

    // Email options
    const mailOptions = {
      from: {
        name: 'Buyer Journey AI Platform',
        address: 'beta.dom.ai@gmail.com'
      },
      to: to,
      cc: buyerEmail, // CC the buyer for confirmation
      subject: `🏠 Viewing Request - ${property.address}`,
      html: generateEmailHTML(emailData),
      text: generateEmailText(emailData),
      replyTo: buyerEmail // Allow agent to reply directly to buyer
    };

    // Send email
    console.log('Sending email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      cc: mailOptions.cc,
      subject: mailOptions.subject
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Email sent successfully:', {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Viewing request email sent successfully to agent and buyer'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    // Return appropriate error message
    if (error.code === 'EAUTH') {
      return res.status(500).json({ 
        error: 'Email authentication failed',
        details: 'Invalid Gmail credentials'
      });
    } else if (error.code === 'ENOTFOUND') {
      return res.status(500).json({ 
        error: 'Network error',
        details: 'Unable to connect to email service'
      });
    } else {
      return res.status(500).json({ 
        error: 'Failed to send email',
        details: error.message
      });
    }
  }
}