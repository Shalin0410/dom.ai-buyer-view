
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
      color: "bg-blue-100 text-blue-800",
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
      color: "bg-green-100 text-green-800",
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
      color: "bg-purple-100 text-purple-800",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <Button onClick={onBack} variant="ghost" size="sm" className="p-2">
              <ArrowLeft size={20} />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Question Categories */}
        {!selectedCategory && messages.length <= 1 && (
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">What can I help you with?</h3>
            <div className="grid gap-3">
              {Object.entries(questionCategories).map(([key, category]) => {
                const IconComponent = category.icon;
                return (
                  <Card 
                    key={key} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedCategory(key)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${category.color}`}>
                          <IconComponent size={20} />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{category.title}</h4>
                          <p className="text-sm text-gray-600">
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
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {questionCategories[selectedCategory].title}
              </h3>
              <Button 
                onClick={() => setSelectedCategory(null)} 
                variant="ghost" 
                size="sm"
              >
                Back
              </Button>
            </div>
            <div className="grid gap-2">
              {questionCategories[selectedCategory].questions.map((question, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left justify-start h-auto py-3 px-4"
                  onClick={() => sendMessage(question)}
                >
                  {question}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border'
                }`}
              >
                {message.category && (
                  <Badge className={`mb-2 ${questionCategories[message.category].color}`}>
                    {questionCategories[message.category].title}
                  </Badge>
                )}
                <p className="text-sm">{message.text}</p>
                <p className={`text-xs mt-1 ${
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-lg mx-auto p-4">
          <div className="flex items-center space-x-2">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything about real estate..."
              className="flex-1"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Mic size={20} />
            </Button>
            <Button 
              onClick={() => sendMessage()}
              disabled={!inputText.trim()}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
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
