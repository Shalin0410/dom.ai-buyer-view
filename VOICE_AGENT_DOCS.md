# Voice Agent for Buyer Preferences

## 🎯 Overview

The Voice Agent feature allows buyers to provide their home search preferences using voice input instead of filling out traditional forms. The system automatically transcribes the voice recording, extracts structured preference data using AI, and saves it to the buyer's profile.

## ✨ Features

- **Browser-based voice recording** - No phone calls or external apps required
- **Real-time audio visualization** - Visual feedback while recording
- **AI-powered transcription** - OpenAI Whisper for accurate speech-to-text
- **Intelligent extraction** - GPT-4o-mini extracts structured preferences
- **Confidence scoring** - Shows how many mandatory fields were captured
- **Review & edit** - Buyers can review and correct extracted data before saving
- **Graceful fallbacks** - Option to skip voice input and use traditional forms

## 📊 Architecture

```
┌──────────────┐
│   Browser    │  MediaRecorder API
│  (Buyer UI)  │  Records audio in browser
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ Supabase Storage│  Audio files stored
│  /voice-intake/ │  With RLS policies
└────────┬────────┘
         │
         ▼
┌────────────────────────┐
│  Edge Function         │  Serverless processing
│  /process-voice        │  Deno runtime
└───────┬────────────────┘
        │
        ├─→ OpenAI Whisper API (transcription)
        │
        ├─→ GPT-4o-mini (structured extraction)
        │
        └─→ buyer_profiles table (save data)
```

## 🗄️ Database Schema

### New Columns in `buyer_profiles`

```sql
voice_recording_url TEXT          -- URL to audio file in storage
voice_transcript TEXT              -- Full transcript from Whisper
voice_duration_seconds INTEGER     -- Recording length
voice_submitted_at TIMESTAMPTZ     -- When recording was made
extraction_status TEXT             -- 'pending', 'processing', 'completed', 'failed'
extraction_confidence NUMERIC(3,2) -- 0.00 to 1.00 confidence score
extracted_data JSONB               -- Raw JSON from GPT extraction
```

### Storage Bucket

- **Bucket name**: `voice-intake`
- **Structure**: `{user_id}/{timestamp}.webm`
- **RLS policies**: Users can only access their own recordings
- **File size limit**: 10MB
- **Allowed formats**: webm, mp4, mpeg, wav, ogg

## 🎤 User Flow

### 1. Recording Phase
```
User clicks "Start Recording"
  → Browser requests microphone permission
  → Audio visualization shows recording in progress
  → Timer displays recording duration (max 5 minutes)
  → User clicks "Stop & Process"
```

### 2. Processing Phase
```
Audio blob created
  → Upload to Supabase Storage
  → Call Edge Function with audio URL
  → Whisper transcribes audio
  → GPT-4o-mini extracts preferences
  → Data saved to buyer_profiles
  → Return results to UI
```

### 3. Confirmation Phase
```
Show extracted preferences
  → Display confidence score
  → Highlight missing mandatory fields
  → Allow manual editing
  → User confirms or re-records
  → Save final preferences
```

## 📝 Mandatory Fields

The system checks for these 4 mandatory fields:
1. **Bedrooms** (minimum)
2. **Bathrooms** (minimum)
3. **Maximum Budget**
4. **Preferred Areas** (at least one city/neighborhood)

## 🔧 Implementation Files

### Backend
- `supabase/migrations/add_voice_intake_fields.sql` - Database columns
- `supabase/migrations/create_voice_intake_storage_v2.sql` - Storage bucket & RLS
- `supabase/functions/process-voice/index.ts` - Edge Function for processing

### Frontend Components
- `src/components/VoiceRecorder.tsx` - Recording UI with visualization
- `src/components/PreferenceConfirmation.tsx` - Review/edit extracted data
- `src/components/VoicePreferenceInput.tsx` - Main wrapper component
- `src/pages/Onboarding.tsx` - Onboarding page with voice input

### Routing
- `/onboarding` - New buyer onboarding with voice input

## 🚀 Setup Instructions

### 1. Environment Variables

Ensure these are set in your Supabase project:

```bash
OPENAI_API_KEY=sk-...        # OpenAI API key (required)
SUPABASE_URL=https://...      # Already configured
SUPABASE_SERVICE_ROLE_KEY=... # Already configured
```

### 2. Deploy Edge Function

```bash
# From project root
cd buyer-journey-ai

# Deploy the Edge Function
npx supabase functions deploy process-voice --project-ref yoidhtwkylouffmhuxfm

# Set the OpenAI API key secret
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here --project-ref yoidhtwkylouffmhuxfm
```

### 3. Test the Feature

1. Navigate to `http://localhost:8080/onboarding`
2. Click "Start Recording"
3. Allow microphone access
4. Speak your preferences (example below)
5. Click "Stop & Process"
6. Review extracted data
7. Confirm or edit

## 🎯 Example Voice Input

### Good Example:
```
"Hi, I'm looking for a home in the Saratoga Springs or Campbell area.
I need at least 3 bedrooms and 2 bathrooms. My budget is around
$700,000, but I could go up to $750,000 for the right place.
Must-haves are a garage and good schools nearby. A pool would be
nice to have but not required. I'm looking to move in within 3 months."
```

### What Gets Extracted:
```json
{
  "bedrooms": 3,
  "bathrooms": 2,
  "price_min": 700000,
  "price_max": 750000,
  "preferred_areas": ["Saratoga Springs", "Campbell"],
  "must_have_features": ["garage", "good schools"],
  "nice_to_have_features": ["pool"],
  "urgency_level": "high",
  "ideal_move_in_date": null
}
```

## 💰 Cost Analysis

### Per Recording (3-minute average):

- **Whisper API**: 3 min × $0.006/min = **$0.018**
- **GPT-4o-mini**: ~1 extraction = **$0.001**
- **Supabase Storage**: ~2MB × $0.021/GB = **$0.00004**
- **Edge Function**: Free tier (500K requests/month)

**Total per buyer: ~$0.02** (2 cents!)

### Monthly (100 new buyers):
- 100 buyers × $0.02 = **$2/month**

Extremely cost-effective compared to Twilio alternatives.

## 🔍 Troubleshooting

### "Microphone access denied"
- User needs to allow microphone in browser settings
- Check browser permissions (chrome://settings/content/microphone)
- HTTPS required (localhost works for testing)

### "No supported audio format found"
- Browser doesn't support MediaRecorder
- Recommend Chrome, Edge, or Safari
- Firefox may have limited codec support

### "Processing failed"
- Check Edge Function logs: `npx supabase functions logs process-voice`
- Verify OpenAI API key is set correctly
- Check storage bucket permissions

### "Low confidence score"
- Recording might be too short or unclear
- Background noise affecting transcription
- User didn't mention mandatory fields
- Encourage user to re-record

## 📊 Monitoring

### Key Metrics to Track:

1. **Completion Rate**: % who finish voice vs abandon
2. **Confidence Scores**: Average confidence across recordings
3. **Mandatory Fields Captured**: % with all 4 fields
4. **Re-recording Rate**: % who record multiple times
5. **Error Rate**: % of failed transcriptions/extractions

### Edge Function Logs:

```bash
# View real-time logs
npx supabase functions logs process-voice --follow

# Check for errors
npx supabase functions logs process-voice --level error
```

### Database Queries:

```sql
-- Check extraction status distribution
SELECT
  extraction_status,
  COUNT(*) as count,
  AVG(extraction_confidence) as avg_confidence
FROM buyer_profiles
WHERE voice_submitted_at IS NOT NULL
GROUP BY extraction_status;

-- Find low-confidence recordings
SELECT
  person_id,
  voice_transcript,
  extraction_confidence,
  extracted_data
FROM buyer_profiles
WHERE extraction_confidence < 0.5
ORDER BY voice_submitted_at DESC;
```

## 🎨 Customization

### Change Recording Time Limit

In `VoiceRecorder.tsx`:
```typescript
// Current: 5 minutes (300 seconds)
if (newDuration >= 300) {
  stopRecording();
}

// Change to 3 minutes:
if (newDuration >= 180) {
  stopRecording();
}
```

### Adjust Extraction Prompt

In `process-voice/index.ts`, modify the system prompt:
```typescript
content: `You are an AI assistant extracting buyer preferences...`
```

### Customize Mandatory Fields

In `VoicePreferenceInput.tsx` and `process-voice/index.ts`:
```typescript
const mandatoryFields = ['bedrooms', 'bathrooms', 'price_max', 'preferred_areas'];
```

## 🔐 Security

### RLS Policies:
- ✅ Users can only upload to their own folder
- ✅ Users can only read their own recordings
- ✅ Service role can access all (for processing)
- ✅ Audio URLs are scoped to authenticated users

### Data Privacy:
- Recordings stored securely in Supabase Storage
- Transcripts saved in database with RLS
- OpenAI API doesn't retain audio after 30 days
- Consider GDPR compliance for EU users

## 🚦 Next Steps

### Phase 2 Enhancements:
1. **In-browser editing** of extracted preferences
2. **Pause/resume** recording functionality
3. **Background noise detection** with warnings
4. **Multi-language support** (Whisper supports 50+ languages)
5. **Voice activity detection** (auto-stop on silence)

### Phase 3 Advanced Features:
1. **Speaker diarization** (couples recording together)
2. **Sentiment analysis** for urgency detection
3. **Automated follow-up questions** via voice
4. **FUB integration** to sync voice notes
5. **Agent voice notes** about properties

## 📞 Support

For issues or questions:
- Check Edge Function logs first
- Review browser console for client-side errors
- Test with sample audio file
- Verify API keys and permissions

## ✅ Checklist for Launch

- [ ] Deploy Edge Function to production
- [ ] Set OpenAI API key in Supabase secrets
- [ ] Test on multiple browsers (Chrome, Safari, Firefox)
- [ ] Test on mobile devices (iOS, Android)
- [ ] Set up monitoring/alerts for errors
- [ ] Document support process for users
- [ ] Train agents on how to help buyers with voice input
- [ ] A/B test voice vs form input
- [ ] Monitor costs and adjust if needed

---

**Last Updated**: December 2025
**Version**: 1.0
**Status**: Production Ready ✅
