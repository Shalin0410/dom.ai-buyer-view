import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import bodyParser from 'body-parser';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { SYSTEM_PROMPT } from './prompt.js';

// Minimal server that exposes POST /api/chat
// It retrieves buyer-scoped context on the client, but we also accept
// raw query to run an additional server-side guard if needed later.

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

// Basic env checks
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'beta.dom.ai@gmail.com',
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
};

// Email template generation
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

// See server/prompt.js for the centralized system prompt

// Simple in-memory rate limiter (per IP)
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP
const ipHits = new Map(); // ip -> { count, windowStart }

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipHits.set(ip, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  ipHits.set(ip, entry);
  return entry.count > RATE_LIMIT_MAX;
}

app.post('/api/chat', async (req, res) => {
  try {
    // Content-Type check
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const clientIp = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();
    if (isRateLimited(clientIp)) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    const { query, context } = req.body || {};
    if (!query || !Array.isArray(context)) {
      return res.status(400).json({ error: 'Missing query or context' });
    }

    // Schema and scope checks for context entries
    const allowedTitle = (t = '') => {
      const s = String(t).toLowerCase();
      return (
        s.includes('make home buying transparent') ||
        s.includes('home buying') ||
        s.includes('buyer') ||
        s.includes('real estate') ||
        s.includes('mortgage') ||
        s.includes('property') ||
        s.includes('escrow') ||
        s.includes('timeline') ||
        s.includes('closing')
      );
    };

    const sanitizedContext = context
      .filter(
        (c) =>
          c && typeof c.title === 'string' && typeof c.snippet === 'string' && allowedTitle(c.title)
      )
      .slice(0, 5);

    if (sanitizedContext.length === 0) {
      const fallbackAnswer = "I don't have enough buyer-focused context to answer that. Please rephrase your question or ask your agent for details.";
      return res.json({ answer: fallbackAnswer, sources: [] });
    }

    // Guard against technical/internal queries
    const qLower = String(query).toLowerCase();
    const disallowed = ['database', 'schema', 'supabase', 'fub', 'api', 'auth', 'backend', 'server'];
    if (disallowed.some((w) => qLower.includes(w))) {
      const scopeAnswer = "I can only help with home-buying education (financing, search, offers, inspections, escrow, closing). Please ask a consumer-focused question.";
      return res.json({ answer: scopeAnswer, sources: [] });
    }

    // Build context block
    const contextBlock = sanitizedContext
      .slice(0, 5)
      .map((c, i) => `Source ${i + 1} — ${c.title}\n${c.snippet}`)
      .join('\n\n');

    const userPrompt = `Question: ${query}\n\nContext:\n${contextBlock}\n\nInstructions:\n- Use only the context.\n- If not enough, say you don't know and suggest contacting the agent.\n- Do not discuss internal systems or technical implementation.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || '';
    // Echo back the titles used so the client can display Sources
    const sources = sanitizedContext.map((c) => c.title);
    return res.json({ answer, sources });
  } catch (err) {
    console.error('Chat error:', err?.response?.data || err?.message || err);
    return res.status(500).json({ error: 'Chat service error' });
  }
});

// Generate professional email content using AI
app.post('/api/generate-agent-email', async (req, res) => {
  try {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { buyerQuestion, buyerName, buyerEmail, agentName } = req.body;

    console.log('[API] /api/generate-agent-email - Received values:', {
      buyerQuestion,
      buyerName,
      buyerEmail,
      agentName
    });

    if (!buyerQuestion || !buyerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: `You are a professional email assistant helping homebuyers draft emails to their real estate agents. Generate a polite, professional, and concise email based on the buyer's question. The email should:

          1. Be courteous and professional
          2. Address the agent by name if provided
          3. Clearly state the buyer's question or concern
          4. Request guidance or assistance
          5. Include appropriate closing with the buyer's name
          6. Be concise but informative

          Do not include subject lines, email headers, or signatures - just the email body content.`
        },
        {
          role: 'user',
          content: `Please draft a professional email for a homebuyer named "${buyerName}" to send to their real estate agent${agentName ? ` named "${agentName}"` : ''}. ${agentName ? `Start the email with "Dear ${agentName}," or "Hi ${agentName},"` : 'Start the email with a professional greeting.'} The buyer's question/concern is: "${buyerQuestion}". End the email with the buyer's name "${buyerName}".`
        }
      ]
    });

    const emailContent = completion.choices?.[0]?.message?.content?.trim() ||
      `Hi,\n\nI have a question about my home buying journey that I'd appreciate your help with:\n\n${buyerQuestion}\n\nCould you please provide some guidance or schedule a time to discuss this?\n\nThank you for your assistance.\n\nBest regards,\n${buyerName}`;

    return res.json({ emailContent });

  } catch (error) {
    console.error('Error generating email:', error);
    return res.status(500).json({ error: 'Failed to generate email content' });
  }
});

// Send agent question email
app.post('/api/send-agent-question', async (req, res) => {
  try {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { to, buyerName, buyerEmail, subject, message, originalQuestion, agentName } = req.body;

    if (!to || !buyerName || !buyerEmail || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to) || !emailRegex.test(buyerEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    if (!process.env.GMAIL_APP_PASSWORD) {
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const transporter = createEmailTransporter();

    const mailOptions = {
      from: {
        name: 'Buyer Journey AI Platform',
        address: 'beta.dom.ai@gmail.com'
      },
      to: to,
      cc: buyerEmail,
      subject: subject || `Question from ${buyerName}: Home Buying Assistance`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Question from ${buyerName}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
            .footer { background-color: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; }
            .buyer-info { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .question-section { background-color: #eff6ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .message-section { background-color: #f1f5f9; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">💬 Question from Buyer</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Message from buyer journey platform</p>
            </div>

            <div class="content">
              <div class="buyer-info">
                <h3 style="margin: 0 0 10px 0; color: #059669;">👤 Buyer Information</h3>
                <p><strong>Name:</strong> ${buyerName}</p>
                <p><strong>Email:</strong> <a href="mailto:${buyerEmail}">${buyerEmail}</a></p>
              </div>

              ${originalQuestion ? `
                <div class="question-section">
                  <h3 style="margin: 0 0 10px 0; color: #2563eb;">❓ Original Question</h3>
                  <p style="white-space: pre-wrap;">${originalQuestion}</p>
                </div>
              ` : ''}

              <div class="message-section">
                <h3 style="margin: 0 0 10px 0; color: #3b82f6;">💬 Message</h3>
                <p style="margin: 0; white-space: pre-wrap;">${message}</p>
              </div>

              <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">📞 Next Steps</h3>
                <p style="margin: 0;">Please respond directly to the buyer to provide assistance.</p>
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
      `,
      replyTo: buyerEmail
    };

    const info = await transporter.sendMail(mailOptions);

    console.log('Agent question email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: 'Question sent successfully to agent'
    });

  } catch (error) {
    console.error('Error sending agent question email:', error);

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
});

// Email sending endpoint
app.post('/api/send-viewing-email', async (req, res) => {
  try {
    // Content-Type check
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { to, buyerName, buyerEmail, property, selectedDatesAndTimes, additionalInfo } = req.body;

    // Validate required fields
    if (!to || !buyerName || !buyerEmail || !property || !selectedDatesAndTimes) {
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

    // Create transporter
    const transporter = createEmailTransporter();

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
      replyTo: buyerEmail // Allow agent to reply directly to buyer
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email sent successfully:', info.messageId);
    
    return res.status(200).json({ 
      success: true, 
      messageId: info.messageId,
      message: 'Viewing request email sent successfully to agent and buyer'
    });

  } catch (error) {
    console.error('Error sending email:', error?.response || error?.message || error);
    
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
});

// Send agent message email (general messaging)
app.post('/api/send-agent-message', async (req, res) => {
  try {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Content-Type must be application/json' });
    }

    const { to, buyerName, buyerEmail, agentName, subject, message } = req.body;

    // Log incoming request for debugging
    console.log('Agent message email request received:', {
      to,
      buyerName,
      buyerEmail,
      agentName,
      hasSubject: !!subject,
      messageLength: message?.length
    });

    // Validate required fields
    if (!to || !buyerName || !buyerEmail || !message) {
      console.log('Missing required fields:', {
        to: !!to,
        buyerName: !!buyerName,
        buyerEmail: !!buyerEmail,
        message: !!message
      });
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

    console.log('Creating email transporter...');

    // Create transporter
    const transporter = createEmailTransporter();

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

    // Determine subject line
    const emailSubject = subject
      ? `💬 Message from ${buyerName}: ${subject}`
      : `💬 Message from ${buyerName}`;

    // Email options
    const mailOptions = {
      from: {
        name: 'Buyer Journey AI Platform',
        address: 'beta.dom.ai@gmail.com'
      },
      to: to,
      subject: emailSubject,
      html: `
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
            .buyer-info { background-color: #f0fdf4; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .message-content { background-color: #f1f5f9; padding: 20px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; font-size: 24px;">💬 Message from Your Buyer</h1>
              <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">New message from buyer journey platform</p>
            </div>

            <div class="content">
              <h2 style="color: #1f2937; margin-top: 0;">Message Details</h2>

              <div class="buyer-info">
                <h3 style="margin: 0 0 10px 0; color: #059669;">👤 From</h3>
                <p><strong>Name:</strong> ${buyerName}</p>
                <p><strong>Email:</strong> <a href="mailto:${buyerEmail}">${buyerEmail}</a></p>
              </div>

              ${subject ? `
                <div style="margin: 15px 0;">
                  <h3 style="margin: 0 0 10px 0; color: #2563eb;">📝 Subject</h3>
                  <p style="font-weight: 600; color: #1f2937;">${subject}</p>
                </div>
              ` : ''}

              <div class="message-content">
                <h3 style="margin: 0 0 15px 0; color: #3b82f6;">💬 Message</h3>
                <p style="margin: 0; white-space: pre-wrap; line-height: 1.6;">${message}</p>
              </div>

              <div style="margin-top: 30px; padding: 20px; background-color: #f3f4f6; border-radius: 5px; text-align: center;">
                <h3 style="margin: 0 0 10px 0; color: #1f2937;">📞 Reply to Buyer</h3>
                <p style="margin: 0;">You can reply directly to this email to contact ${buyerName}.</p>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                  <strong>Reply-to:</strong> ${buyerEmail}
                </p>
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
      `,
      text: `
MESSAGE FROM YOUR BUYER

FROM:
Name: ${buyerName}
Email: ${buyerEmail}

${subject ? `SUBJECT:\n${subject}\n\n` : ''}MESSAGE:
${message}

---
You can reply directly to this email to contact ${buyerName}.
Reply-to: ${buyerEmail}

This email was sent automatically from the buyer journey platform.
Generated at ${new Date().toLocaleString()}
      `.trim(),
      replyTo: buyerEmail // Allow agent to reply directly to buyer
    };

    // Send email
    console.log('Sending message email with options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      replyTo: mailOptions.replyTo
    });

    const info = await transporter.sendMail(mailOptions);

    console.log('Message email sent successfully:', {
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
    console.error('Error sending message email:', error);

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
        error: 'Failed to send message',
        details: error.message
      });
    }
  }
});

// Optional: Notion webhook endpoint with signature verification
// Supports HMAC-SHA256 signature via NOTION_WEBHOOK_SECRET or simple verification token
app.post('/api/notion/webhook', express.raw({ type: '*/*' }), (req, res) => {
  try {
    const secret = process.env.NOTION_WEBHOOK_SECRET;
    const verificationToken = process.env.NOTION_VERIFICATION_TOKEN;

    const signatureHeader = req.header('X-Notion-Signature') || req.header('x-notion-signature');
    const tokenHeader =
      req.header('X-Notion-Verification-Token') || req.header('x-notion-verification-token');

    let verified = false;
    if (secret && signatureHeader) {
      const hmac = crypto.createHmac('sha256', secret).update(req.body).digest('hex');
      // Signatures may be hex; use constant-time compare
      verified = crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signatureHeader));
    } else if (verificationToken && tokenHeader) {
      verified = tokenHeader === verificationToken;
    }

    if (!verified) {
      return res.status(401).send('invalid signature');
    }

    // TODO: Process the webhook payload as needed
    return res.status(200).send('ok');
  } catch (e) {
    console.error('webhook error', e);
    return res.status(500).send('error');
  }
});

const port = process.env.PORT || 8788;
app.listen(port, () => {
  console.log(`Chat server running on http://localhost:${port}`);
});


