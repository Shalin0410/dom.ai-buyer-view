import { useState } from 'react';
import { VoiceRecorder, type ExtractedPreferences } from './VoiceRecorder';
import { PreferenceConfirmation } from './PreferenceConfirmation';
import { Button } from './ui/button';
import { Keyboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceProcessingResult {
  success: boolean;
  transcript: string;
  preferences: ExtractedPreferences;
  confidence: number;
  mandatoryFieldsCaptured: number;
  totalMandatoryFields: number;
}

interface VoicePreferenceInputProps {
  onComplete: (preferences: ExtractedPreferences) => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

type ViewState = 'recording' | 'confirmation' | 'completed';

export const VoicePreferenceInput = ({
  onComplete,
  onSkip,
  showSkipOption = true
}: VoicePreferenceInputProps) => {
  const [viewState, setViewState] = useState<ViewState>('recording');
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const { toast } = useToast();

  const handleRecordingComplete = (result: VoiceProcessingResult) => {
    console.log('Recording completed:', result);
    setProcessingResult(result);
    setViewState('confirmation');

    // Show success toast
    toast({
      title: 'Voice recorded successfully!',
      description: `We captured ${result.mandatoryFieldsCaptured} out of ${result.totalMandatoryFields} key details.`,
      duration: 3000,
    });
  };

  const handleRecordingError = (error: string) => {
    console.error('Recording error:', error);
    toast({
      title: 'Recording failed',
      description: error,
      variant: 'destructive',
      duration: 5000,
    });
  };

  const handleConfirmPreferences = async (preferences: ExtractedPreferences) => {
    try {
      console.log('Confirming preferences:', preferences);

      // Call parent completion handler
      onComplete(preferences);

      setViewState('completed');

      toast({
        title: 'Preferences saved!',
        description: 'Your home search preferences have been saved successfully.',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save your preferences. Please try again.',
        variant: 'destructive',
        duration: 5000,
      });
    }
  };

  const handleReRecord = () => {
    setProcessingResult(null);
    setViewState('recording');

    toast({
      title: 'Ready to record again',
      description: 'Take your time and speak clearly about your preferences.',
      duration: 2000,
    });
  };

  if (viewState === 'completed') {
    return (
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold mb-2">All set!</h3>
        <p className="text-gray-600">
          Your preferences have been saved and your agent can now start finding perfect homes for you.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold mb-2">Let's Find Your Dream Home</h2>
        <p className="text-gray-600">
          Tell us what you're looking for - we'll take care of the rest
        </p>
      </div>

      {/* Main Content */}
      {viewState === 'recording' && (
        <>
          <VoiceRecorder
            onComplete={handleRecordingComplete}
            onError={handleRecordingError}
          />

          {/* Alternative Options */}
          <div className="mt-8 flex flex-col items-center space-y-4">
            <div className="text-sm text-gray-500">
              Prefer not to record?
            </div>
            <div className="flex space-x-3">
              {showSkipOption && onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="text-sm"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Fill out form instead
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {viewState === 'confirmation' && processingResult && (
        <PreferenceConfirmation
          preferences={processingResult.preferences}
          transcript={processingResult.transcript}
          confidence={processingResult.confidence}
          mandatoryFieldsCaptured={processingResult.mandatoryFieldsCaptured}
          totalMandatoryFields={processingResult.totalMandatoryFields}
          onConfirm={handleConfirmPreferences}
          onReRecord={handleReRecord}
        />
      )}
    </div>
  );
};
