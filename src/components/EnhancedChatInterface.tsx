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
      text: "Hi! I'm your AI real estate assistant. I can help you with listing searches, home buying questions, or market insights. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(Date.now() - 10000)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const questionCategories = {
    listing: {
      icon: Home,
      title: "Listing Questions",
      color: "bg-blue-50 text-blue-700 border-blue-200",
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
      color: "bg-green-50 text-green-700 border-green-200",
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
      color: "bg-purple-50 text-purple-700 border-purple-200",
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
    if (messageText.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        text: messageText,
        sender: 'user',
        timestamp: new Date(),
        category: selectedCategory || undefined
      };
      setMessages([...messages, newMessage]);
      setInputText('');

      // Simulate AI response based on category
      setTimeout(() => {
        let aiResponse = "I understand your question. Let me help you with that.";
        
        if (selectedCategory === 'listing') {
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
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8ECF2] via-white to-[#F47C6D]/10">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button onClick={onBack} variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
              <ArrowLeft size={18} />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[#3B4A6B] to-[#57C6A8] rounded-xl flex items-center justify-center shadow-lg">
                <Bot className="text-white" size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full shadow-sm"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {/* Question Categories */}
        {!selectedCategory && messages.length <= 1 && (
          <div className="space-y-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-900">What can I help you with?</h3>
            <div className="grid gap-4 md:grid-cols-3">
              {Object.entries(questionCategories).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <Card 
                    key={key} 
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 border border-gray-200 bg-white/80 backdrop-blur-sm hover:scale-105"
                    onClick={() => setSelectedCategory(key)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                        <div className={`p-3 rounded-xl border ${category.color} shadow-md`}>
                          <IconComponent size={24} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{category.title}</h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {category.questions[0]}...
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
          <div className="space-y-6 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                {questionCategories[selectedCategory].title}
              </h3>
              <Button 
                onClick={() => setSelectedCategory(null)} 
                variant="outline" 
                size="sm"
                className="shadow-sm"
              >
                Back
              </Button>
            </div>
            <div className="grid gap-3">
              {questionCategories[selectedCategory].questions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left justify-start h-auto py-4 px-5 text-sm font-normal shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6 mb-8">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-lg ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-[#3B4A6B] to-[#57C6A8] text-white'
                    : 'bg-white/90 backdrop-blur-sm text-gray-900 border border-gray-200'
                }`}
              >
                {message.category && (
                  <Badge className={`mb-3 text-xs px-2 py-1 shadow-sm ${questionCategories[message.category].color}`}>
                    {questionCategories[message.category].title}
                  </Badge>
                )}
                <p className="text-sm leading-relaxed">{message.text}</p>
                <p className={`text-xs mt-2 ${
                  message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200/50 shadow-2xl">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center space-x-3 bg-white rounded-2xl shadow-lg border border-gray-200 p-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything about real estate..."
              className="flex-1 border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-700 placeholder:text-gray-500"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 p-2">
              <Mic size={18} />
            </Button>
            <Button 
              onClick={() => sendMessage()}
              disabled={!inputText.trim()}
              size="sm"
              className="bg-gradient-to-r from-[#3B4A6B] to-[#57C6A8] hover:from-[#3B4A6B]/90 hover:to-[#57C6A8]/90 text-white shadow-md px-4 py-2"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;
