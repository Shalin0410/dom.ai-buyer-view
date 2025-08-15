// src/components/ChatbotInterface.tsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Plus, MessageSquare, Trash2, Archive, Edit3, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChatbot } from '@/hooks/useChatbot';
import { useNotionIntegration } from '@/hooks/useNotionIntegration';
import { formatDistanceToNow } from 'date-fns';
import { QuestionSelection, QuestionCategory } from './QuestionSelection';
import { CategoryQuestions } from './CategoryQuestions';

type ViewMode = 'questions' | 'category' | 'chat';

const ChatbotInterface = () => {
  // Initialize Notion integration hook
  useNotionIntegration();
  
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
  const [viewMode, setViewMode] = useState<ViewMode>('questions');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  // Handle state management for conversations and view modes
  useEffect(() => {
    if (currentConversation) {
      setViewMode('chat');
      setSelectedCategory(null);
    } else {
      setViewMode('questions');
      setSelectedCategory(null);
    }
  }, [currentConversation]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    const message = inputText.trim();
    setInputText('');
    setViewMode('chat');
    await sendMessage(message);
  };

  const handleQuestionSelect = async (question: string) => {
    setInputText(question);
    setViewMode('chat');
    await sendMessage(question);
  };

  const handleCategorySelect = (category: QuestionCategory) => {
    setSelectedCategory(category);
    setViewMode('category');
  };

  const handleBackToQuestions = () => {
    setViewMode('questions');
    setSelectedCategory(null);
  };

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
    setViewMode('questions');
  };

  const handleLoadConversation = async (conversationId: string) => {
    setViewMode('chat');
    setSelectedCategory(null);
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-80 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
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
                <Button onClick={handleNewConversation} variant="outline" size="sm" className="mt-2 bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100">
                  Start a conversation
                </Button>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group relative p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentConversation?.conversation.id === conversation.id
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => handleLoadConversation(conversation.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                      </p>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleArchiveConversation(conversation.id);
                        }}
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
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-white border-b sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowSidebar(!showSidebar)}
              variant="ghost"
              size="sm"
              className="lg:hidden"
            >
              <MessageSquare size={20} />
            </Button>
            <div className="flex items-center gap-2">
              <Bot size={20} className="text-yellow-600" />
              <h1 className="text-lg font-semibold text-gray-900">Dom AI Assistant</h1>
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
            <div className="h-full">
              {viewMode === 'questions' && (
                <QuestionSelection
                  onQuestionSelect={handleQuestionSelect}
                  onCategorySelect={handleCategorySelect}
                />
              )}
              
              {viewMode === 'category' && selectedCategory && (
                <CategoryQuestions
                  category={selectedCategory}
                  onQuestionSelect={handleQuestionSelect}
                  onBack={handleBackToQuestions}
                />
              )}
            </div>
          ) : isLoadingConversation ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="flex space-x-1 justify-center mb-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <p className="text-gray-600">Loading conversation...</p>
              </div>
            </div>
          ) : (
            <>
              {currentConversation && viewMode === 'questions' && (
                <div className="absolute inset-0 bg-white z-10 flex flex-col">
                  <div className="flex items-center justify-between p-4 border-b bg-white">
                    <h2 className="text-lg font-semibold text-gray-900">Quick Questions</h2>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode('chat')}
                        className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:border-yellow-400"
                      >
                        Back to Chat
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('chat')}
                        className="text-gray-500 hover:text-gray-700"
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
                        className="bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 hover:border-yellow-400"
                      >
                        Back to Categories
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewMode('chat')}
                        className="text-gray-500 hover:text-gray-700"
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
              )}

              {currentConversation && viewMode === 'chat' && (
                <>
                  <div className="sticky top-0 z-20 bg-gray-50 px-4 py-3 border-b border-gray-200 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      {editingTitle === currentConversation.conversation.id ? (
                        <div className="flex items-center gap-2 w-full max-w-md">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyPress={handleTitleKeyPress}
                            className="text-lg font-medium bg-white border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500"
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
                            className="text-gray-500 hover:text-gray-700"
                            title="Edit conversation title"
                          >
                            <Edit3 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {currentConversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            
                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Sources:</p>
                                <div className="flex flex-wrap gap-1">
                                  {message.sources.map((source, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {source}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {isSending && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-sm text-gray-500">Dom AI is typing...</span>
                          </div>
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

        <div className="p-4 bg-yellow-50 border-t border-yellow-200">
          <div className="flex gap-2">
            {currentConversation && (
              <Button
                variant="outline"
                onClick={() => setViewMode('questions')}
                className="bg-white border-yellow-300 text-yellow-800 hover:bg-yellow-50 hover:border-yellow-400"
                disabled={isSending}
              >
                Quick Questions
              </Button>
            )}
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about home buying..."
              disabled={isSending}
              className="flex-1 bg-white border-yellow-300 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-yellow-500 focus:ring-yellow-500"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isSending}
              className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500 disabled:bg-gray-300 disabled:text-gray-500"
            >
              <Send size={16} />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotInterface;
