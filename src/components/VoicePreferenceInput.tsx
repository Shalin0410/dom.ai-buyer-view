import { useState } from 'react';
import { VoiceRecorder, type ExtractedPreferences } from './VoiceRecorder';
import { PreferenceConfirmation } from './PreferenceConfirmation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface PreferenceChange {
  field: string;
  old: any;
  new: any;
  recording: number;
}

interface VoiceProcessingResult {
  success: boolean;
  transcript: string;
  preferences: ExtractedPreferences;
  rawPreferences?: ExtractedPreferences;
  confidence: number;
  mandatoryFieldsCaptured: number;
  totalMandatoryFields: number;
  recordingNumber?: number;
  isFirstRecording?: boolean;
  changesDetected?: number;
  changes?: PreferenceChange[];
}

interface VoicePreferenceInputProps {
  onComplete: (preferences: ExtractedPreferences) => void;
  onSkip?: () => void;
  showSkipOption?: boolean;
}

type ViewState = 'recording' | 'missing-fields' | 'confirmation' | 'completed';

export const VoicePreferenceInput = ({
  onComplete,
  onSkip,
  showSkipOption = true
}: VoicePreferenceInputProps) => {
  const [viewState, setViewState] = useState<ViewState>('recording');
  const [processingResult, setProcessingResult] = useState<VoiceProcessingResult | null>(null);
  const [editedPreferences, setEditedPreferences] = useState<ExtractedPreferences | null>(null);
  const { toast } = useToast();

  const handleRecordingComplete = (result: VoiceProcessingResult) => {
    console.log('Recording completed:', result);
    setProcessingResult(result);
    setEditedPreferences(result.preferences);

    // Check if mandatory fields are missing
    const hasMissingFields =
      !result.preferences.bedrooms ||
      !result.preferences.bathrooms ||
      !result.preferences.price_max ||
      !result.preferences.preferred_areas ||
      result.preferences.preferred_areas.length === 0;

    if (hasMissingFields) {
      // Go to missing fields page first
      setViewState('missing-fields');
      toast({
        title: 'Almost there!',
        description: 'We need a few more details to complete your profile.',
        duration: 3000,
      });
    } else {
      // All fields present, go directly to confirmation
      setViewState('confirmation');

      const isUpdate = !result.isFirstRecording;
      const changesMsg = result.changesDetected
        ? ` We detected ${result.changesDetected} change${result.changesDetected > 1 ? 's' : ''}.`
        : '';

      toast({
        title: isUpdate ? 'Preferences updated!' : 'Voice recorded successfully!',
        description: `We captured ${result.mandatoryFieldsCaptured} out of ${result.totalMandatoryFields} key details.${changesMsg}`,
        duration: 3000,
      });
    }
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
    setEditedPreferences(null);
    setViewState('recording');

    toast({
      title: 'Ready to record again',
      description: 'Take your time and speak clearly about your preferences.',
      duration: 2000,
    });
  };

  const handleMissingFieldsComplete = () => {
    if (!editedPreferences) return;

    // Validate all mandatory fields are now filled
    if (!editedPreferences.bedrooms || !editedPreferences.bathrooms ||
        !editedPreferences.price_max || !editedPreferences.preferred_areas ||
        editedPreferences.preferred_areas.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
        duration: 3000,
      });
      return;
    }

    // All fields complete, move to confirmation
    setViewState('confirmation');
    toast({
      title: 'Profile completed!',
      description: 'Please review your preferences before continuing.',
      duration: 2000,
    });
  };

  const handleSkipToQuestions = () => {
    if (onSkip) {
      onSkip();
    }
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
      {/* Recording View */}
      {viewState === 'recording' && (
        <VoiceRecorder
          onComplete={handleRecordingComplete}
          onError={handleRecordingError}
          onSkipToQuestions={showSkipOption && onSkip ? handleSkipToQuestions : undefined}
        />
      )}

      {/* Missing Fields View */}
      {viewState === 'missing-fields' && editedPreferences && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-10 max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
            Just a few more details
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">
            We need a bit more information to find your perfect home
          </p>

          <div className="space-y-5">
            {/* Location - Show if missing */}
            {(!editedPreferences.preferred_areas || editedPreferences.preferred_areas.length === 0) && (
              <div>
                <label htmlFor="fillLocation" className="block text-sm font-medium text-gray-900 mb-2">
                  Where are you looking? <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fillLocation"
                  type="text"
                  placeholder="e.g., San Francisco, Oakland, Berkeley"
                  value={editedPreferences.preferred_areas?.join(', ') || ''}
                  onChange={(e) => {
                    const areas = e.target.value.split(',').map(a => a.trim()).filter(Boolean);
                    setEditedPreferences(prev => prev ? { ...prev, preferred_areas: areas } : null);
                  }}
                  className="w-full"
                />
              </div>
            )}

            {/* Bedrooms - Show if missing */}
            {!editedPreferences.bedrooms && (
              <div>
                <label htmlFor="fillBedrooms" className="block text-sm font-medium text-gray-900 mb-2">
                  Minimum bedrooms <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fillBedrooms"
                  type="number"
                  min="0"
                  placeholder="e.g., 3"
                  value={editedPreferences.bedrooms || ''}
                  onChange={(e) => setEditedPreferences(prev => prev ? {
                    ...prev,
                    bedrooms: parseInt(e.target.value) || null
                  } : null)}
                  className="w-full"
                />
              </div>
            )}

            {/* Bathrooms - Show if missing */}
            {!editedPreferences.bathrooms && (
              <div>
                <label htmlFor="fillBathrooms" className="block text-sm font-medium text-gray-900 mb-2">
                  Minimum bathrooms <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fillBathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g., 2"
                  value={editedPreferences.bathrooms || ''}
                  onChange={(e) => setEditedPreferences(prev => prev ? {
                    ...prev,
                    bathrooms: parseFloat(e.target.value) || null
                  } : null)}
                  className="w-full"
                />
              </div>
            )}

            {/* Budget - Show if missing */}
            {!editedPreferences.price_max && (
              <div>
                <label htmlFor="fillBudget" className="block text-sm font-medium text-gray-900 mb-2">
                  Budget <span className="text-red-500">*</span>
                </label>
                <Input
                  id="fillBudget"
                  type="text"
                  placeholder="e.g., $800,000 - $1,200,000"
                  onChange={(e) => {
                    // Parse budget string to extract max value
                    const value = e.target.value.replace(/[^0-9,-]/g, '');
                    const numbers = value.split(/[-,]/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
                    const maxBudget = numbers.length > 0 ? Math.max(...numbers) : null;
                    const minBudget = numbers.length > 1 ? Math.min(...numbers) : null;
                    setEditedPreferences(prev => prev ? {
                      ...prev,
                      price_max: maxBudget,
                      price_min: minBudget
                    } : null);
                  }}
                  className="w-full"
                />
              </div>
            )}
          </div>

          <Button
            type="button"
            onClick={handleMissingFieldsComplete}
            className="w-full mt-6 sm:mt-8 py-3 text-sm sm:text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
          >
            Complete Profile
          </Button>
        </div>
      )}

      {/* Confirmation View */}
      {viewState === 'confirmation' && processingResult && editedPreferences && (
        <PreferenceConfirmation
          preferences={editedPreferences}
          transcript={processingResult.transcript}
          confidence={processingResult.confidence}
          mandatoryFieldsCaptured={processingResult.mandatoryFieldsCaptured}
          totalMandatoryFields={processingResult.totalMandatoryFields}
          recordingNumber={processingResult.recordingNumber}
          isFirstRecording={processingResult.isFirstRecording}
          changesDetected={processingResult.changesDetected}
          changes={processingResult.changes}
          onConfirm={handleConfirmPreferences}
          onReRecord={handleReRecord}
        />
      )}
    </div>
  );
};
