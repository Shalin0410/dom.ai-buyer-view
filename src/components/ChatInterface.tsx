
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi Sarah! I'm your AI real estate assistant. I can help you find properties, answer questions about the buying process, or provide market insights. What would you like to know?",
      sender: 'bot',
      timestamp: new Date(Date.now() - 10000)
    }
  ]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (inputText.trim()) {
      const newMessage = {
        id: messages.length + 1,
        text: inputText,
        sender: 'user',
        timestamp: new Date()
      };
      setMessages([...messages, newMessage]);
      setInputText('');

      // Simulate AI response
      setTimeout(() => {
        const aiResponse = {
          id: messages.length + 2,
          text: "I understand you're looking for information about home buying. Based on your preferences for a 3-bedroom house in Austin under $500k, I found 12 properties that match your criteria. Would you like me to show you the top 3 matches with the highest fit scores?",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
  };

  const quickActions = [
    "Show me homes under $500k",
    "What's the market like?",
    "Schedule a viewing",
    "Explain closing costs"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      {/* Chat Header */}
      <div className="bg-white rounded-lg p-4 mb-4 shadow-sm">
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
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

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-left justify-start h-auto py-2 px-3"
                onClick={() => setInputText(action)}
              >
                {action}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="text-gray-500">
            <Paperclip size={20} />
          </Button>
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask me anything about real estate..."
            className="flex-1 border-0 focus-visible:ring-0"
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button variant="ghost" size="sm" className="text-gray-500">
            <Mic size={20} />
          </Button>
          <Button 
            onClick={sendMessage}
            disabled={!inputText.trim()}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
