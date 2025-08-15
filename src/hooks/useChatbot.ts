// src/hooks/useChatbot.ts
import { useState, useCallback, useEffect } from 'react';
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

  // Load user's conversations on mount
  useEffect(() => {
    if (user) {
      refreshConversations();
    }
  }, [user]);

  const refreshConversations = useCallback(async () => {
    if (!user) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const conversations = await getUserConversations();
      setState(prev => ({ 
        ...prev, 
        conversations, 
        isLoading: false 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to load conversations',
        isLoading: false 
      }));
    }
  }, [user]);

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

      // If no current conversation, create one now that user is actually sending a message
      if (!state.currentConversation) {
        console.log('[Chatbot] Creating actual database conversation for first message');
        conversationId = await createConversation();
        const newConversation = await getConversation(conversationId);
        setState(prev => ({ 
          ...prev, 
          currentConversation: newConversation,
          conversations: [newConversation!.conversation, ...prev.conversations]
        }));
      } else {
        conversationId = state.currentConversation.conversation.id;
        conversationHistory = convertMessagesToChatFormat(state.currentConversation.messages);
      }

      // Check if we should start a new conversation due to length
      if (shouldStartNewConversation(conversationHistory)) {
        console.log('Conversation getting long, starting new one...');
        conversationId = await createConversation();
        conversationHistory = [];
        const newConversation = await getConversation(conversationId);
        setState(prev => ({ 
          ...prev, 
          currentConversation: newConversation,
          conversations: [newConversation!.conversation, ...prev.conversations]
        }));
      }

      // Add user message to database
      await addMessage(conversationId, 'user', content);

      // Get AI response
      const response = await sendChatMessage(content, conversationHistory);

      // Add AI response to database
      await addMessage(
        conversationId, 
        'assistant', 
        response.message, 
        response.sources, 
        response.tokensUsed
      );

      // Reload conversation to get updated messages
      const updatedConversation = await getConversation(conversationId);
      
      // Update conversation title if it's still the default
      if (updatedConversation && updatedConversation.conversation.title === 'New Conversation') {
        const summary = getConversationSummary(updatedConversation.messages);
        await updateConversationTitle(conversationId, summary);
        updatedConversation.conversation.title = summary;
      }

      setState(prev => ({ 
        ...prev, 
        currentConversation: updatedConversation,
        isSending: false 
      }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
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
