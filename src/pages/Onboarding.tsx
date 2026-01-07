import { useNavigate } from 'react-router-dom';
import { VoicePreferenceInput } from '@/components/VoicePreferenceInput';
import { ExtractedPreferences } from '@/components/VoiceRecorder';
import { useToast } from '@/hooks/use-toast';
import { Grid2X2, Search, MessageSquare, User } from 'lucide-react';

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
    <>
      {/* Fixed Header Navigation */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-lg sm:text-xl">
              D
            </div>
            <div className="text-lg sm:text-xl font-semibold text-gray-900">Dom AI</div>
          </div>
          <nav className="flex items-center gap-3 sm:gap-6">
            <a href="#dashboard" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Grid2X2 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </a>
            <a href="#search" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search</span>
            </a>
            <a href="#messages" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Messages</span>
            </a>
            <a href="#profile" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="min-h-screen bg-white py-20 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <VoicePreferenceInput
            onComplete={handlePreferencesComplete}
            onSkip={handleSkipOnboarding}
            showSkipOption={true}
          />
        </div>
      </div>
    </>
  );
};

export default Onboarding;
