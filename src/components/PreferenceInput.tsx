
import { useState, useRef } from 'react';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface PreferenceInputProps {
  onComplete: (preferences: string) => void;
}

const PreferenceInput = ({ onComplete }: PreferenceInputProps) => {
  const [preferences, setPreferences] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Mock voice input - in real app this would use speech recognition
      const mockVoiceInput = "My husband and I are buying a home for the first time. We prefer to live in the city, however we are family planning and anticipate kids to be at school going age in 5-7 years. We get a lot of visitors, so 3 bedrooms and 2 bath is a must. We also really enjoy trying out new restaurants. We commute to work in San Mateo and Palo Alto so we need to be close to the CalTrain and freeway. We have a dog, and we need a private backyard.";
      setPreferences(mockVoiceInput);
    } else {
      setIsRecording(true);
    }
  };

  const handleSubmit = () => {
    if (preferences.trim()) {
      setIsProcessing(true);
      // Simulate processing time
      setTimeout(() => {
        onComplete(preferences);
      }, 2000);
    }
  };

  const examplePreferences = [
    "First-time buyer, city living",
    "Family planning, good schools",
    "Pet-friendly with backyard",
    "Close to public transport"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50 p-4">
      <div className="max-w-lg mx-auto pt-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl font-bold text-gray-900">
              Tell us about your dream home
            </CardTitle>
            <p className="text-gray-600">
              Use voice or text to describe what you're looking for. Be as detailed as you'd like!
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Common preferences:</p>
              <div className="flex flex-wrap gap-2">
                {examplePreferences.map((pref, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {pref}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Example: My husband and I are buying a home for the first time. We prefer to live in the city, however we are family planning and anticipate kids to be at school going age in 5-7 years..."
                className="min-h-[120px] pr-12"
                disabled={isRecording}
              />
              <Button
                type="button"
                onClick={toggleRecording}
                className={`absolute bottom-3 right-3 w-8 h-8 p-0 ${
                  isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={isProcessing}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
              </Button>
            </div>

            {isRecording && (
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm">Recording... Tap mic to stop</span>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!preferences.trim() || isProcessing}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating your profile...</span>
                </div>
              ) : (
                <>
                  <MessageSquare size={16} className="mr-2" />
                  Continue
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreferenceInput;
