import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // 5. Update buyer_profiles in database
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

    // Update or create buyer_profile
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
        // Update actual preference fields
        bedrooms: preferences.bedrooms,
        bathrooms: preferences.bathrooms,
        price_min: preferences.price_min,
        price_max: preferences.price_max,
        preferred_areas: preferences.preferred_areas || [],
        property_type_preferences: preferences.property_type_preferences || [],
        must_have_features: preferences.must_have_features || [],
        nice_to_have_features: preferences.nice_to_have_features || [],
        urgency_level: preferences.urgency_level,
        ideal_move_in_date: preferences.ideal_move_in_date,
        raw_background: transcript,
        buyer_needs: `Voice preferences captured on ${new Date().toLocaleDateString()}. Confidence: ${(confidence * 100).toFixed(0)}%. ${transcript}`,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'person_id'
      });

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error(`Failed to update buyer profile: ${updateError.message}`);
    }

    console.log('Successfully updated buyer profile');

    return new Response(
      JSON.stringify({
        success: true,
        transcript,
        preferences,
        confidence,
        mandatoryFieldsCaptured: mentionedMandatory,
        totalMandatoryFields: mandatoryFields.length
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
