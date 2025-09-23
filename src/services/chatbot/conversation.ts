// src/services/chatbot/conversation.ts
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import { ChatMessage } from './openai';

export interface Conversation {
  id: string;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  tokens_used: number | null;
  created_at: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet?: string;
  }>;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

// Get all conversations for the current user
export async function getUserConversations(userId?: string): Promise<Conversation[]> {
  try {
    console.log('[Conversation] Fetching conversations for user:', userId);

    let query = supabaseAdmin
      .from('conversations')
      .select('id, title, status, created_at, updated_at')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    // If userId is provided, filter by it, otherwise get conversations with null user_id
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.is('user_id', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }

    console.log('[Conversation] Found conversations:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    return [];
  }
}

// Get a specific conversation with all its messages
export async function getConversation(conversationId: string): Promise<ConversationWithMessages | null> {
  try {
    // Get conversation details
    const { data: conversationData, error: conversationError } = await supabaseAdmin
      .from('conversations')
      .select('id, title, status, created_at, updated_at')
      .eq('id', conversationId)
      .single();

    if (conversationError || !conversationData) {
      console.error('Error fetching conversation:', conversationError);
      return null;
    }

    // Get messages for this conversation
    const { data: messagesData, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, conversation_id, role, content, sources, tokens_used, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return null;
    }

    const conversation: Conversation = {
      id: conversationData.id,
      title: conversationData.title || 'New Conversation',
      status: conversationData.status,
      created_at: conversationData.created_at,
      updated_at: conversationData.updated_at
    };

    const messages: Message[] = (messagesData || [])
      .map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
        tokens_used: msg.tokens_used,
        created_at: msg.created_at,
        sources: msg.sources
      }))
      // Remove any potential duplicates based on message ID
      .filter((message, index, array) => 
        array.findIndex(m => m.id === message.id) === index
      );

    return { conversation, messages };
  } catch (error) {
    console.error('Error in getConversation:', error);
    return null;
  }
}

// Create a new conversation
export async function createConversation(title?: string, userId?: string, organizationId?: string): Promise<string> {
  try {
    console.log('[Conversation] Creating conversation with params:', { title, userId, organizationId });

    // Get organization_id from the current user's context if not provided
    if (!organizationId && userId) {
      console.log('[Conversation] Fetching organization_id for user:', userId);
      // Use admin client to bypass RLS when fetching user organization
      const { data: userData, error: userError } = await supabaseAdmin
        .from('persons')
        .select('organization_id')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        console.error('Error fetching user organization:', userError);
        throw new Error('Failed to get user organization');
      }
      organizationId = userData.organization_id;
      console.log('[Conversation] Found organization_id:', organizationId);
    }

    if (!organizationId) {
      console.error('[Conversation] No organization_id provided or found');
      throw new Error('Organization ID is required');
    }

    console.log('[Conversation] Inserting conversation with data:', {
      organization_id: organizationId,
      user_id: userId || null,
      title: title || 'New Conversation',
      status: 'active'
    });

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        organization_id: organizationId,
        user_id: userId || null,
        title: title || 'New Conversation',
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating conversation in database:', error);
      throw new Error(`Failed to create conversation: ${error.message}`);
    }

    console.log('[Conversation] Successfully created conversation:', data.id);
    return data.id;
  } catch (error) {
    console.error('Error in createConversation:', error);
    // Generate a proper UUID for mock conversations
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    const mockId = `mock-${uuid}`;
    console.log('[Conversation] Returning mock conversation ID:', mockId);
    return mockId;
  }
}

// Add a message to a conversation
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  tokensUsed?: number,
  sources?: Array<{ title: string; url: string; snippet?: string; }>
): Promise<string> {
  try {
    // Insert message directly into the messages table
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: role,
        content: content,
        tokens_used: tokensUsed,
        sources: sources || []
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error adding message:', error);
      throw new Error('Failed to add message');
    }

    // Update conversation timestamp
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);
      
    if (updateError) {
      console.warn('Failed to update conversation timestamp:', updateError);
    }

    return data.id;
  } catch (error) {
    console.error('Error in addMessage:', error);
    // Generate a proper UUID for mock messages
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    return `mock-msg-${uuid}`;
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ title, updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation title:', error);
      throw new Error('Failed to update conversation title');
    }
  } catch (error) {
    console.error('Error in updateConversationTitle:', error);
  }
}

// Archive a conversation
export async function archiveConversation(conversationId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('Error archiving conversation:', error);
      throw new Error('Failed to archive conversation');
    }
  } catch (error) {
    console.error('Error in archiveConversation:', error);
  }
}

// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('conversations')
      .update({ status: 'deleted', updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      throw new Error('Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error in deleteConversation:', error);
  }
}

// Convert database messages to ChatMessage format for OpenAI
export function convertMessagesToChatFormat(messages: Message[]): ChatMessage[] {
  return messages
    .filter(msg => msg.role !== 'system') // Filter out system messages as they're added dynamically
    .map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    }));
}

// Get conversation summary for display
export function getConversationSummary(messages: Message[]): string {
  console.log('[getConversationSummary] Input messages:', messages);
  const userMessages = messages.filter(msg => msg.role === 'user');
  console.log('[getConversationSummary] User messages:', userMessages);

  if (userMessages.length === 0) {
    console.log('[getConversationSummary] No user messages found, returning default');
    return 'New conversation';
  }

  const firstMessage = userMessages[0].content;
  console.log('[getConversationSummary] First user message content:', firstMessage);

  const title = firstMessage.length > 50
    ? firstMessage.substring(0, 50) + '...'
    : firstMessage;

  console.log('[getConversationSummary] Generated title:', title);
  return title;
}
