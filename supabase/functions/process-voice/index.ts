import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to merge arrays intelligently
function mergeArrays(oldArray: string[], newArray: string[]): string[] {
  if (!newArray || newArray.length === 0) {
    return oldArray;
  }
  if (!oldArray || oldArray.length === 0) {
    return newArray;
  }

  // Combine and deduplicate (case-insensitive)
  const combined = [...oldArray];
  newArray.forEach(item => {
    const exists = combined.some(existing =>
      existing.toLowerCase() === item.toLowerCase()
    );
    if (!exists) {
      combined.push(item);
    }
  });

  return combined;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const { audioUrl, buyerId, duration } = await req.json();
    console.log('Processing voice for buyer:', buyerId);

    // 1. Download audio file from Supabase Storage
    console.log('Downloading audio from:', audioUrl);
    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.statusText}`);
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    console.log('Audio downloaded, size:', audioBuffer.byteLength, 'bytes');

    // 2. Transcribe with OpenAI Whisper
    console.log('Starting Whisper transcription...');
    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer], { type: 'audio/webm' }), 'audio.webm');
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const transcriptionResponse = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      }
    );

    if (!transcriptionResponse.ok) {
      const error = await transcriptionResponse.text();
      throw new Error(`Whisper API error: ${error}`);
    }

    const transcription = await transcriptionResponse.json();
    const transcript = transcription.text;
    console.log('Transcription completed:', transcript.substring(0, 100) + '...');

    // 3. Extract structured preferences with GPT-4o-mini
    console.log('Starting preference extraction...');
    const extractionResponse = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant extracting buyer preferences from real estate voice transcripts.

Extract the following fields from the transcript:
- bedrooms: number (minimum desired bedrooms, or null if not mentioned)
- bathrooms: number (minimum desired bathrooms, can be decimal like 2.5, or null if not mentioned)
- price_min: number (minimum budget in dollars, or null if not mentioned)
- price_max: number (maximum budget in dollars, or null if not mentioned)
- preferred_areas: array of strings (city/neighborhood names, or empty array if not mentioned)
- property_type_preferences: array of strings from: ["single_family", "condo", "townhouse", "multi_family", "other"] (or empty array)
- must_have_features: array of strings (required features like "garage", "pool", "good schools", etc., or empty array)
- nice_to_have_features: array of strings (desired but not required features, or empty array)
- urgency_level: string from ["low", "medium", "high"] or null
- ideal_move_in_date: ISO date string (YYYY-MM-DD) or null

Be generous with interpretation. If someone says "I want at least 3 bedrooms", extract bedrooms: 3.
If they say "around $500k", extract price_max: 500000.
If they mention cities or neighborhoods, add them to preferred_areas.

Return ONLY valid JSON with the exact structure above. No markdown, no explanations.`
            },
            {
              role: 'user',
              content: transcript
            }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      }
    );

    if (!extractionResponse.ok) {
      const error = await extractionResponse.text();
      throw new Error(`GPT API error: ${error}`);
    }

    const extraction = await extractionResponse.json();
    const preferences = JSON.parse(extraction.choices[0].message.content);
    console.log('Extraction completed:', preferences);

    // 4. Calculate confidence score based on mandatory fields
    const mandatoryFields = ['bedrooms', 'bathrooms', 'price_max', 'preferred_areas'];
    const mentionedMandatory = mandatoryFields.filter(field => {
      const value = preferences[field];
      return value !== null && value !== undefined &&
             (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    const confidence = mentionedMandatory / mandatoryFields.length;
    console.log('Confidence score:', confidence, `(${mentionedMandatory}/${mandatoryFields.length} mandatory fields)`);

    // 5. Update buyer_profiles in database with versioning
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);

    // First, get the buyer's person_id from their user id
    const { data: personData, error: personError } = await supabase
      .from('persons')
      .select('id, organization_id')
      .eq('id', buyerId)
      .single();

    if (personError || !personData) {
      throw new Error(`Failed to find person record: ${personError?.message}`);
    }

    // 5a. Check for previous recordings and current profile
    const { data: previousRecordings, error: recordingsError } = await supabase
      .from('voice_recordings')
      .select('*')
      .eq('buyer_id', personData.id)
      .order('recording_number', { ascending: false })
      .limit(1);

    if (recordingsError) {
      console.error('Error fetching previous recordings:', recordingsError);
    }

    const { data: currentProfile, error: profileError } = await supabase
      .from('buyer_profiles')
      .select('*')
      .eq('person_id', personData.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching current profile:', profileError);
    }

    const recordingNumber = previousRecordings && previousRecordings.length > 0
      ? previousRecordings[0].recording_number + 1
      : 1;

    console.log(`This is recording #${recordingNumber} for buyer ${personData.id}`);

    // 5b. Insert new recording into history
    const { error: recordingInsertError } = await supabase
      .from('voice_recordings')
      .insert({
        buyer_id: personData.id,
        recording_url: audioUrl,
        recording_number: recordingNumber,
        transcript: transcript,
        transcript_summary: transcript.substring(0, 500), // First 500 chars as summary
        extracted_data: preferences,
        recording_context: recordingNumber === 1 ? 'initial_onboarding' : 'preference_update',
        trigger_event: recordingNumber === 1 ? 'first_recording' : 'update_after_viewing',
        submitted_at: new Date().toISOString()
      });

    if (recordingInsertError) {
      console.error('Error inserting recording:', recordingInsertError);
      throw new Error(`Failed to save recording: ${recordingInsertError.message}`);
    }

    // 5c. Smart merge with previous preferences
    let mergedPreferences = { ...preferences };
    let changeLog: any[] = [];

    if (currentProfile) {
      console.log('Merging with existing preferences...');
      const oldPrefs = currentProfile;

      // Simple merge logic for non-conflicting updates
      mergedPreferences = {
        bedrooms: preferences.bedrooms ?? oldPrefs.bedrooms,
        bathrooms: preferences.bathrooms ?? oldPrefs.bathrooms,
        price_min: preferences.price_min ?? oldPrefs.price_min,
        price_max: preferences.price_max ?? oldPrefs.price_max,
        preferred_areas: mergeArrays(oldPrefs.preferred_areas || [], preferences.preferred_areas || []),
        property_type_preferences: mergeArrays(oldPrefs.property_type_preferences || [], preferences.property_type_preferences || []),
        must_have_features: mergeArrays(oldPrefs.must_have_features || [], preferences.must_have_features || []),
        nice_to_have_features: mergeArrays(oldPrefs.nice_to_have_features || [], preferences.nice_to_have_features || []),
        urgency_level: preferences.urgency_level ?? oldPrefs.urgency_level,
        ideal_move_in_date: preferences.ideal_move_in_date ?? oldPrefs.ideal_move_in_date,
      };

      // Track changes
      if (preferences.bedrooms && preferences.bedrooms !== oldPrefs.bedrooms) {
        changeLog.push({ field: 'bedrooms', old: oldPrefs.bedrooms, new: preferences.bedrooms, recording: recordingNumber });
      }
      if (preferences.bathrooms && preferences.bathrooms !== oldPrefs.bathrooms) {
        changeLog.push({ field: 'bathrooms', old: oldPrefs.bathrooms, new: preferences.bathrooms, recording: recordingNumber });
      }
      if (preferences.price_max && preferences.price_max !== oldPrefs.price_max) {
        changeLog.push({ field: 'price_max', old: oldPrefs.price_max, new: preferences.price_max, recording: recordingNumber });
      }

      console.log('Merge completed. Changes:', changeLog.length);
    }

    // 5d. Update or create buyer_profile with merged preferences
    const existingChangeLog = currentProfile?.preference_change_log || [];
    const updatedChangeLog = [...existingChangeLog, ...changeLog];

    const { error: updateError } = await supabase
      .from('buyer_profiles')
      .upsert({
        person_id: personData.id,
        voice_recording_url: audioUrl,
        voice_transcript: transcript,
        voice_duration_seconds: duration,
        voice_submitted_at: new Date().toISOString(),
        extraction_status: 'completed',
        extraction_confidence: confidence,
        extracted_data: preferences,
        // Use merged preferences
        bedrooms: mergedPreferences.bedrooms,
        bathrooms: mergedPreferences.bathrooms,
        price_min: mergedPreferences.price_min,
        price_max: mergedPreferences.price_max,
        preferred_areas: mergedPreferences.preferred_areas || [],
        property_type_preferences: mergedPreferences.property_type_preferences || [],
        must_have_features: mergedPreferences.must_have_features || [],
        nice_to_have_features: mergedPreferences.nice_to_have_features || [],
        urgency_level: mergedPreferences.urgency_level,
        ideal_move_in_date: mergedPreferences.ideal_move_in_date,
        preference_change_log: updatedChangeLog,
        raw_background: transcript,
        buyer_needs: `Voice preferences captured on ${new Date().toLocaleDateString()}. Recording #${recordingNumber}. Confidence: ${(confidence * 100).toFixed(0)}%. ${transcript}`,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'person_id'
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update buyer profile: ${updateError.message}`);
    }

    console.log('Successfully updated buyer profile with merged preferences');

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        preferences: mergedPreferences,
        rawPreferences: preferences,
        confidence,
        mandatoryFieldsCaptured: mentionedMandatory,
        totalMandatoryFields: mandatoryFields.length,
        recordingNumber,
        isFirstRecording: recordingNumber === 1,
        changesDetected: changeLog.length,
        changes: changeLog
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error processing voice:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Unknown error occurred',
        details: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
