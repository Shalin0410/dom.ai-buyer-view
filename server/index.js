import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import bodyParser from 'body-parser';
import crypto from 'crypto';
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

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Chat server running on http://localhost:${port}`);
});


