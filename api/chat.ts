import OpenAI from 'openai';

// Serverless handler for Vercel
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const SYSTEM_PROMPT =
    'You are a home-buying assistant for consumers. Only answer from the provided context. If the context is insufficient or the question is outside home-buying education, say you don’t know and suggest contacting the agent. Do not reveal internal systems, databases, architecture, or CRM processes. Cite the included source titles when relevant.';

  const buyerOnlyTitles = [
    'home buying process overview',
    'financial preparation',
    'finding your home',
    'making an offer',
    'under contract process',
    'closing process',
    'understanding real estate timelines',
    'escrow timeline',
    'closing timeline',
    'pre-escrow timeline',
    'make home buying transparent',
  ];

  const technicalKeywords = [
    'database', 'schema', 'supabase', 'fub', 'api', 'auth', 'backend', 'server',
    'code', 'git', 'migration', 'frontend', 'component', 'hook', 'javascript',
    'typescript', 'npm', 'vite', 'express', 'openai', 'architecture', 'rls',
    'trigger', 'function', 'table', 'column', 'index', 'query', 'console',
    'debug', 'log', 'error', 'internal', 'system', 'crm', 'pipeline', 'webhook'
  ];

  try {
    const body = req.body ?? {};
    const query: string | undefined = body.query;
    const context: Array<{ title: string; snippet: string }>
      = Array.isArray(body.context) ? body.context : [];

    if (!query) {
      res.status(400).json({ error: 'Query is required' });
      return;
    }

    const lower = String(query).toLowerCase();
    if (technicalKeywords.some(k => lower.includes(k))) {
      res.status(200).json({
        answer: 'I can only answer questions about the home buying process. Please ask about specific aspects of buying a home.',
        sources: [],
      });
      return;
    }

    const filtered = context
      .filter((c) => buyerOnlyTitles.some(t => (c?.title || '').toLowerCase().includes(t)))
      .map((c) => ({ title: c.title, snippet: c.snippet }));

    if (filtered.length === 0) {
      res.status(200).json({
        answer: 'I can help with the home buying process (finances, finding homes, offers, escrow, closing). Please ask a buyer-focused question.',
        sources: [],
      });
      return;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Question: ${query}\n\nContext:\n` +
            filtered.map(c => `Title: ${c.title}\nSnippet: ${c.snippet}`).join('\n\n'),
        },
      ],
    });

    const answer = completion.choices?.[0]?.message?.content ?? '';
    const sources = filtered.map(c => c.title);
    res.status(200).json({ answer, sources });
  } catch (err: any) {
    res.status(200).json({
      answer: 'I encountered an issue generating an answer. Please try again with a buyer-focused question.',
      sources: [],
    });
  }
}

// Optional: set a higher timeout for AI calls when on Vercel
export const config = {
  maxDuration: 60,
};


