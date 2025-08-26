// src/services/chatbot/openai.ts
import { retrieveContext } from './qa';
import { getAllDocs } from '@/knowledge/docs';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
  sources: Array<{ title: string; url?: string; sourceType?: string }>;
  tokensUsed: number;
}

export interface ConversationContext {
  messages: ChatMessage[];
  knowledgeContext: string;
}

// Initialize OpenAI client (you'll need to add OPENAI_API_KEY to your environment)
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn('OpenAI API key not found. Please add VITE_OPENAI_API_KEY to your environment variables.');
}

// System prompt that defines the chatbot's role and behavior
const SYSTEM_PROMPT = `You are Dom AI, a knowledgeable and friendly home buying assistant. Your role is to help users understand the home buying process and answer their questions about real estate.

Key guidelines:
1. Always be helpful, patient, and professional
2. Use the provided knowledge base as a foundation to verify and enhance your responses
3. When providing information, prioritize citing sources that users can access (online sources with URLs)
4. If you don't have specific information in the knowledge base, acknowledge this and suggest they ask their real estate agent
5. Keep responses concise but informative
6. Use a conversational, approachable tone
7. When referencing information, mention accessible sources when appropriate
8. If a user asks about their specific situation, remind them that you provide general guidance and they should consult with their real estate agent for personalized advice
9. When mentioning external resources or websites, use markdown link format: [link text](URL)
10. Use **bold** formatting for important terms and section headers
11. Use numbered lists (1. 2. 3.) and bullet points (- or *) for better readability

Focus areas:
- Home buying process and timeline
- Financial preparation (mortgages, pre-approval, down payments)
- Property search and evaluation
- Making offers and negotiations
- Escrow and closing process
- Working with real estate professionals
- Common pitfalls and how to avoid them

Remember: You're here to educate and guide, not to replace professional real estate advice. Use your foundation knowledge to verify information, but only cite sources that users can actually access.`;

// Create the conversation context with knowledge base integration
export async function createConversationContext(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ConversationContext> {
  try {
    // Retrieve relevant context from knowledge base
    const contextResults = await retrieveContext(userMessage, { maxDocs: 3 });
    
    // Build knowledge context string
    const knowledgeContext = contextResults.length > 0
      ? contextResults.map(result => 
          `Source: ${result.title}${result.url ? ` (${result.url})` : ''}\n${result.snippet}`
        ).join('\n\n')
      : '';

    // Build conversation messages
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];

    // Add knowledge context if available
    if (knowledgeContext) {
      messages.push({
        role: 'system',
        content: `Here is relevant information from the knowledge base:\n\n${knowledgeContext}`
      });
    }

    // Add conversation history (limit to last 10 messages to manage token usage)
    const recentHistory = conversationHistory.slice(-10);
    messages.push(...recentHistory);

    // Add current user message
    messages.push({ role: 'user', content: userMessage });

    return {
      messages,
      knowledgeContext: knowledgeContext
    };
  } catch (error) {
    console.error('Error creating conversation context:', error);
    throw error;
  }
}

// Send message to OpenAI and get response
export async function sendChatMessage(
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  console.log('[Chatbot] Starting message processing...');
  
  if (!OPENAI_API_KEY) {
    console.log('[Chatbot] OpenAI API key not configured, using fallback QA system');
    // Fallback to local QA system if OpenAI is not configured
    const { answerQuestion } = await import('./qa');
    const fallbackResult = await answerQuestion(userMessage);
    
    return {
      message: fallbackResult.answer,
      sources: fallbackResult.sources,
      tokensUsed: 0
    };
  }

  try {
    console.log('[Chatbot] Creating conversation context...');
    const context = await createConversationContext(userMessage, conversationHistory);
    
    console.log('[Chatbot] Sending request to OpenAI...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using GPT-4o-mini for cost efficiency
        messages: context.messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Chatbot] OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    if (!assistantMessage) {
      throw new Error('No response from OpenAI');
    }

    console.log('[Chatbot] OpenAI response received successfully');

    // Extract sources from knowledge context (only accessible ones with URLs)
    const sources = context.knowledgeContext
      ? context.knowledgeContext
          .split('\n\n')
          .filter(block => block.startsWith('Source:'))
          .map(block => {
            const lines = block.split('\n');
            const sourceLine = lines[0].replace('Source: ', '');
            
            // Check if there's a URL in parentheses
            const urlMatch = sourceLine.match(/\((https?:\/\/[^)]+)\)/);
            const url = urlMatch ? urlMatch[1] : undefined;
            const title = urlMatch ? sourceLine.replace(/\(https?:\/\/[^)]+\)/, '').trim() : sourceLine;
            
            return { 
              title, 
              url,
              sourceType: url ? 'online' : 'notion'
            };
          })
          .filter(source => source.url) // Only include sources with URLs (accessible to buyers)
      : [];

    return {
      message: assistantMessage,
      sources,
      tokensUsed
    };

  } catch (error) {
    console.error('[Chatbot] Error calling OpenAI API:', error);
    
    // Fallback to local QA system if OpenAI fails
    console.log('[Chatbot] Falling back to local QA system...');
    const { answerQuestion } = await import('./qa');
    const fallbackResult = await answerQuestion(userMessage);
    
    return {
      message: fallbackResult.answer,
      sources: fallbackResult.sources,
      tokensUsed: 0
    };
  }
}

// Estimate token count for a message (rough approximation)
export function estimateTokens(text: string): number {
  // Rough approximation: 1 token ≈ 4 characters for English text
  return Math.ceil(text.length / 4);
}

// Check if conversation is getting too long (to manage token limits)
export function shouldStartNewConversation(messages: ChatMessage[]): boolean {
  const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content), 0);
  // Start new conversation if we're approaching token limits (GPT-4o-mini has 128k context)
  return totalTokens > 100000; // Conservative limit
}
