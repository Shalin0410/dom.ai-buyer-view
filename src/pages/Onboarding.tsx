import { useNavigate } from 'react-router-dom';
import { VoicePreferenceInput } from '@/components/VoicePreferenceInput';
import { ExtractedPreferences } from '@/components/VoiceRecorder';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handlePreferencesComplete = async (preferences: ExtractedPreferences) => {
    console.log('Preferences completed:', preferences);

    // Show success message
    toast({
      title: 'Welcome aboard! 🎉',
      description: 'Your preferences have been saved. Redirecting to your dashboard...',
      duration: 3000,
    });

    // Redirect to main app after a short delay
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  const handleSkipOnboarding = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8ECF2] via-white to-[#F47C6D]/10 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-3xl">🏠</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2">Welcome to Dom.ai</h1>
          <p className="text-xl text-gray-600">
            Let's find your perfect home
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="p-6 shadow-xl">
          <VoicePreferenceInput
            onComplete={handlePreferencesComplete}
            onSkip={handleSkipOnboarding}
            showSkipOption={true}
          />
        </Card>

        {/* Skip Option */}
        <div className="mt-6 text-center">
          <Button
            variant="ghost"
            onClick={handleSkipOnboarding}
            className="text-gray-500 hover:text-gray-700"
          >
            Skip for now and go to dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Contact your agent
          </p>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
