
import { useState, useRef } from 'react';
import { Mic, MicOff, MessageSquare, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import PreferenceSuccess from '@/components/PreferenceSuccess';

interface PreferenceInputProps {
  onComplete: (preferences: string, realtorInfo?: any) => void;
}

const PreferenceInput = ({ onComplete }: PreferenceInputProps) => {
  const [preferences, setPreferences] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showRealtorForm, setShowRealtorForm] = useState(false);
  const [realtorInfo, setRealtorInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      const mockVoiceInput = "My husband and I are buying a home for the first time. We prefer to live in the city, however we are family planning and anticipate kids to be at school going age in 5-7 years. We get a lot of visitors, so 3 bedrooms and 2 bath is a must. We also really enjoy trying out new restaurants. We commute to work in San Mateo and Palo Alto so we need to be close to the CalTrain and freeway. We have a dog, and we need a private backyard.";
      setPreferences(mockVoiceInput);
    } else {
      setIsRecording(true);
    }
  };

  const handleSubmit = () => {
    if (preferences.trim()) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setShowSuccess(true);
      }, 2000);
    }
  };

  const handleSuccessComplete = () => {
    onComplete(preferences, showRealtorForm ? realtorInfo : undefined);
  };

  if (showSuccess) {
    return <PreferenceSuccess onComplete={handleSuccessComplete} />;
  }

  const examplePreferences = [
    "First-time buyer, city living",
    "Family planning, good schools",
    "Pet-friendly with backyard",
    "Close to public transport"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-lg mx-auto p-6 pt-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tell us about your dream home</h1>
          <p className="text-gray-600">Share your preferences and we'll create your perfect profile</p>
        </div>

        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/90">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Popular preferences:</p>
              <div className="flex flex-wrap gap-2">
                {examplePreferences.map((pref, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">
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
                className="min-h-[140px] pr-14 border-gray-200 focus:border-blue-400 focus:ring-blue-400 resize-none placeholder:text-[#E8ECF2]"
                disabled={isRecording}
              />
              <Button
                type="button"
                onClick={toggleRecording}
                className={`absolute bottom-4 right-4 w-10 h-10 p-0 rounded-full shadow-lg ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                disabled={isProcessing}
              >
                {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              </Button>
            </div>

            {isRecording && (
              <div className="flex items-center justify-center space-x-3 text-red-600 bg-red-50 rounded-lg p-3">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Recording... Tap mic to stop</span>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium text-gray-700">Realtor Information (Optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowRealtorForm(!showRealtorForm)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Users size={16} className="mr-1" />
                  {showRealtorForm ? 'Hide' : 'Add Realtor'}
                </Button>
              </div>

              {showRealtorForm && (
                <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                  <div>
                    <Label htmlFor="realtor-name" className="text-xs text-gray-600">Realtor Name</Label>
                    <Input
                      id="realtor-name"
                      value={realtorInfo.name}
                      onChange={(e) => setRealtorInfo({...realtorInfo, name: e.target.value})}
                      placeholder="John Smith"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="realtor-email" className="text-xs text-gray-600">Email</Label>
                    <Input
                      id="realtor-email"
                      type="email"
                      value={realtorInfo.email}
                      onChange={(e) => setRealtorInfo({...realtorInfo, email: e.target.value})}
                      placeholder="john@realty.com"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="realtor-phone" className="text-xs text-gray-600">Phone</Label>
                    <Input
                      id="realtor-phone"
                      value={realtorInfo.phone}
                      onChange={(e) => setRealtorInfo({...realtorInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!preferences.trim() || isProcessing}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-medium shadow-lg"
            >
              {isProcessing ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating your profile...</span>
                </div>
              ) : (
                <>
                  <MessageSquare size={18} className="mr-2" />
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
