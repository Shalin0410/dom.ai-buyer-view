import { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft, Home, DollarSign, FileText, Mic, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { answerQuestion } from '@/services/chatbot';
import { useNotionIntegration } from '@/hooks/useNotionIntegration';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  category?: string;
  sources?: string[];
}

interface EnhancedChatInterfaceProps {
  onBack: () => void;
}

const EnhancedChatInterface = ({ onBack }: EnhancedChatInterfaceProps) => {
  // Initialize Notion integration hook
  useNotionIntegration();
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: "Hi! I'm Dom AI, your home buying assistant. I can help you understand the home buying process, from getting pre-approved for a mortgage to closing on your new home. What questions do you have about buying a home?",
      sender: 'bot',
      timestamp: new Date(Date.now() - 600000)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(2);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout for auto-response
    if (value.trim() && value.length > 10 && !isProcessing) {
      const newTimeout = setTimeout(() => {
        if (!isProcessing) {
          triggerAutoResponse(value, true);
        }
      }, 2000);
      setTypingTimeout(newTimeout);
    }
  };

  const triggerAutoResponse = async (userInput: string, fromTimeout: boolean = false) => {
    // Prevent duplicate processing
    if (isProcessing) {
      return;
    }

    setIsProcessing(true);

    // Clear any pending timeouts
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }

    const userMessageId = `user-${messageIdCounter.current++}`;
    const botMessageId = `bot-${messageIdCounter.current++}`;

    const newMessage: Message = {
      id: userMessageId,
      text: userInput,
      sender: 'user',
      timestamp: new Date(),
      category: selectedCategory || undefined
    };

    setMessages(prev => [...prev, newMessage]);
    
    if (fromTimeout) {
      setInputText('');
    }

    setIsTyping(true);

    try {
      // 1) Retrieve local context (buyer-only) for grounding
      const { retrieveContext } = await import('@/services/chatbot');
      const context = await retrieveContext(userInput, { maxDocs: 3 });

      // 2) Try calling server (ChatGPT) with strict scope
      let serverAnswer: string | null = null;
      try {
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: userInput, context }),
        });
        if (resp.ok) {
          const json = await resp.json();
          serverAnswer = json.answer || null;
        }
      } catch {}

      let finalAnswer = serverAnswer;
      let sources: string[] = context.map(c => c.title);

      // 3) Fallback to local retrieval-only answer if server failed
      if (!finalAnswer) {
        const result = await answerQuestion(userInput);
        finalAnswer = result.answer;
        if (result.sources?.length) sources = result.sources;
      }

      const aiMessage: Message = {
        id: botMessageId,
        text: finalAnswer ?? "I'm not sure based on the available information. Could you rephrase or ask your agent for help?",
        sender: 'bot',
        timestamp: new Date(),
        sources
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: botMessageId,
        text: "I'm sorry, I encountered an error while processing your question. Please try again or rephrase your question.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const questionCategories = {
    getting_started: {
      icon: DollarSign,
      title: "Getting Started & Finances",
      questions: [
        "How do I get pre-approved for a mortgage?",
        "What's the difference between pre-qualification and pre-approval?",
        "How much should I save for a down payment?",
        "What are closing costs and how much should I expect?"
      ]
    },
    home_search: {
      icon: Home,
      title: "Finding Your Home",
      questions: [
        "How do I find the right real estate agent?",
        "What should I look for during property viewings?",
        "How do I evaluate different neighborhoods?",
        "What are red flags to watch for when viewing homes?"
      ]
    },
    offers_closing: {
      icon: FileText,
      title: "Offers & Closing Process",
      questions: [
        "How do I make a competitive offer?",
        "What happens during a home inspection?",
        "What is the appraisal process?",
        "What should I expect at closing?"
      ]
    }
  };

  const sendMessage = (text?: string) => {
    const messageText = text || inputText;
    if (messageText.trim() && !isProcessing) {
      triggerAutoResponse(messageText);
      setInputText('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Dom AI Assistant</h1>
              <p className="text-sm text-gray-600">Your home buying guide and advisor</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 pb-32">
          {/* Question Categories */}
          {!selectedCategory && messages.length <= 1 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">What can I help you with?</h3>
              <div className="grid gap-3 md:grid-cols-3">
                {Object.entries(questionCategories).map(([key, category]) => {
                  const IconComponent = category.icon;
                  return (
                    <Card 
                      key={key} 
                      className="cursor-pointer hover:shadow-md transition-shadow border border-gray-200"
                      onClick={() => setSelectedCategory(key)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-gray-50">
                            <IconComponent size={20} className="text-gray-700" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">{category.title}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {category.questions.length} questions
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Category Questions */}
          {selectedCategory && messages.length <= 1 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {questionCategories[selectedCategory].title}
                </h3>
                <Button 
                  onClick={() => setSelectedCategory(null)} 
                  variant="outline" 
                  size="sm"
                >
                  Back
                </Button>
              </div>
              <div className="space-y-2">
                {questionCategories[selectedCategory].questions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full text-left justify-start h-auto py-3 px-4 font-normal border-gray-200 hover:bg-gray-50"
                    onClick={() => sendMessage(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[80%]">
                  {message.sender === 'bot' && (
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bot size={14} className="text-gray-600" />
                      </div>
                      <span className="text-xs text-gray-500">Dom AI</span>
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.sender === 'user'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}
                  >
                    {message.category && (
                      <Badge className="mb-2 text-xs bg-gray-100 text-gray-700 border-gray-200">
                        {questionCategories[message.category].title}
                      </Badge>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Sources:</p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 px-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[80%]">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <Bot size={14} className="text-gray-600" />
                    </div>
                    <span className="text-xs text-gray-500">Dom AI</span>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">Typing...</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto p-4">
            <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
              <Input
                value={inputText}
                onChange={handleInputChange}
                placeholder="Ask about home buying, mortgages, inspections, offers..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700 placeholder:text-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-2">
                <Mic size={18} />
              </Button>
              <Button 
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || isProcessing}
                size="sm"
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
