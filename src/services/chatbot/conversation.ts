// src/services/chatbot/conversation.ts
import { supabase } from '@/lib/supabaseClient';
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
  sources: Array<{ title: string; url?: string; sourceType?: string }>;
  tokens_used: number | null;
  created_at: string;
}

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

// Get all conversations for the current user
export async function getUserConversations(): Promise<Conversation[]> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('status', 'active')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      // If the table doesn't exist (migration not applied), return empty array
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('Conversations table not found. Please run the database migration.');
        return [];
      }
      throw new Error('Failed to fetch conversations');
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserConversations:', error);
    // Return empty array if database is not available
    return [];
  }
}

// Get a specific conversation with all its messages
export async function getConversation(conversationId: string): Promise<ConversationWithMessages | null> {
  try {
    const { data, error } = await supabase
      .rpc('get_conversation_with_messages', { conv_id: conversationId });

    if (error) {
      console.error('Error fetching conversation:', error);
      // If the function doesn't exist (migration not applied), return null
      if (error.code === '42883') { // Function doesn't exist
        console.warn('Database functions not found. Please run the database migration.');
        return null;
      }
      throw new Error('Failed to fetch conversation');
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Transform the flat data into structured format
    const firstRow = data[0];
    const conversation: Conversation = {
      id: firstRow.conversation_id,
      title: firstRow.conversation_title,
      status: firstRow.conversation_status,
      created_at: firstRow.conversation_created_at,
      updated_at: firstRow.conversation_created_at // We'll update this
    };

    const messages: Message[] = data
      .filter(row => row.message_id) // Filter out null messages
      .map(row => ({
        id: row.message_id,
        conversation_id: row.conversation_id,
        role: row.message_role,
        content: row.message_content,
        sources: row.message_sources || [],
        tokens_used: row.message_tokens_used,
        created_at: row.message_created_at
      }));

    return { conversation, messages };
  } catch (error) {
    console.error('Error in getConversation:', error);
    return null;
  }
}

// Create a new conversation
export async function createConversation(title?: string): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('create_conversation', { conv_title: title });

    if (error) {
      console.error('Error creating conversation:', error);
      // If the function doesn't exist (migration not applied), create a mock conversation
      if (error.code === '42883') { // Function doesn't exist
        console.warn('Database functions not found. Creating mock conversation.');
        const mockId = 'mock-' + Date.now();
        return mockId;
      }
      throw new Error('Failed to create conversation');
    }

    return data;
  } catch (error) {
    console.error('Error in createConversation:', error);
    // Return a mock ID if database is not available
    return 'mock-' + Date.now();
  }
}

// Add a message to a conversation
export async function addMessage(
  conversationId: string,
  role: 'user' | 'assistant' | 'system',
  content: string,
  sources: Array<{ title: string; url?: string; sourceType?: string }> = [],
  tokensUsed?: number
): Promise<string> {
  try {
    const { data, error } = await supabase
      .rpc('add_message', {
        conv_id: conversationId,
        msg_role: role,
        msg_content: content,
        msg_sources: sources,
        msg_tokens_used: tokensUsed
      });

    if (error) {
      console.error('Error adding message:', error);
      // If the function doesn't exist (migration not applied), return a mock ID
      if (error.code === '42883') { // Function doesn't exist
        console.warn('Database functions not found. Message not saved.');
        return 'mock-msg-' + Date.now();
      }
      throw new Error('Failed to add message');
    }

    return data;
  } catch (error) {
    console.error('Error in addMessage:', error);
    // Return a mock ID if database is not available
    return 'mock-msg-' + Date.now();
  }
}

// Update conversation title
export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ title })
      .eq('id', conversationId);

    if (error) {
      console.error('Error updating conversation title:', error);
      // If the table doesn't exist (migration not applied), just log and continue
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('Conversations table not found. Title not updated.');
        return;
      }
      throw new Error('Failed to update conversation title');
    }
  } catch (error) {
    console.error('Error in updateConversationTitle:', error);
    // Continue without updating if database is not available
  }
}

// Archive a conversation
export async function archiveConversation(conversationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'archived' })
      .eq('id', conversationId);

    if (error) {
      console.error('Error archiving conversation:', error);
      // If the table doesn't exist (migration not applied), just log and continue
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('Conversations table not found. Conversation not archived.');
        return;
      }
      throw new Error('Failed to archive conversation');
    }
  } catch (error) {
    console.error('Error in archiveConversation:', error);
    // Continue without archiving if database is not available
  }
}

// Delete a conversation
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('conversations')
      .update({ status: 'deleted' })
      .eq('id', conversationId);

    if (error) {
      console.error('Error deleting conversation:', error);
      // If the table doesn't exist (migration not applied), just log and continue
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('Conversations table not found. Conversation not deleted.');
        return;
      }
      throw new Error('Failed to delete conversation');
    }
  } catch (error) {
    console.error('Error in deleteConversation:', error);
    // Continue without deleting if database is not available
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
  const userMessages = messages.filter(msg => msg.role === 'user');
  if (userMessages.length === 0) return 'New conversation';
  
  const firstMessage = userMessages[0].content;
  return firstMessage.length > 50 
    ? firstMessage.substring(0, 50) + '...' 
    : firstMessage;
}
