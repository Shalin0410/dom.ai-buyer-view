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

export interface QuestionRephraseRequest {
  conversationMessages: ChatMessage[];
  latestUserMessage: string;
}

export interface QuestionRephraseResponse {
  rephrasedQuestion: string;
  reasoning: string;
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
4. If you don't have specific information in the knowledge base, acknowledge this and suggest they contact their real estate agent for personalized assistance
5. Keep responses concise but informative
6. Use a conversational, approachable tone
7. When referencing information, mention accessible sources when appropriate
8. If a user asks about their specific situation, remind them that you provide general guidance and they should contact their real estate agent for personalized advice
9. When mentioning external resources or websites, use markdown link format: [link text](URL). These links will be automatically moved to the sources section, so feel free to include them naturally in your text.
10. Use **bold** formatting for important terms and section headers
11. Use numbered lists (1. 2. 3.) and bullet points (- or *) for better readability
12. **IMPORTANT**: When you cannot provide adequate assistance, are unsure about specific details, or when the user's question requires personalized professional advice, always end your response with a suggestion to "contact your real estate agent" for further assistance.

Focus areas:
- Home buying process and timeline
- Financial preparation (mortgages, pre-approval, down payments)
- Property search and evaluation
- Making offers and negotiations
- Escrow and closing process
- Working with real estate professionals
- Common pitfalls and how to avoid them

Remember: You're here to educate and guide, not to replace professional real estate advice. Use your foundation knowledge to verify information, but only cite sources that users can actually access. When in doubt or when personalized advice is needed, always suggest they contact their real estate agent.`;

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

// Generate a concise, professional title for a conversation based on the first user message
export async function generateConversationTitle(userMessage: string): Promise<string> {
  try {
    console.log('[Chatbot] Generating conversation title for message:', userMessage);

    if (!OPENAI_API_KEY) {
      console.log('[Chatbot] OpenAI API key not configured, using fallback title');
      // Fallback: truncate to reasonable length
      return userMessage.length > 60 ? userMessage.substring(0, 60).trim() : userMessage;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a conversation title generator. Create a concise, professional title (max 60 characters) that captures the essence of the user's question or topic. The title should be:
1. Clear and descriptive
2. Professional and readable
3. Maximum 60 characters
4. No quotes or special formatting
5. Focused on the main topic/question

Examples:
- "How do I get pre-approved for a mortgage?" → "Mortgage Pre-approval Process"
- "What are the steps in buying a home?" → "Home Buying Process Steps"
- "I'm looking for houses in downtown area" → "Downtown Home Search"
- "Can you explain closing costs and fees?" → "Closing Costs and Fees"`
          },
          {
            role: 'user',
            content: `Generate a title for this conversation: "${userMessage}"`
          }
        ],
        max_tokens: 20,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedTitle = data.choices[0]?.message?.content?.trim();

    if (!generatedTitle) {
      throw new Error('No title generated by OpenAI');
    }

    // Ensure title is within reasonable length
    const finalTitle = generatedTitle.length > 60
      ? generatedTitle.substring(0, 60).trim()
      : generatedTitle;

    console.log('[Chatbot] Generated conversation title:', finalTitle);
    return finalTitle;

  } catch (error) {
    console.error('[Chatbot] Error generating conversation title:', error);

    // Fallback: create a simple but clean title
    const fallbackTitle = userMessage.length > 60
      ? userMessage.substring(0, 60).trim()
      : userMessage;

    console.log('[Chatbot] Using fallback title:', fallbackTitle);
    return fallbackTitle;
  }
}

// Rephrase user's conversational message into a proper question for the agent
export async function rephraseUserQuestionForAgent(request: QuestionRephraseRequest): Promise<QuestionRephraseResponse> {
  try {
    console.log('[Chatbot] Rephrasing user question for agent...');

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Create a focused prompt for question rephrasing
    const systemPrompt = `You are an AI assistant that helps rephrase conversational messages into clear, professional questions for real estate agents.

Your task:
1. Analyze the conversation context and the user's latest message
2. Rephrase the user's message into a clear, specific question that a real estate agent can easily understand and respond to
3. If the latest message is unrelated to previous conversation, focus only on the latest message
4. If the conversation provides relevant context, incorporate it to make the question more specific and helpful

Guidelines:
- Make the question clear and actionable
- Include relevant context from the conversation when it helps clarify the question
- Keep it professional but friendly
- Ensure the agent has enough context to provide a helpful response
- If the user made a statement, convert it into a question format
- Focus on real estate and home buying topics

Example transformations:
- "I'm worried about the inspection" → "I have concerns about the upcoming property inspection. What should I expect during the process and what are the key things I should look out for?"
- "The mortgage process is confusing" → "I'm finding the mortgage application process confusing. Can you help explain the key steps and what documents I'll need?"
- "This house looks good but expensive" → "I'm interested in [property address if mentioned], but I'm concerned about the price. Can you help me understand if this is a fair market value and discuss potential negotiation strategies?"

Return a JSON response with:
- rephrasedQuestion: The professionally rephrased question
- reasoning: Brief explanation of how you rephrased it`;

    // Prepare conversation context for the AI
    const conversationContext = request.conversationMessages
      .slice(-10) // Take last 10 messages for context
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `Conversation context:
${conversationContext}

Latest user message to rephrase: "${request.latestUserMessage}"

Please rephrase this into a clear question for the real estate agent.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0]?.message?.content;

    if (!assistantMessage) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(assistantMessage);

    console.log('[Chatbot] Question rephrased successfully');

    return {
      rephrasedQuestion: result.rephrasedQuestion || request.latestUserMessage,
      reasoning: result.reasoning || 'Question rephrased using AI'
    };

  } catch (error) {
    console.error('[Chatbot] Error rephrasing question:', error);

    // Fallback: return the original message with basic formatting
    return {
      rephrasedQuestion: `Question about: ${request.latestUserMessage}`,
      reasoning: 'Fallback rephrasing due to error'
    };
  }
}
