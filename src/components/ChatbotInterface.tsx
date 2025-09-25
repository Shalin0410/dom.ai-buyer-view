// src/components/ChatbotInterface.tsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Plus, MessageSquare, Trash2, Archive, Edit3, X, Check, Mail, User, Search, Globe, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatbot } from '@/hooks/useChatbot';
import { useNotionIntegration } from '@/hooks/useNotionIntegration';
import { useAuth } from '@/contexts/AuthContext';
import { rephraseUserQuestionForAgent } from '@/services/chatbot/openai';
import { convertMessagesToChatFormat } from '@/services/chatbot/conversation';
import { formatDistanceToNow } from 'date-fns';
import PerplexityResponse from './PerplexityResponse';
// import { QuestionSelection, QuestionCategory } from './QuestionSelection';
// import { CategoryQuestions } from './CategoryQuestions';

// type ViewMode = 'questions' | 'category' | 'chat';
type ViewMode = 'chat';


const ChatbotInterface = () => {
  // Initialize Notion integration hook
  useNotionIntegration();

  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    isLoading,
    isLoadingConversation,
    isSending,
    error,
    sendMessage,
    loadConversation,
    createNewConversation,
    updateTitle,
    archiveConversation,
    deleteConversation
  } = useChatbot();

  const [inputText, setInputText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  // const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Email composition state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailContent, setEmailContent] = useState('');
  const [userQuestion, setUserQuestion] = useState('');
  const [originalQuestion, setOriginalQuestion] = useState('');
  const [rephrasedQuestion, setRephrasedQuestion] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [isRephrasingQuestion, setIsRephrasingQuestion] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [agentEmail, setAgentEmail] = useState<string>('agent@example.com');
  const [agentName, setAgentName] = useState<string>('Your Agent');
  const [buyerName, setBuyerName] = useState<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const closeEmailModal = () => {
    setShowEmailModal(false);
    setEmailContent('');
    setUserQuestion('');
    setOriginalQuestion('');
    setRephrasedQuestion('');
    setIsRephrasingQuestion(false);
    setIsGeneratingEmail(false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Fetch agent email when user is available
  useEffect(() => {
    const fetchAgentEmail = async () => {
      if (!user?.email) {
        console.log('[ChatbotInterface] No user email available for agent lookup');
        return;
      }

      try {
        console.log('[ChatbotInterface] Fetching buyer info for email:', user.email);
        // Import dataService dynamically to avoid circular imports
        const { dataService } = await import('@/services');

        // Step 1: Get buyer info to find their assigned_agent_id
        const buyerResponse = await dataService.getBuyerByEmail(user.email);
        console.log('[ChatbotInterface] getBuyerByEmail response:', buyerResponse);

        // Set buyer name from buyer data
        if (buyerResponse.success && buyerResponse.data) {
          const buyer = buyerResponse.data;
          const fullBuyerName = `${buyer.first_name || ''} ${buyer.last_name || ''}`.trim();
          setBuyerName(fullBuyerName || buyer.email || 'Buyer');
          console.log('[ChatbotInterface] Setting buyer name to:', fullBuyerName || buyer.email || 'Buyer');
        }

        if (buyerResponse.success && buyerResponse.data?.agent_id) {
          const agentId = buyerResponse.data.agent_id;
          console.log('[ChatbotInterface] Found agent_id:', agentId);

          // Step 2: Get agent info using the agent_id
          const agentResponse = await dataService.getAgentById(agentId);
          console.log('[ChatbotInterface] getAgentById response:', agentResponse);

          if (agentResponse.success && agentResponse.data?.email) {
            console.log('[ChatbotInterface] Setting agent email to:', agentResponse.data.email);
            setAgentEmail(agentResponse.data.email);

            // Also set agent name if available
            if (agentResponse.data.first_name || agentResponse.data.last_name) {
              const firstName = (agentResponse.data.first_name || '').trim();
              const lastName = (agentResponse.data.last_name || '').trim();
              const fullName = `${firstName} ${lastName}`.trim();
              setAgentName(fullName || 'Your Agent');
              console.log('[ChatbotInterface] Setting agent name to:', fullName);
            }
          } else {
            console.log('[ChatbotInterface] Failed to get agent details:', agentResponse);
          }
        } else {
          console.log('[ChatbotInterface] No agent_id found for buyer:', buyerResponse);
        }
      } catch (error) {
        console.error('[ChatbotInterface] Error fetching agent email:', error);
        // Keep default email on error
      }
    };

    fetchAgentEmail();
  }, [user?.email]);

  // Handle state management for conversations and view modes
  useEffect(() => {
    if (currentConversation) {
      setViewMode('chat');
      // setSelectedCategory(null);
    }
    // else {
    //   setViewMode('questions');
    //   setSelectedCategory(null);
    // }
  }, [currentConversation]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    const message = inputText.trim();
    setInputText('');
    setViewMode('chat');
    await sendMessage(message);
  };

  // const handleQuestionSelect = async (question: string) => {
  //   setInputText(question);
  //   setViewMode('chat');
  //   await sendMessage(question);
  // };

  // const handleCategorySelect = (category: QuestionCategory) => {
  //   // setSelectedCategory(category);
  //   setViewMode('category');
  // };

  // const handleBackToQuestions = () => {
  //   setViewMode('questions');
  //   // setSelectedCategory(null);
  // };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleNewConversation = async () => {
    await createNewConversation();
    setShowSidebar(false);
    // setViewMode('questions');
  };

  const handleLoadConversation = async (conversationId: string) => {
    setViewMode('chat');
    // setSelectedCategory(null);
    setInputText('');
    
    await loadConversation(conversationId);
    setShowSidebar(false);
  };

  const handleStartEditTitle = (conversationId: string, currentTitle: string) => {
    setEditingTitle(conversationId);
    setNewTitle(currentTitle);
  };

  const handleSaveTitle = async () => {
    if (editingTitle && newTitle.trim()) {
      await updateTitle(editingTitle, newTitle.trim());
      setEditingTitle(null);
      setNewTitle('');
    }
  };

  const handleCancelEdit = () => {
    setEditingTitle(null);
    setNewTitle('');
  };

  const handleArchiveConversation = async (conversationId: string) => {
    await archiveConversation(conversationId);
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      await deleteConversation(conversationId);
    }
  };

  // Email functionality
  const handleContactAgent = async (question: string) => {
    setOriginalQuestion(question);
    setShowEmailModal(true);
    setIsRephrasingQuestion(true);

    try {
      // Get conversation context for AI rephrasing
      const conversationMessages = currentConversation?.messages
        ? convertMessagesToChatFormat(currentConversation.messages)
        : [];

      console.log('[ChatbotInterface] Rephrasing question for agent...');

      // Use AI to rephrase the question
      const rephraseResult = await rephraseUserQuestionForAgent({
        conversationMessages,
        latestUserMessage: question
      });

      console.log('[ChatbotInterface] Question rephrased:', rephraseResult.rephrasedQuestion);

      setRephrasedQuestion(rephraseResult.rephrasedQuestion);
      setUserQuestion(rephraseResult.rephrasedQuestion);
      setIsRephrasingQuestion(false);

      // Generate email content with the rephrased question
      generateEmailContent(rephraseResult.rephrasedQuestion);

    } catch (error) {
      console.error('[ChatbotInterface] Error rephrasing question:', error);
      setIsRephrasingQuestion(false);

      // Fallback to original question
      setRephrasedQuestion(question);
      setUserQuestion(question);
      generateEmailContent(question);
    }
  };

  const generateEmailContent = async (question: string) => {
    setIsGeneratingEmail(true);
    try {
      console.log('[ChatbotInterface] generateEmailContent - Current values:', {
        buyerName,
        agentName,
        agentEmail,
        question
      });

      // Use simple template instead of AI to reduce costs and ensure reliability
      const finalBuyerName = buyerName || user?.email || 'Buyer';
      const finalAgentName = agentName || 'Your Agent';

      const emailTemplate = `Dear ${finalAgentName},

I hope this message finds you well. I have a question about my home buying journey that I'd appreciate your guidance on:

${question}

Could you please provide some advice or schedule a time to discuss this further? I would greatly appreciate your expertise and assistance.

Thank you for your time and support.

Best regards,
${finalBuyerName}`;

      setEmailContent(emailTemplate);
    } catch (error) {
      console.error('Error generating email:', error);
      // Fallback template
      setEmailContent(
        `Dear ${agentName || 'Your Agent'},\n\nI have a question about my home buying journey:\n\n${question}\n\nCould you please provide guidance?\n\nBest regards,\n${buyerName || user?.email || 'Buyer'}`
      );
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailContent.trim()) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/send-agent-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: agentEmail,
          buyerName: buyerName || user?.email || 'Buyer',
          buyerEmail: user?.email || '',
          subject: `Question from ${buyerName || user?.email || 'Buyer'}: Home Buying Assistance`,
          message: emailContent,
          originalQuestion: userQuestion,
          agentName: agentName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      // Close modal and show success message
      closeEmailModal();

      // Add a system message to the current conversation
      // Note: This would require extending the chat system to support system messages

    } catch (error) {
      console.error('Error sending email:', error);
      // You could show an error toast here
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto border-r border-gray-200`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 bg-white sticky top-0 z-10 h-[73px]">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
            >
              <Plus size={16} />
              New
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="text-center text-gray-500">Loading conversations...</div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500">
                <MessageSquare size={48} className="mx-auto mb-2 text-gray-300" />
                <p>No conversations yet</p>
                <Button onClick={handleNewConversation} variant="outline" size="sm" className="mt-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50">
                  Start a conversation
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentConversation?.conversation.id === conversation.id
                      ? 'bg-gray-100 border-gray-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => editingTitle !== conversation.id && handleLoadConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {editingTitle === conversation.id ? (
                        <div className="space-y-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyPress={handleTitleKeyPress}
                            className="text-sm font-medium"
                            autoFocus
                            placeholder="Enter conversation title..."
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveTitle();
                              }}
                              className="bg-green-500 hover:bg-green-600 text-white h-6 px-2"
                            >
                              <Check size={12} />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                              className="border-red-300 text-red-600 hover:bg-red-50 h-6 px-2"
                            >
                              <X size={12} />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                          </p>
                        </>
                      )}
                    </div>

                    {editingTitle !== conversation.id && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEditTitle(conversation.id, conversation.title);
                        }}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        title="Edit conversation title"
                      >
                        <Edit3 size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conversation.id);
                        }}
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        title="Archive conversation"
                      >
                        <Archive size={12} />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                        className="text-gray-500 hover:text-red-600 hover:bg-red-50"
                        title="Delete conversation"
                      >
                        <Trash2 size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex items-center justify-between px-4 py-4 bg-white border-b border-gray-200 sticky top-0 z-10 h-[73px]">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowSidebar(!showSidebar)}
              variant="ghost"
              size="sm"
              className="lg:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <MessageSquare size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-gray-600" />
              <h1 className="text-lg font-semibold text-gray-900">Chat Assistant</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 relative">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {!currentConversation && !isLoadingConversation ? (
            <div className="space-y-4 pt-4">
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="bg-gray-100 border border-gray-200 text-gray-900 rounded-lg p-3">
                    <div className="whitespace-pre-wrap">
                      Hi! I'm Dom AI, your real estate assistant. I can help you with listing searches, home buying questions, or market insights. What would you like to know?
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Just now
                  </p>
                </div>
              </div>
            </div>
          ) : isLoadingConversation ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex space-x-1 justify-center mb-4">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-gray-600">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Questions Overlay - Commented out for future use */}
                             {/* {currentConversation && viewMode === 'questions' && (
                 <div className="absolute inset-0 bg-white z-10 flex flex-col">
                   <div className="flex items-center justify-between p-4 border-b bg-white">
                     <h2 className="text-lg font-semibold text-gray-900">Quick Questions</h2>
                     <div className="flex items-center gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setViewMode('chat')}
                         className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                       >
                         Back to Chat
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setViewMode('chat')}
                         className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                       >
                         <X size={16} />
                       </Button>
                     </div>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-4">
                     <QuestionSelection
                       onQuestionSelect={handleQuestionSelect}
                       onCategorySelect={handleCategorySelect}
                     />
                   </div>
                 </div>
               )}

               {currentConversation && viewMode === 'category' && selectedCategory && (
                 <div className="absolute inset-0 bg-white z-10 flex flex-col">
                   <div className="flex items-center justify-between p-4 border-b bg-white">
                     <h2 className="text-lg font-semibold text-gray-900">{selectedCategory.title}</h2>
                     <div className="flex items-center gap-2">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => setViewMode('questions')}
                         className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                       >
                         Back to Categories
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => setViewMode('chat')}
                         className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                       >
                         <X size={16} />
                       </Button>
                     </div>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-4">
                     <CategoryQuestions
                       category={selectedCategory}
                       onQuestionSelect={handleQuestionSelect}
                       onBack={() => setViewMode('questions')}
                     />
                   </div>
                 </div>
               )} */}

              {currentConversation && viewMode === 'chat' && (
                <>
                  <div className="sticky top-0 z-20 bg-white px-4 py-3 border-b border-gray-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      {editingTitle === currentConversation.conversation.id ? (
                        <div className="flex items-center gap-2 w-full max-w-md">
                                                     <Input
                             value={newTitle}
                             onChange={(e) => setNewTitle(e.target.value)}
                             onKeyPress={handleTitleKeyPress}
                             className="text-lg font-medium bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 focus:outline-none"
                             autoFocus
                             placeholder="Enter conversation title..."
                           />
                          <Button 
                            size="sm" 
                            onClick={handleSaveTitle}
                            className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                            title="Save title"
                          >
                            <Check size={16} />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                            className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            title="Cancel editing"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-lg font-medium text-gray-900">
                            {currentConversation.conversation.title}
                          </h3>
                                                     <Button
                             onClick={() => handleStartEditTitle(currentConversation.conversation.id, currentConversation.conversation.title)}
                             variant="ghost"
                             size="sm"
                             className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                             title="Edit conversation title"
                           >
                             <Edit3 size={16} />
                           </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentConversation.messages
                      .filter((message, index, array) => 
                        array.findIndex(m => m.id === message.id) === index
                      )
                      .map((message) => (
                      <div
                        key={`message-${message.id}-${message.created_at}`}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[90%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                          {message.role === 'user' ? (
                            <div className="bg-blue-500 text-white p-3 rounded-lg">
                              <div className="whitespace-pre-wrap">{message.content}</div>
                            </div>
                          ) : (
                            <div className="bg-white border border-gray-200 rounded-lg p-4">
                              <PerplexityResponse
                                content={message.content}
                                sources={message.sources || []}
                                webSearch={message.webSearch}
                              />
                              
                              {/* Contact Agent Button - Show if AI suggests contacting agent */}
                              {message.content.toLowerCase().includes('contact') &&
                               (message.content.toLowerCase().includes('agent') ||
                                message.content.toLowerCase().includes('real estate') ||
                                message.content.toLowerCase().includes('professional')) && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                  <Button
                                    onClick={() => {
                                      // Find the user's original question (previous message)
                                      const messageIndex = currentConversation?.messages.findIndex(m => m.id === message.id);
                                      const userMessage = messageIndex !== undefined && messageIndex > 0
                                        ? currentConversation?.messages[messageIndex - 1]
                                        : null;
                                      const question = userMessage?.role === 'user'
                                        ? userMessage.content
                                        : inputText || 'I have a question about my home buying journey';

                                      handleContactAgent(question);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    <Mail className="h-4 w-4" />
                                    Contact Your Agent
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isSending && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%]">
                          <div className="bg-gray-100 border border-gray-200 text-gray-900 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-sm text-gray-600 italic">Dom AI is typing...</span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Just now
                          </p>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            {/* Quick Questions Button - Commented out for future use */}
                         {/* {currentConversation && (
               <Button
                 variant="outline"
                 onClick={() => setViewMode('questions')}
                 className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                 disabled={isSending}
               >
                 Quick Questions
               </Button>
             )} */}
                         <Input
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyPress={handleKeyPress}
               placeholder="Ask me anything about real estate..."
               disabled={isSending}
               className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-blue-500 focus:ring-2 focus:ring-offset-0 focus:outline-none"
             />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isSending}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white border-blue-500 disabled:bg-gray-300 disabled:text-gray-500"
            >
              <Send size={16} />
              Send
            </Button>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Your Agent
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeEmailModal}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Original Question */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Your Original Message:
                </label>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800">
                  {originalQuestion}
                </div>
              </div>

              {/* AI Rephrased Question */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  AI-Enhanced Question for Agent:
                </label>
                {isRephrasingQuestion ? (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">AI is rephrasing your question for better clarity...</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-sm text-gray-800">
                      {rephrasedQuestion || userQuestion}
                    </div>
                    {rephrasedQuestion && rephrasedQuestion !== originalQuestion && (
                      <div className="mt-2 text-xs text-blue-600">
                        ✨ AI has rephrased your question to provide more context for your agent
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  {agentName !== 'Your Agent' ? `${agentName}'s Email:` : 'Agent Email:'}
                </label>
                <Input
                  value={agentEmail}
                  onChange={(e) => setAgentEmail(e.target.value)}
                  placeholder="agent@example.com"
                  className="mb-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email Message:
                </label>
                {isGeneratingEmail ? (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-sm text-gray-600">Generating professional email...</span>
                    </div>
                  </div>
                ) : (
                  <Textarea
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    placeholder="Your message to the agent..."
                    rows={8}
                    className="resize-none"
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={closeEmailModal}
                  disabled={isSendingEmail}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendEmail}
                  disabled={!emailContent.trim() || isSendingEmail || isGeneratingEmail}
                  className="flex items-center gap-2"
                >
                  {isSendingEmail ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Email
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </TooltipProvider>
  );
};

export default ChatbotInterface;