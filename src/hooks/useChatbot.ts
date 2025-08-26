// src/hooks/useChatbot.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  sendChatMessage, 
  ChatMessage, 
  shouldStartNewConversation 
} from '@/services/chatbot/openai';
import {
  Conversation,
  Message,
  ConversationWithMessages,
  getUserConversations,
  getConversation,
  createConversation,
  addMessage,
  updateConversationTitle,
  archiveConversation as archiveConversationService,
  deleteConversation as deleteConversationService,
  convertMessagesToChatFormat,
  getConversationSummary
} from '@/services/chatbot/conversation';

export interface ChatbotState {
  conversations: Conversation[];
  currentConversation: ConversationWithMessages | null;
  isLoading: boolean;
  isLoadingConversation: boolean;
  isSending: boolean;
  error: string | null;
}

export interface ChatbotActions {
  sendMessage: (content: string) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  createNewConversation: () => Promise<void>;
  updateTitle: (conversationId: string, title: string) => Promise<void>;
  archiveConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export function useChatbot(): ChatbotState & ChatbotActions {
  const { user } = useAuth();
  const [state, setState] = useState<ChatbotState>({
    conversations: [],
    currentConversation: null,
    isLoading: false,
    isLoadingConversation: false,
    isSending: false,
    error: null
  });

  const isFirstLoadRef = useRef(true);
  const isLoadingConversationsRef = useRef(false);

  const refreshConversations = useCallback(async () => {
    if (!user || isLoadingConversationsRef.current) return;

    isLoadingConversationsRef.current = true;

    // Only show loading on first load to prevent flickering
    if (isFirstLoadRef.current) {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
    } else {
      setState(prev => ({ ...prev, error: null }));
    }
    
    try {
      const conversations = await getUserConversations(user.id);
      setState(prev => ({ 
        ...prev, 
        conversations, 
        isLoading: false 
      }));
      isFirstLoadRef.current = false;
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load conversations',
        isLoading: false 
      }));
    } finally {
      isLoadingConversationsRef.current = false;
    }
  }, [user]);

  // Load user's conversations on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshConversations();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const loadConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoadingConversation: true, error: null }));
    
    try {
      const conversation = await getConversation(conversationId);
      setState(prev => ({ 
        ...prev, 
        currentConversation: conversation,
        isLoadingConversation: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load conversation',
        isLoadingConversation: false 
      }));
    }
  }, [user]);

  const createNewConversation = useCallback(async () => {
    if (!user) return;

    console.log('[Chatbot] Creating new conversation UI state (no database entry yet)');
    
    // Don't create a database entry yet - just set up the UI state
    // The conversation will be created when the user actually sends a message
    setState(prev => ({ 
      ...prev, 
      currentConversation: null, // This will trigger the questions view
      error: null 
    }));
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !content.trim()) return;

    setState(prev => ({ ...prev, isSending: true, error: null }));

    try {
      let conversationId: string;
      let conversationHistory: ChatMessage[] = [];
      
      // Create temporary user message ID for immediate display
      const tempUserMessageId = 'temp-user-' + Date.now();

      // If no current conversation, create one now that user is actually sending a message
      if (!state.currentConversation) {
        console.log('[Chatbot] Creating actual database conversation for first message');
        conversationId = await createConversation(undefined, user.id);
        const newConversation = await getConversation(conversationId);
        
        // Add the user message immediately to the UI
        const userMessage = {
          id: tempUserMessageId,
          conversation_id: conversationId,
          role: 'user' as const,
          content: content,
          sources: [],
          tokens_used: null,
          created_at: new Date().toISOString()
        };
        
        setState(prev => ({ 
          ...prev, 
          currentConversation: newConversation ? {
            ...newConversation,
            messages: [...newConversation.messages, userMessage]
          } : null,
          conversations: newConversation ? [newConversation.conversation, ...prev.conversations] : prev.conversations
        }));
      } else {
        conversationId = state.currentConversation.conversation.id;
        conversationHistory = convertMessagesToChatFormat(state.currentConversation.messages);
        
        // Add the user message immediately to the UI
        const userMessage = {
          id: tempUserMessageId,
          conversation_id: conversationId,
          role: 'user' as const,
          content: content,
          sources: [],
          tokens_used: null,
          created_at: new Date().toISOString()
        };
        
        setState(prev => ({ 
          ...prev, 
          currentConversation: prev.currentConversation ? {
            ...prev.currentConversation,
            messages: [...prev.currentConversation.messages, userMessage]
          } : null
        }));
      }

      // Check if we should start a new conversation due to length
      if (shouldStartNewConversation(conversationHistory)) {
        console.log('Conversation getting long, starting new one...');
        conversationId = await createConversation(undefined, user.id);
        conversationHistory = [];
        const newConversation = await getConversation(conversationId);
        
        // Add user message to new conversation
        const userMessage = {
          id: tempUserMessageId,
          conversation_id: conversationId,
          role: 'user' as const,
          content: content,
          sources: [],
          tokens_used: null,
          created_at: new Date().toISOString()
        };
        
        setState(prev => ({ 
          ...prev, 
          currentConversation: newConversation ? {
            ...newConversation,
            messages: [...newConversation.messages, userMessage]
          } : null,
          conversations: newConversation ? [newConversation.conversation, ...prev.conversations] : prev.conversations
        }));
      }

      // Add user message to database (in background)
      const userMessageId = await addMessage(conversationId, 'user', content);

      // Get AI response
      const response = await sendChatMessage(content, conversationHistory);

      // Add AI response to database
      const assistantMessageId = await addMessage(
        conversationId, 
        'assistant', 
        response.message, 
        response.sources, 
        response.tokensUsed
      );

      // Create the assistant message for immediate display
      const assistantMessage = {
        id: assistantMessageId,
        conversation_id: conversationId,
        role: 'assistant' as const,
        content: response.message,
        sources: response.sources || [],
        tokens_used: response.tokensUsed,
        created_at: new Date().toISOString()
      };

      // Update the conversation title if it's still the default
      let finalTitle = state.currentConversation?.conversation.title || 'New Conversation';
      if (finalTitle === 'New Conversation') {
        const currentMessages = state.currentConversation?.messages || [];
        const allMessages = [...currentMessages, assistantMessage];
        finalTitle = getConversationSummary(allMessages);
        await updateConversationTitle(conversationId, finalTitle);
      }

      // Update state with the real assistant response and replace temp user message
      setState(prev => ({ 
        ...prev, 
        currentConversation: prev.currentConversation ? {
          conversation: {
            ...prev.currentConversation.conversation,
            title: finalTitle,
            updated_at: new Date().toISOString()
          },
          messages: [
            ...prev.currentConversation.messages
              .filter(msg => msg.id !== tempUserMessageId) // Remove temp user message
              .map(msg => msg.id === tempUserMessageId ? { ...msg, id: userMessageId } : msg), // Replace with real ID if needed
            {
              id: userMessageId,
              conversation_id: conversationId,
              role: 'user' as const,
              content: content,
              sources: [],
              tokens_used: null,
              created_at: new Date().toISOString()
            },
            assistantMessage
          ]
        } : null,
        isSending: false 
      }));

    } catch (error) {
      // Remove the temporary user message on error and show error state
      setState(prev => ({ 
        ...prev,
        currentConversation: prev.currentConversation ? {
          ...prev.currentConversation,
          messages: prev.currentConversation.messages.filter(msg => msg.id !== tempUserMessageId)
        } : null,
        error: error instanceof Error ? error.message : 'Failed to send message',
        isSending: false 
      }));
    }
  }, [user, state.currentConversation]);

  const updateTitle = useCallback(async (conversationId: string, title: string) => {
    if (!user) return;

    try {
      await updateConversationTitle(conversationId, title);
      
      // Update local state
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conv => 
          conv.id === conversationId ? { ...conv, title } : conv
        ),
        currentConversation: prev.currentConversation?.conversation.id === conversationId
          ? { ...prev.currentConversation, conversation: { ...prev.currentConversation.conversation, title } }
          : prev.currentConversation
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to update title'
      }));
    }
  }, [user]);

  const archiveConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await archiveConversationService(conversationId);
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: prev.currentConversation?.conversation.id === conversationId
          ? null
          : prev.currentConversation
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to archive conversation'
      }));
    }
  }, [user]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await deleteConversationService(conversationId);
      
      // Remove from local state
      setState(prev => ({
        ...prev,
        conversations: prev.conversations.filter(conv => conv.id !== conversationId),
        currentConversation: prev.currentConversation?.conversation.id === conversationId
          ? null
          : prev.currentConversation
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to delete conversation'
      }));
    }
  }, [user]);

  return {
    ...state,
    sendMessage,
    loadConversation,
    createNewConversation,
    updateTitle,
    archiveConversation,
    deleteConversation,
    refreshConversations
  };
}
