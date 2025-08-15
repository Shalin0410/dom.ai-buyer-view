// src/components/ChatbotTest.tsx
// Simple test component to verify chatbot functionality
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { sendChatMessage } from '@/services/chatbot/openai';

const ChatbotTest = () => {
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTest = async () => {
    if (!inputText.trim()) return;
    
    setIsLoading(true);
    setError('');
    setResponse('');
    
    try {
      console.log('[Test] Sending message:', inputText);
      const result = await sendChatMessage(inputText);
      console.log('[Test] Received response:', result);
      setResponse(result.message);
    } catch (err) {
      console.error('[Test] Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <CardContent className="space-y-4">
        <h2 className="text-xl font-semibold">Chatbot Test</h2>
        <p className="text-sm text-gray-600">
          This tests the chatbot functionality without database dependencies.
        </p>
        
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question about home buying..."
            onKeyPress={(e) => e.key === 'Enter' && handleTest()}
          />
          <Button 
            onClick={handleTest} 
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? 'Testing...' : 'Test'}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700">
            <strong>Error:</strong> {error}
          </div>
        )}

        {response && (
          <div className="p-3 bg-green-50 border border-green-200 rounded">
            <strong>Response:</strong>
            <p className="mt-2 whitespace-pre-wrap">{response}</p>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <p>Test questions to try:</p>
          <ul className="list-disc list-inside mt-1">
            <li>"What is a mortgage pre-approval?"</li>
            <li>"How long does the home buying process take?"</li>
            <li>"What is escrow?"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotTest;
