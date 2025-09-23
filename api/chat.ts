import OpenAI from 'openai';

// Serverless handler for Vercel
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const SYSTEM_PROMPT =
    'You are Dom AI, a knowledgeable home-buying assistant for consumers. You help with questions about the home buying process, real estate markets, financing, neighborhoods, and general real estate education. You can search the web for current market data, local information, and recent trends. Always provide helpful, accurate information while maintaining a friendly tone. Use the knowledge base context when provided, but don\'t limit yourself to only that information. For complex legal or specific transaction questions, suggest contacting their real estate agent. Do not reveal internal systems, databases, or technical architecture.';

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

    // Use all available context instead of filtering by specific titles
    const filtered = context.map((c) => ({ title: c.title, snippet: c.snippet }));

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build the user content with knowledge base context if available
    let userContent = `Question: ${query}`;

    if (filtered.length > 0) {
      userContent += `\n\nContext from knowledge base:\n` +
        filtered.map(c => `Title: ${c.title}\nSnippet: ${c.snippet}`).join('\n\n');
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      tools: [{ type: 'web_search' }],
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: userContent,
        },
      ],
    });

    const message = completion.choices?.[0]?.message;
    const answer = message?.content ?? '';

    // Extract citations from web search results
    const citations: Array<{
      title: string;
      url: string;
      snippet?: string;
    }> = [];

    // Check if web search was used and extract citations
    if (message?.tool_calls) {
      for (const toolCall of message.tool_calls) {
        if (toolCall.type === 'web_search') {
          // Extract search results from the tool call response
          const searchResults = (toolCall as any).web_search?.results || [];
          for (const result of searchResults) {
            if (result.url && result.title) {
              citations.push({
                title: result.title,
                url: result.url,
                snippet: result.snippet || result.content
              });
            }
          }
        }
      }
    }

    res.status(200).json({
      answer,
      sources: citations.length > 0 ? citations : undefined
    });
  } catch (err: any) {
    console.error('Chat API error:', err);

    // Provide helpful fallback responses based on the query
    const queryLower = (body.query || '').toLowerCase();
    let fallbackAnswer = '';

    if (queryLower.includes('san jose') || queryLower.includes('fremont') || queryLower.includes('area') || queryLower.includes('neighborhood')) {
      fallbackAnswer = 'I\'d be happy to help you compare areas for home buying! To provide the most accurate and current information about San Jose vs Fremont, including market trends, school districts, commute factors, and neighborhood characteristics, I recommend speaking with your real estate agent who has access to the latest local market data and can provide personalized insights based on your specific needs and budget.';
    } else if (queryLower.includes('home buying') || queryLower.includes('process') || queryLower.includes('steps')) {
      fallbackAnswer = 'The home buying process typically involves several key steps: 1) Getting pre-approved for a mortgage, 2) Finding and touring homes, 3) Making an offer, 4) Going under contract with inspections and appraisal, and 5) Closing. Each step has important considerations and timelines. For detailed guidance specific to your situation and local market, I recommend discussing with your real estate agent.';
    } else {
      fallbackAnswer = 'I encountered an issue generating a detailed answer. For personalized assistance with your home buying questions, please contact your real estate agent who can provide expert guidance tailored to your specific situation.';
    }

    res.status(200).json({
      answer: fallbackAnswer,
    });
  }
}

// Optional: set a higher timeout for AI calls when on Vercel
export const config = {
  maxDuration: 60,
};


