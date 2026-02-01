import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface ExtractedPreferences {
  bedrooms: number | null;
  bathrooms: number | null;
  price_min: number | null;
  price_max: number | null;
  preferred_areas: string[];
  property_type_preferences: string[];
  must_have_features: string[];
  nice_to_have_features: string[];
  urgency_level: string | null;
  ideal_move_in_date: string | null;
}

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

interface VoiceRecorderProps {
  onComplete: (result: VoiceProcessingResult) => void;
  onError: (error: string) => void;
  onSkipToQuestions?: () => void;
}

export const VoiceRecorder = ({ onComplete, onError, onSkipToQuestions }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const { user } = useAuth();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  // Check if browser supports recording
  const isRecordingSupported = () => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  };

  // Start recording
  const startRecording = async () => {
    if (!isRecordingSupported()) {
      setError('Voice recording is not supported in your browser. Please use Chrome, Edge, or Safari.');
      setPermissionDenied(true);
      return;
    }

    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      // Setup audio visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      // Start visualization loop
      visualizeAudio();

      // Check for supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      if (!mimeType) {
        throw new Error('No supported audio format found');
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = handleRecordingComplete;

      mediaRecorder.onerror = (event: Event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred. Please try again.');
        stopRecording();
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop at 5 minutes
          if (newDuration >= 300) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);

    } catch (error: any) {
      console.error('Error starting recording:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
        setPermissionDenied(true);
      } else if (error.name === 'NotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else {
        setError('Could not start recording. Please check your microphone and try again.');
      }
      onError(error.message || 'Failed to start recording');
    }
  };

  // Visualize audio levels
  const visualizeAudio = () => {
    if (!analyserRef.current || !isRecording) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const updateLevel = () => {
      if (!isRecording || !analyserRef.current) return;

      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255); // Normalize to 0-1

      animationFrameRef.current = requestAnimationFrame(updateLevel);
    };

    updateLevel();
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  // Process recorded audio
  const handleRecordingComplete = async () => {
    setIsProcessing(true);

    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded');
      }

      // Create audio blob
      const audioBlob = new Blob(audioChunksRef.current, {
        type: mediaRecorderRef.current?.mimeType || 'audio/webm'
      });

      if (audioBlob.size === 0) {
        throw new Error('Recording is empty');
      }

      console.log('Audio blob created:', audioBlob.size, 'bytes', audioBlob.type);

      // Upload to Supabase Storage
      const fileName = `${user?.id}/${Date.now()}.webm`;
      console.log('Uploading to:', fileName);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-intake')
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload audio: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('voice-intake')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Call Edge Function to process
      console.log('Calling process-voice function...');
      const { data, error: functionError } = await supabase.functions.invoke('process-voice', {
        body: {
          audioUrl: publicUrl,
          buyerId: user?.id,
          duration: duration
        }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(`Processing failed: ${functionError.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      console.log('Processing successful:', data);

      // Return extracted preferences
      onComplete(data);

    } catch (error: any) {
      console.error('Error processing recording:', error);
      const errorMessage = error.message || 'Failed to process your recording';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
      setDuration(0);
    }
  };

  // Format duration display
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecordingSupported()) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Voice recording is not supported in your browser. Please use Chrome, Edge, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="w-full">
      {/* Card Container */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8 lg:p-10 max-w-xl mx-auto">
        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">
          Describe your ideal home
        </h2>

        {/* Subtitle with example */}
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 text-center leading-relaxed">
          Example: "A single-family home in Potrero Hill, 3 bedrooms, lots of natural light, and a small yard."
        </p>

        {/* Error Display */}
        {error && !permissionDenied && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Voice Section */}
        <div className="space-y-6">
          {/* Recording Area */}
          <div className="flex flex-col items-center py-6 sm:py-8">
            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isProcessing || permissionDenied}
              className={`
                w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center
                transition-all duration-300 ease-out
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-gradient-to-br from-indigo-600 to-purple-600 hover:scale-105 hover:shadow-xl'
                }
              `}
              style={{
                boxShadow: isRecording
                  ? '0 0 0 8px rgba(239, 68, 68, 0.2)'
                  : '0 4px 20px rgba(79, 70, 229, 0.3)'
              }}
            >
              {isProcessing ? (
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-spin" />
              ) : (
                <svg className="w-10 h-10 sm:w-12 sm:h-12 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                </svg>
              )}
            </button>

            {/* Recording Indicator */}
            <div className={`mt-4 sm:mt-5 text-sm sm:text-base font-medium ${isRecording ? 'text-red-500' : 'text-gray-600'}`}>
              {!isRecording && !isProcessing && 'Tap to start recording'}
              {isRecording && 'Recording... Tap again to stop'}
              {isProcessing && 'Processing your preferences...'}
            </div>

            {/* Timer */}
            {isRecording && (
              <div className="mt-3 sm:mt-4 text-3xl sm:text-4xl font-semibold text-gray-900 tabular-nums">
                {formatDuration(duration)}
              </div>
            )}

            {/* Waveform */}
            {isRecording && (
              <div className="flex items-end justify-center gap-1 mt-4 sm:mt-5 h-10">
                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="w-1 sm:w-1.5 bg-gradient-to-t from-indigo-600 to-purple-500 rounded-full animate-wave"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      height: '100%',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          {onSkipToQuestions && !isRecording && !isProcessing && (
            <>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-sm text-gray-500 font-medium">or</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Skip to Questions Button */}
              <Button
                type="button"
                variant="outline"
                onClick={onSkipToQuestions}
                className="w-full py-3 text-sm sm:text-base font-medium border-gray-300 hover:bg-gray-50"
              >
                Answer questions instead
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Waveform Animation Styles */}
      <style>{`
        @keyframes wave {
          0%, 100% {
            transform: scaleY(0.3);
          }
          50% {
            transform: scaleY(1);
          }
        }
        .animate-wave {
          animation: wave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
