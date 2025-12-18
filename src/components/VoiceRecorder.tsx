import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Loader2, AlertCircle } from 'lucide-react';
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

interface VoiceProcessingResult {
  success: boolean;
  transcript: string;
  preferences: ExtractedPreferences;
  confidence: number;
  mandatoryFieldsCaptured: number;
  totalMandatoryFields: number;
}

interface VoiceRecorderProps {
  onComplete: (result: VoiceProcessingResult) => void;
  onError: (error: string) => void;
}

export const VoiceRecorder = ({ onComplete, onError }: VoiceRecorderProps) => {
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
    <div className="flex flex-col items-center space-y-6 p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
      {/* Error Display */}
      {error && (
        <Alert variant="destructive" className="w-full max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Waveform Visualization */}
      {isRecording && (
        <div className="flex items-center justify-center space-x-1 h-20 w-full max-w-md">
          {[...Array(24)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-blue-500 rounded-full transition-all duration-75 ease-out"
              style={{
                height: `${Math.max(8, audioLevel * 80 * (0.5 + Math.sin((i + duration) * 0.5) * 0.5))}px`,
                opacity: 0.4 + audioLevel * 0.6
              }}
            />
          ))}
        </div>
      )}

      {/* Status Display */}
      <div className="text-center">
        {!isRecording && !isProcessing && !permissionDenied && (
          <>
            <div className="mb-4">
              <Mic className="w-16 h-16 text-blue-500 mx-auto mb-2" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Tell us what you're looking for</h3>
            <p className="text-gray-600 mb-2">
              Just speak naturally about your dream home
            </p>
            <p className="text-sm text-gray-500">
              We'll transcribe and extract your preferences automatically
            </p>
          </>
        )}

        {isRecording && (
          <>
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <p className="text-lg font-medium text-red-600">Recording...</p>
            </div>
            <p className="text-4xl font-mono font-bold text-gray-800 mb-2">
              {formatDuration(duration)}
            </p>
            <p className="text-sm text-gray-500">
              Keep speaking or press stop when done
            </p>
            {duration > 240 && (
              <p className="text-xs text-orange-500 mt-2">
                Maximum recording time: 5 minutes
              </p>
            )}
          </>
        )}

        {isProcessing && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-xl font-medium mb-2">Processing your preferences...</p>
            <p className="text-sm text-gray-500">
              Transcribing audio and extracting details
            </p>
          </>
        )}
      </div>

      {/* Recording Controls */}
      {!isProcessing && !permissionDenied && (
        <div className="flex space-x-4">
          {!isRecording ? (
            <Button
              size="lg"
              onClick={startRecording}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
            >
              <Mic className="w-6 h-6 mr-2" />
              Start Recording
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={stopRecording}
              variant="destructive"
              className="px-8 py-6 text-lg"
            >
              <Square className="w-6 h-6 mr-2" />
              Stop & Process
            </Button>
          )}
        </div>
      )}

      {/* Tips */}
      {!isRecording && !isProcessing && !permissionDenied && (
        <div className="text-sm text-gray-600 text-center max-w-md bg-white/60 rounded-lg p-4">
          <p className="font-semibold mb-2">💡 Tips for best results:</p>
          <ul className="text-left space-y-1.5 text-xs">
            <li>• <strong>Speak clearly</strong> in a quiet environment</li>
            <li>• <strong>Mention:</strong> bedrooms, bathrooms, budget, and areas you prefer</li>
            <li>• <strong>Share must-haves:</strong> garage, good schools, pool, etc.</li>
            <li>• <strong>Take your time</strong> - no rush, up to 5 minutes!</li>
          </ul>
        </div>
      )}
    </div>
  );
};
