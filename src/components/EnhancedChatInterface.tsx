import { useState, useRef, useEffect } from 'react';
import { Send, Bot, ArrowLeft, Home, HelpCircle, TrendingUp, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  category?: string;
}

interface EnhancedChatInterfaceProps {
  onBack: () => void;
}

const EnhancedChatInterface = ({ onBack }: EnhancedChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm Dom AI, your real estate assistant. I can help you with listing searches, home buying questions, or market insights. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(Date.now() - 600000)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [hasTriggeredAutoResponse, setHasTriggeredAutoResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputText(value);
    setHasTriggeredAutoResponse(false);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (value.trim() && value.length > 10) {
      const newTimeout = setTimeout(() => {
        if (!hasTriggeredAutoResponse) {
          triggerAutoResponse(value, true);
          setHasTriggeredAutoResponse(true);
        }
      }, 2000);
      setTypingTimeout(newTimeout);
    }
  };

  const triggerAutoResponse = (userInput: string, fromTimeout: boolean = false) => {
    const newMessage: Message = {
      id: messages.length + 1,
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

    setTimeout(() => {
      let aiResponse = "I understand your question. Let me help you with that.";
      
      const lowerInput = userInput.toLowerCase();
      
      if (lowerInput.includes('visit') || lowerInput.includes('looking for') || lowerInput.includes('what should')) {
        aiResponse = "Look for more than just finishes—notice how the space flows, how much natural light it gets, and any signs of wear or needed repairs. Think about practical details too: parking, storage, noise levels, and whether the layout works for your day-to-day.";
      } else if (lowerInput.includes('price') || lowerInput.includes('fairly') || lowerInput.includes('cost')) {
        aiResponse = "A good starting point is looking at recent sales of similar homes in the area—called comps. Days on market can also be a clue. If you want, I can pull some recent comps for a specific address so you can compare.";
      } else if (lowerInput.includes('neighborhood') || lowerInput.includes('value') || lowerInput.includes('investment')) {
        aiResponse = "That's a great question—and a tricky one. I can't predict future market trends, but your agent might have insights based on development plans, school ratings, or recent demand shifts in the area. Want me to flag this for them to follow up?";
      } else if (lowerInput.includes('yes') || lowerInput.includes('sure') || lowerInput.includes('ok')) {
        aiResponse = "Great, Kelsey's been messaged!";
      } else if (selectedCategory === 'listing') {
        aiResponse = "I found 12 properties matching your criteria. Here are the top 3 matches with the highest fit scores. Would you like me to show you these properties in your main feed?";
      } else if (selectedCategory === 'process') {
        aiResponse = "The home buying process typically involves: 1) Getting pre-approved for a mortgage, 2) Finding a real estate agent, 3) House hunting, 4) Making an offer, 5) Home inspection, 6) Finalizing financing, and 7) Closing. Each step is important for a successful purchase.";
      } else if (selectedCategory === 'market') {
        aiResponse = "Based on current market data for San Francisco: Average home price is $1.4M (up 2.3% from last quarter), average interest rates are at 7.2%, and inventory is at a 3-month supply. It's a competitive but stable market for qualified buyers.";
      }

      const aiMessage: Message = {
        id: messages.length + 2,
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const questionCategories = {
    listing: {
      icon: Home,
      title: "Listing Questions",
      questions: [
        "Show me listings in zipcode 94107",
        "Show me listings on the market for over 30 days",
        "Find homes with private backyards",
        "Properties near CalTrain stations"
      ]
    },
    process: {
      icon: HelpCircle,
      title: "Home Buying Process",
      questions: [
        "What is the home buying process?",
        "Who are the key stakeholders?",
        "What roles do title company vs lender play?",
        "Should I even buy right now?"
      ]
    },
    market: {
      icon: TrendingUp,
      title: "Market Insights",
      questions: [
        "Recent market trends in San Francisco",
        "What is the average interest rate?",
        "Average price of homes in Palo Alto",
        "Best time to buy in current market?"
      ]
    }
  };

  const sendMessage = (text?: string) => {
    const messageText = text || inputText;
    if (messageText.trim() && !hasTriggeredAutoResponse) {
      triggerAutoResponse(messageText);
      setInputText('');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 z-10">
          <h1 className="text-xl font-semibold text-gray-900">Chat Assistant</h1>
          <p className="text-sm text-gray-600">Ask me anything about real estate</p>
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
                    <p className="text-sm leading-relaxed">{message.text}</p>
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
                placeholder="Type your message..."
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700 placeholder:text-gray-500"
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-2">
                <Mic size={18} />
              </Button>
              <Button 
                onClick={() => sendMessage()}
                disabled={!inputText.trim()}
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
