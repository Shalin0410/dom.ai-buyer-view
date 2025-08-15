-- 0009_chatbot_conversations.sql
-- Add conversation and message tables for chatbot with user-specific history

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Conversations table (chat sessions)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON public.conversations(created_at);

-- Messages table (individual chat messages)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]', -- Array of source documents used for the response
  tokens_used INTEGER, -- Track token usage for cost monitoring
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_role ON public.messages(role);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- RLS Policies for conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their conversations" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages from their conversations" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON public.messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.conversations 
      WHERE conversations.id = messages.conversation_id 
      AND conversations.user_id = auth.uid()
    )
  );

-- Function to get conversation with messages
CREATE OR REPLACE FUNCTION public.get_conversation_with_messages(conv_id UUID)
RETURNS TABLE (
  conversation_id UUID,
  conversation_title TEXT,
  conversation_status TEXT,
  conversation_created_at TIMESTAMPTZ,
  message_id UUID,
  message_role TEXT,
  message_content TEXT,
  message_sources JSONB,
  message_tokens_used INTEGER,
  message_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.title as conversation_title,
    c.status as conversation_status,
    c.created_at as conversation_created_at,
    m.id as message_id,
    m.role as message_role,
    m.content as message_content,
    m.sources as message_sources,
    m.tokens_used as message_tokens_used,
    m.created_at as message_created_at
  FROM public.conversations c
  LEFT JOIN public.messages m ON c.id = m.conversation_id
  WHERE c.id = conv_id AND c.user_id = auth.uid()
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new conversation
CREATE OR REPLACE FUNCTION public.create_conversation(conv_title TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  new_conversation_id UUID;
BEGIN
  INSERT INTO public.conversations (user_id, title)
  VALUES (auth.uid(), COALESCE(conv_title, 'New Conversation'))
  RETURNING id INTO new_conversation_id;
  
  RETURN new_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add a message to a conversation
CREATE OR REPLACE FUNCTION public.add_message(
  conv_id UUID,
  msg_role TEXT,
  msg_content TEXT,
  msg_sources JSONB DEFAULT '[]',
  msg_tokens_used INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
BEGIN
  -- Verify user owns the conversation
  IF NOT EXISTS (
    SELECT 1 FROM public.conversations 
    WHERE id = conv_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Conversation not found or access denied';
  END IF;
  
  INSERT INTO public.messages (conversation_id, role, content, sources, tokens_used)
  VALUES (conv_id, msg_role, msg_content, msg_sources, msg_tokens_used)
  RETURNING id INTO new_message_id;
  
  -- Update conversation timestamp
  UPDATE public.conversations 
  SET updated_at = NOW() 
  WHERE id = conv_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Timestamps maintenance trigger
DO $$ BEGIN
  CREATE TRIGGER conversations_set_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
