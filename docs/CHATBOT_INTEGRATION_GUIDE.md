# ChatGPT Chatbot Integration Guide

This guide explains how to set up and use the ChatGPT-powered chatbot with your home buying platform.

## Overview

The chatbot system integrates:
- **OpenAI GPT-4o-mini** for intelligent responses
- **Your knowledge base** (Notion + local backups) for context
- **User-specific conversation history** stored in Supabase
- **Real-time chat interface** with conversation management

## Features

### 🤖 AI-Powered Responses
- Uses GPT-4o-mini for natural, contextual responses
- Integrates with your home buying knowledge base
- Provides source citations for transparency
- Falls back to local QA system if OpenAI is unavailable

### 💬 Conversation Management
- Persistent conversation history per user
- Multiple conversation threads
- Edit conversation titles
- Archive/delete conversations
- Automatic conversation splitting for long chats

### 🔐 User Authentication
- Tied to your existing Supabase auth system
- Row-level security ensures users only see their conversations
- Automatic user association with chat sessions

### 📚 Knowledge Integration
- Real-time Notion content via MCP
- Local knowledge base fallback
- Context-aware responses using relevant documentation
- Source attribution for transparency

## Setup Instructions

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# OpenAI Configuration
VITE_OPENAI_API_KEY=your_openai_api_key_here

# Existing Supabase config (should already be set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Migration

Run the new migration to create conversation tables:

```bash
# Apply the migration
npx supabase db push

# Or if using migrations directly:
npx supabase migration up
```

The migration creates:
- `conversations` table for chat sessions
- `messages` table for individual messages
- Row-level security policies
- Helper functions for conversation management

### 3. Dependencies

Install required packages:

```bash
npm install date-fns
```

### 4. OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add it to your environment variables

## Architecture

### Database Schema

```sql
-- Conversations (chat sessions)
conversations:
  - id (UUID, primary key)
  - user_id (UUID, references auth.users)
  - title (TEXT)
  - status (TEXT: 'active', 'archived', 'deleted')
  - created_at, updated_at (TIMESTAMPTZ)

-- Messages (individual chat messages)
messages:
  - id (UUID, primary key)
  - conversation_id (UUID, references conversations)
  - role (TEXT: 'user', 'assistant', 'system')
  - content (TEXT)
  - sources (JSONB array)
  - tokens_used (INTEGER)
  - created_at (TIMESTAMPTZ)
```

### File Structure

```
src/
├── services/
│   └── chatbot/
│       ├── openai.ts          # OpenAI integration
│       ├── conversation.ts    # Database operations
│       └── qa.ts             # Local QA fallback
├── hooks/
│   └── useChatbot.ts         # React hook for chat state
├── components/
│   └── ChatbotInterface.tsx  # Main chat UI
└── knowledge/
    └── docs.ts              # Knowledge base
```

## Usage

### For Users

1. **Start a Conversation**
   - Click "New" in the sidebar
   - Or start typing in the chat input

2. **Ask Questions**
   - Type your home buying questions
   - Get AI-powered responses with source citations
   - View conversation history

3. **Manage Conversations**
   - Switch between different chat threads
   - Edit conversation titles
   - Archive or delete conversations

### For Developers

#### Using the Chatbot Hook

```typescript
import { useChatbot } from '@/hooks/useChatbot';

function MyComponent() {
  const {
    conversations,
    currentConversation,
    sendMessage,
    createNewConversation,
    loadConversation
  } = useChatbot();

  const handleSend = async () => {
    await sendMessage("What is a mortgage pre-approval?");
  };

  return (
    <div>
      {/* Your UI */}
    </div>
  );
}
```

#### Customizing the System Prompt

Edit `src/services/chatbot/openai.ts` to modify the AI's behavior:

```typescript
const SYSTEM_PROMPT = `You are Dom AI, a knowledgeable and friendly home buying assistant...`;
```

#### Adding Knowledge Sources

The chatbot automatically uses your existing knowledge base:
- Notion content via MCP integration
- Local knowledge in `src/knowledge/docs.ts`
- Runtime-injected content

## Configuration Options

### OpenAI Model Settings

In `src/services/chatbot/openai.ts`:

```typescript
{
  model: 'gpt-4o-mini',     // Model to use
  max_tokens: 1000,         // Response length limit
  temperature: 0.7,         // Creativity (0-1)
  top_p: 1,                 // Nucleus sampling
  frequency_penalty: 0,     // Repetition penalty
  presence_penalty: 0       // Topic diversity
}
```

### Conversation Limits

```typescript
// Maximum conversation length before auto-splitting
const MAX_CONVERSATION_TOKENS = 100000;

// Number of recent messages to include in context
const MAX_HISTORY_MESSAGES = 10;
```

### Knowledge Base Integration

The system automatically:
- Retrieves relevant context from your knowledge base
- Includes up to 3 most relevant documents
- Provides source citations
- Falls back gracefully if knowledge is unavailable

## Security & Privacy

### Data Protection
- All conversations are user-specific
- Row-level security prevents cross-user access
- No sensitive data is sent to OpenAI beyond the conversation
- Knowledge base content is sanitized

### API Key Security
- Store OpenAI API key in environment variables
- Never commit API keys to version control
- Use Vite's `VITE_` prefix for client-side access

### Rate Limiting
- Consider implementing rate limiting for production
- Monitor OpenAI API usage and costs
- Set up alerts for unusual usage patterns

## Monitoring & Analytics

### Token Usage Tracking
- Each message stores `tokens_used` for cost monitoring
- Track usage patterns in your database
- Set up alerts for high usage

### Conversation Analytics
- Monitor popular questions
- Track user engagement
- Identify knowledge gaps

## Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check API key is correct
   - Verify account has credits
   - Check rate limits

2. **Database Connection Issues**
   - Verify Supabase connection
   - Check RLS policies
   - Ensure migration was applied

3. **Knowledge Base Not Loading**
   - Check Notion MCP integration
   - Verify local knowledge files
   - Check console for errors

### Debug Mode

Enable debug logging:

```typescript
// In src/services/chatbot/openai.ts
const DEBUG = import.meta.env.DEV;

if (DEBUG) {
  console.log('Chatbot debug info:', { context, response });
}
```

## Cost Optimization

### Token Management
- Use `gpt-4o-mini` for cost efficiency
- Limit conversation history length
- Implement conversation splitting
- Monitor usage with token tracking

### Caching
- Consider caching common responses
- Implement conversation summarization
- Use local QA system for simple queries

## Future Enhancements

### Potential Improvements
- Conversation summarization
- Multi-language support
- Voice input/output
- Integration with property data
- Agent collaboration features
- Advanced analytics dashboard

### Customization Points
- System prompt engineering
- Knowledge base expansion
- Response formatting
- UI/UX improvements
- Integration with other systems

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs for errors
3. Verify all setup steps are completed
4. Test with a simple conversation first

## API Reference

### useChatbot Hook

```typescript
interface ChatbotState {
  conversations: Conversation[];
  currentConversation: ConversationWithMessages | null;
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
}

interface ChatbotActions {
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
  updateTitle: (conversationId: string, title: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}
```

### Database Functions

```sql
-- Create new conversation
SELECT create_conversation(title);

-- Add message to conversation
SELECT add_message(conv_id, role, content, sources, tokens_used);

-- Get conversation with messages
SELECT * FROM get_conversation_with_messages(conv_id);
```
