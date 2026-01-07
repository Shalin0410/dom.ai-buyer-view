import { useState } from 'react';
import { VoiceRecorder, type ExtractedPreferences } from './VoiceRecorder';
import { PreferenceConfirmation } from './PreferenceConfirmation';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Keyboard, AlertTriangle } from 'lucide-react';
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
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Let's Find Your Dream Home</h2>
        <p className="text-sm sm:text-base text-gray-600">
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
          <div className="mt-6 sm:mt-8 flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="text-xs sm:text-sm text-gray-500">
              Prefer not to record?
            </div>
            <div className="flex space-x-3">
              {showSkipOption && onSkip && (
                <Button
                  variant="outline"
                  onClick={onSkip}
                  className="text-xs sm:text-sm"
                >
                  <Keyboard className="w-4 h-4 mr-2" />
                  Fill out form instead
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {viewState === 'missing-fields' && editedPreferences && (
        <Card className="p-6 sm:p-8 shadow-xl border border-gray-200 rounded-2xl max-w-2xl mx-auto">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
                Just a few more details
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                We need a bit more information to find your perfect home
              </p>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-5 mt-6 sm:mt-8">
            {/* Location */}
            {(!editedPreferences.preferred_areas || editedPreferences.preferred_areas.length === 0) && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Where are you looking? <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="e.g., San Francisco, Oakland, Berkeley"
                  value={editedPreferences.preferred_areas?.join(', ') || ''}
                  onChange={(e) => {
                    const areas = e.target.value.split(',').map(a => a.trim()).filter(Boolean);
                    setEditedPreferences(prev => prev ? { ...prev, preferred_areas: areas } : null);
                  }}
                  className="w-full text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple areas with commas
                </p>
              </div>
            )}

            {/* Bedrooms */}
            {!editedPreferences.bedrooms && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Minimum bedrooms <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 3"
                  value={editedPreferences.bedrooms || ''}
                  onChange={(e) => setEditedPreferences(prev => prev ? {
                    ...prev,
                    bedrooms: parseInt(e.target.value) || null
                  } : null)}
                  className="w-full text-sm sm:text-base"
                />
              </div>
            )}

            {/* Bathrooms */}
            {!editedPreferences.bathrooms && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Minimum bathrooms <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="e.g., 2"
                  value={editedPreferences.bathrooms || ''}
                  onChange={(e) => setEditedPreferences(prev => prev ? {
                    ...prev,
                    bathrooms: parseFloat(e.target.value) || null
                  } : null)}
                  className="w-full text-sm sm:text-base"
                />
              </div>
            )}

            {/* Budget */}
            {!editedPreferences.price_max && (
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Maximum budget <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g., 1200000"
                  value={editedPreferences.price_max || ''}
                  onChange={(e) => setEditedPreferences(prev => prev ? {
                    ...prev,
                    price_max: parseInt(e.target.value) || null
                  } : null)}
                  className="w-full text-sm sm:text-base"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter amount in dollars (e.g., 1200000 for $1.2M)
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6 sm:mt-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleReRecord}
              className="flex-1"
            >
              Record Again
            </Button>
            <Button
              type="button"
              onClick={handleMissingFieldsComplete}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Continue
            </Button>
          </div>
        </Card>
      )}

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
