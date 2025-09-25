import OpenAI from 'openai';

// Serverless handler for Vercel
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const SYSTEM_PROMPT =
    'You are Dom AI, a knowledgeable home-buying assistant for consumers. You help with questions about the home buying process, real estate markets, financing, neighborhoods, and general real estate education. You can search the web for current market data, local information, and recent trends. Always provide helpful, accurate information while maintaining a friendly tone. Use the knowledge base context when provided, but don\'t limit yourself to only that information. For complex legal or specific transaction questions, suggest contacting their real estate agent. Do not reveal internal systems, databases, or technical architecture.\n\nIMPORTANT: Format your responses with clear structure. Use **bold headings** for main sections (like **Home Prices and Sales:**, **Market Competitiveness:**, **Recommendation:**). Separate different topics with double line breaks to create clear paragraphs. This helps users easily scan and understand your response.';

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

    // Use the Responses API for web search with proper citations
    console.log('[Chat API] Making OpenAI request with:', {
      model: 'gpt-4o-mini',
      tools: [{ type: 'web_search' }],
      inputPreview: userContent.substring(0, 100) + '...'
    });

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      tools: [{ type: 'web_search' }],
      input: `${SYSTEM_PROMPT}\n\n${userContent}`,
    });

    console.log('[Chat API] OpenAI response structure:', {
      outputTypes: response.output.map(item => item.type),
      outputCount: response.output.length
    });

    // Check if web search was triggered
    const webSearchCall = response.output.find((item: any) => item.type === 'web_search_call');
    const webSearchTriggered = !!webSearchCall;

    // Log web search detection for debugging
    console.log('[Chat API] Web search triggered:', webSearchTriggered);
    if (webSearchTriggered) {
      console.log('[Chat API] Web search call:', {
        id: webSearchCall.id,
        status: webSearchCall.status,
        action: webSearchCall.action?.type || 'unknown',
        query: webSearchCall.action?.query || 'no query',
        sourcesCount: webSearchCall.action?.sources?.length || 0
      });
    }

    // Extract the assistant message with annotations
    const messageItem = response.output.find((item: any) => item.type === 'message');
    const textContent = messageItem?.content?.find((content: any) => content.type === 'output_text');

    let answer = textContent?.text ?? '';
    
    // Post-process the answer to ensure proper formatting
    // Add line breaks after bold headings if they don't exist
    answer = answer.replace(/(\*\*[^*]+\*\*:)([^\n])/g, '$1\n$2');
    
    // Ensure double line breaks between major sections
    answer = answer.replace(/(\*\*[^*]+\*\*:)\n([^\n])/g, '$1\n\n$2');
    
    const annotations = textContent?.annotations ?? [];

    // Log annotations for debugging
    console.log('[Chat API] Annotations found:', annotations.length);
    if (annotations.length > 0) {
      console.log('[Chat API] Annotation types:', annotations.map((a: any) => a.type));
    }

    // Extract citations from URL annotations and web search sources
    const citations: Array<{
      title: string;
      url: string;
      snippet?: string;
    }> = [];

    // Process URL citations from annotations
    for (const annotation of annotations) {
      if (annotation.type === 'url_citation' && annotation.url && annotation.title) {
        citations.push({
          title: annotation.title,
          url: annotation.url,
          snippet: annotation.snippet || ''
        });
      }
    }

    // Also check for sources in the web search call output
    if (webSearchCall?.action?.sources) {
      for (const source of webSearchCall.action.sources) {
        if (source.url && source.title && !citations.some(c => c.url === source.url)) {
          citations.push({
            title: source.title,
            url: source.url,
            snippet: source.snippet || ''
          });
        }
      }
    }

    // Log final citation count
    console.log('[Chat API] Total citations extracted:', citations.length);

    // Process citations to create inline badges and source list
    let modifiedAnswer = answer;
    const processedSources: Array<{
      id: string;
      title: string;
      url: string;
      snippet?: string;
    }> = [];

    if (citations.length > 0) {
      // Create unique source IDs and process citations
      citations.forEach((citation, index) => {
        // Create a short source ID from the domain name
        let sourceId;
        try {
          const domain = new URL(citation.url).hostname.replace('www.', '');
          const parts = domain.split('.');
          sourceId = parts.length > 1 ? parts[0] : domain.substring(0, 10);
        } catch {
          sourceId = `source${index + 1}`;
        }

        processedSources.push({
          id: sourceId,
          title: citation.title,
          url: citation.url,
          snippet: citation.snippet
        });
      });

      // Add inline citation markers in the text
      // For now, we'll add them at the end of sentences or paragraphs
      // In a more advanced implementation, we could parse the content more intelligently

      // Add badge-style citations at strategic points in the text
      if (processedSources.length > 0) {
        // More intelligent citation placement - add at the end of key sentences
        processedSources.forEach((source, index) => {
          // Create badge citation format like (source_name) that will be rendered as badges
          const sourceName = source.id;
          const citationMarker = `(${sourceName})`;

          // Find a good place to insert the citation
          // Look for sentences that might benefit from citation
          const sentences = modifiedAnswer.split(/(?<=[.!?])\s+/);

          if (sentences.length > 1) {
            // Add citations to different sentences for better distribution
            let targetSentenceIndex = Math.min(index + 1, sentences.length - 1);
            if (targetSentenceIndex < sentences.length) {
              // Insert citation at the end of the sentence, before the punctuation
              sentences[targetSentenceIndex] = sentences[targetSentenceIndex].replace(/([.!?])$/, ` ${citationMarker}$1`);
            }
          } else {
            // If only one sentence, add at the end
            modifiedAnswer += ` ${citationMarker}`;
          }

          modifiedAnswer = sentences.join(' ');
        });

        // Clean up any extra spaces that might have been introduced
        modifiedAnswer = modifiedAnswer.replace(/\s+/g, ' ').trim();
      }
    }

    res.status(200).json({
      answer: modifiedAnswer,
      sources: processedSources.length > 0 ? processedSources : undefined,
      webSearch: webSearchTriggered ? {
        triggered: true,
        query: webSearchCall?.action?.query || null,
        sourcesCount: webSearchCall?.action?.sources?.length || 0,
        status: webSearchCall?.status || 'unknown'
      } : { triggered: false }
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


