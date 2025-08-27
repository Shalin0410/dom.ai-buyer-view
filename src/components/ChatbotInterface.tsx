// src/components/ChatbotInterface.tsx
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Plus, MessageSquare, Trash2, Archive, Edit3, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChatbot } from '@/hooks/useChatbot';
import { useNotionIntegration } from '@/hooks/useNotionIntegration';
import { formatDistanceToNow } from 'date-fns';
// import { QuestionSelection, QuestionCategory } from './QuestionSelection';
// import { CategoryQuestions } from './CategoryQuestions';

// type ViewMode = 'questions' | 'category' | 'chat';
type ViewMode = 'chat';

// Function to parse markdown formatting with link support
const parseMarkdown = (text: string, linkCitations: Array<{ text: string; url: string }> = []) => {
  // First, extract links and replace them with placeholders
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const links: Array<{ text: string; url: string }> = [];
  let linkIndex = 0;
  
  const textWithPlaceholders = text.replace(linkRegex, (match, linkText, linkUrl) => {
    links.push({ text: linkText, url: linkUrl });
    return `__LINK_${linkIndex++}__`;
  });
  
  // Split text into parts (text and markdown elements)
  const parts = textWithPlaceholders.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, index) => {
    // Check if this part is a link placeholder - replace with numbered citation
    const linkMatch = part.match(/__LINK_(\d+)__/);
    if (linkMatch) {
      const linkIndex = parseInt(linkMatch[1]);
      const link = links[linkIndex];
      
      // Find the citation number for this link
      const citationIndex = linkCitations.findIndex(citation => 
        citation.url === link.url || citation.text === link.text
      );
      
             if (citationIndex !== -1) {
         return (
           <span key={index} className="inline-flex items-center">
             <span className="text-xs text-gray-600 align-sub">
               [{citationIndex + 1}]
             </span>
           </span>
         );
       }
      
      // Fallback if citation not found
      return (
        <span key={index} className="font-medium text-gray-700">
          {link.text}
        </span>
      );
    }
    
    // Check if this part is bold text (wrapped in **)
    if (part.startsWith('**') && part.endsWith('**')) {
      const boldText = part.slice(2, -2); // Remove ** markers
      return (
        <span key={index} className="font-semibold">
          {boldText}
        </span>
      );
    }
    
    // Check for numbered lists (lines starting with number and period)
    if (/^\d+\.\s/.test(part)) {
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1">
          {lines.map((line, lineIndex) => {
            if (/^\d+\.\s/.test(line)) {
              const [number, ...content] = line.split('. ');
              return (
                <div key={lineIndex} className="flex gap-2">
                  <span className="font-semibold text-gray-700 min-w-[20px]">{number}.</span>
                  <span>{content.join('. ')}</span>
                </div>
              );
            }
            return <span key={lineIndex}>{line}</span>;
          })}
        </div>
      );
    }
    
    // Check for bullet points (lines starting with - or *)
    if (/^[-*]\s/.test(part)) {
      const lines = part.split('\n');
      return (
        <div key={index} className="space-y-1">
          {lines.map((line, lineIndex) => {
            if (/^[-*]\s/.test(line)) {
              const content = line.substring(2);
              return (
                <div key={lineIndex} className="flex gap-2">
                  <span className="text-gray-700 min-w-[20px]">•</span>
                  <span>{content}</span>
                </div>
              );
            }
            return <span key={lineIndex}>{line}</span>;
          })}
        </div>
      );
    }
    
    // Regular text
    return <span key={index}>{part}</span>;
  });
};

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
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  // const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | null>(null);
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

  return (
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
                        className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
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
                        <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`p-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-100 border border-gray-200 text-gray-900'
                            }`}
                          >
                                                         <div className="whitespace-pre-wrap">
                               {message.role === 'user' ? message.content : (() => {
                                 // Extract links from the message content for citations
                                 const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                                 const textLinks: Array<{ text: string; url: string }> = [];
                                 let match;
                                 
                                 while ((match = linkRegex.exec(message.content)) !== null) {
                                   textLinks.push({
                                     text: match[1],
                                     url: match[2]
                                   });
                                 }
                                 
                                 // Combine sources from API and links from text, removing duplicates
                                 const allSources: Array<{ title: string; url?: string; sourceType?: string }> = [...(message.sources || [])];
                                 
                                 textLinks.forEach(textLink => {
                                   // Check if this link is already in sources (by URL)
                                   const isDuplicate = allSources.some(source => 
                                     source.url === textLink.url || 
                                     source.title === textLink.title
                                   );
                                   
                                   if (!isDuplicate) {
                                     allSources.push({
                                       title: textLink.title,
                                       url: textLink.url,
                                       sourceType: 'online'
                                     });
                                   }
                                 });
                                 
                                 // Create citation array for parseMarkdown
                                 const linkCitations = allSources
                                   .filter(source => source.url)
                                   .map(source => ({
                                     text: source.title || '',
                                     url: source.url || ''
                                   }));
                                 
                                 return parseMarkdown(message.content, linkCitations);
                               })()}
                             </div>
                            
                                                         {(() => {
                               // Extract links from the message content
                               const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
                               const textLinks: Array<{ title: string; url: string }> = [];
                               let match;
                               
                               while ((match = linkRegex.exec(message.content)) !== null) {
                                 textLinks.push({
                                   title: match[1],
                                   url: match[2]
                                 });
                               }
                               
                               // Combine sources from API and links from text, removing duplicates
                               const allSources: Array<{ title: string; url?: string; sourceType?: string }> = [...(message.sources || [])];
                               
                               textLinks.forEach(textLink => {
                                 // Check if this link is already in sources (by URL)
                                 const isDuplicate = allSources.some(source => 
                                   source.url === textLink.url || 
                                   source.title === textLink.title
                                 );
                                 
                                 if (!isDuplicate) {
                                   allSources.push({
                                     title: textLink.title,
                                     url: textLink.url,
                                     sourceType: 'online'
                                   });
                                 }
                               });
                               
                               // Only show sources section if there are sources with URLs
                               if (allSources.length > 0 && allSources.some(source => source.url)) {
                                 return (
                                   <div className="mt-3 pt-3 border-t border-gray-200">
                                     <p className="text-xs font-medium text-gray-700 mb-2">Sources:</p>
                                     <div className="space-y-1">
                                       {allSources.filter(source => source.url).map((source, index) => (
                                         <div key={`${message.id}-source-${index}`} className="flex items-start gap-2">
                                           <span className="text-xs font-semibold text-gray-600 min-w-[16px] mt-0.5">
                                             {index + 1}.
                                           </span>
                                           <a
                                             href={source.url}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                             className="text-xs text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 flex-1"
                                           >
                                             <span className="truncate">{source.title}</span>
                                             <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                             </svg>
                                           </a>
                                         </div>
                                       ))}
                                     </div>
                                   </div>
                                 );
                               }
                               
                               return null;
                             })()}
                          </div>
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
    </div>
  );
};

export default ChatbotInterface;