# ML Property Recommendation System - Integration Guide

## Overview

The ML-powered property recommendation system has been integrated into the buyer-journey-ai application. It provides AI-driven property recommendations using a hybrid scoring approach:

- **LLM (50%)**: Semantic matching via OpenAI GPT-4o-mini
- **ML (30%)**: Ridge regression trained to mimic LLM scores
- **Rules (20%)**: Budget fit, property features, school ratings

## Architecture

### Backend: Python Serverless Function
- **Location**: `api/recommend.py`
- **Platform**: Vercel serverless function
- **Dependencies**: `api/requirements.txt`

### Frontend: React TypeScript Component
- **Component**: `src/components/PropertyRecommendations.tsx`
- **Hook**: `usePropertyRecommendations()` for custom integrations

### Data Source
- Queries existing Supabase `properties` table (755 properties)
- Uses `buyer_profiles` table for stored preferences
- Leverages pre-fetched schools data (no additional API calls)

## Key Changes from Original ML Code

1. **Data Source**: Uses Supabase instead of RapidAPI Zillow
2. **Schools**: Uses existing `schools` JSONB column (no Google Places calls)
3. **Integration**: Works with `buyer_profiles` table structure
4. **Performance**: Optimized for Vercel's serverless environment

## Setup Instructions

### 1. Environment Variables

Add these to your Vercel project (if not already present):

```bash
# Vercel Dashboard > Settings > Environment Variables
OPENAI_API_KEY=your-openai-api-key
SUPABASE_URL=https://yoidhtwkylouffmhuxfm.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Or via Vercel CLI:
```bash
cd buyer-journey-ai
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### 2. Deploy to Vercel

The `vercel.json` has been updated to support Python serverless functions:

```bash
cd buyer-journey-ai
vercel --prod
```

### 3. Test the API

Health check:
```bash
curl https://your-app.vercel.app/api/recommend.py
```

Get recommendations:
```bash
curl -X POST https://your-app.vercel.app/api/recommend.py \
  -H "Content-Type: application/json" \
  -d '{
    "preferences_text": "3 bedroom home under $800k in Sunnyvale with good schools",
    "limit": 10
  }'
```

## Usage Examples

### Example 1: Using the Component with Buyer Profile

```tsx
import { PropertyRecommendations } from '@/components/PropertyRecommendations';

function BuyerDashboard({ buyerId }: { buyerId: string }) {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Recommended Properties</h1>

      <PropertyRecommendations
        buyerProfileId={buyerId}
        limit={30}
        onPropertySelect={(propertyId) => {
          // Navigate to property detail page
          window.location.href = `/properties/${propertyId}`;
        }}
      />
    </div>
  );
}
```

### Example 2: Using Custom Preferences

```tsx
import { PropertyRecommendations } from '@/components/PropertyRecommendations';

function CustomSearch() {
  const [preferences, setPreferences] = useState('');
  const [showResults, setShowResults] = useState(false);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">What are you looking for?</h2>
        <textarea
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          placeholder="E.g., I'm looking for a 3+ bedroom home under $800k with a good school district..."
          className="w-full h-32 p-4 border rounded-lg"
        />
        <button
          onClick={() => setShowResults(true)}
          className="px-6 py-2 bg-primary text-white rounded-lg"
        >
          Get Recommendations
        </button>
      </div>

      {showResults && (
        <PropertyRecommendations
          preferencesText={preferences}
          preferredAreas={['Sunnyvale', 'Mountain View', 'Palo Alto']}
          limit={50}
        />
      )}
    </div>
  );
}
```

### Example 3: Using the Hook for Custom UI

```tsx
import { usePropertyRecommendations } from '@/components/PropertyRecommendations';
import { Button } from '@/components/ui/button';

function MyCustomRecommendations({ buyerId }: { buyerId: string }) {
  const { recommendations, loading, error, fetchRecommendations } =
    usePropertyRecommendations(buyerId, undefined, undefined, 20);

  return (
    <div>
      <Button onClick={fetchRecommendations} disabled={loading}>
        {loading ? 'Loading...' : 'Refresh Recommendations'}
      </Button>

      {error && <div className="text-red-500">{error}</div>}

      <div className="grid grid-cols-1 gap-4 mt-4">
        {recommendations.map((property, index) => (
          <div key={property.zpid} className="border rounded p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold">#{index + 1} {property.address}</h3>
                <p className="text-gray-600">{property.city}, {property.state}</p>
                <p className="text-lg font-bold mt-2">${property.price.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  {property.hybrid_score.toFixed(1)}
                </div>
                <div className="text-xs text-gray-500">Match Score</div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-2">{property.match_reasons}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Example 4: Add to Existing Property Search Page

Add a "Smart Recommendations" tab to your existing property search:

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropertyRecommendations } from '@/components/PropertyRecommendations';
import { PropertyGrid } from '@/components/PropertyGrid';

function PropertiesPage({ buyerId }: { buyerId: string }) {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList>
        <TabsTrigger value="all">All Properties</TabsTrigger>
        <TabsTrigger value="recommended">
          <Sparkles className="w-4 h-4 mr-2" />
          Smart Recommendations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <PropertyGrid buyerId={buyerId} />
      </TabsContent>

      <TabsContent value="recommended">
        <PropertyRecommendations
          buyerProfileId={buyerId}
          limit={30}
          onPropertySelect={(propertyId) => {
            // Your property selection handler
          }}
        />
      </TabsContent>
    </Tabs>
  );
}
```

## API Reference

### POST `/api/recommend.py`

**Request Body:**

```typescript
{
  buyer_profile_id?: string;      // UUID of buyer in buyer_profiles table
  preferences_text?: string;       // Free-form text to be parsed by LLM
  preferred_areas?: string[];      // Array of city names
  limit?: number;                  // Number of results (default: 50)
}
```

**Response:**

```typescript
{
  success: boolean;
  count: number;
  recommendations: Array<{
    zpid: string;                  // Property ID
    address: string;
    city: string;
    state: string;
    price: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    lot_size: number;
    property_type: string;
    year_built: number | string;
    avg_school_rating: number;     // 0-10 scale
    hybrid_score: number;          // 0-100 overall match score
    llm_score: number;             // 0-100 LLM component
    ml_score: number;              // 0-100 ML component
    rule_score: number;            // 0-100 rule-based component
    match_reasons: string;         // Human-readable explanation
  }>;
}
```

### GET `/api/recommend.py`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Property Recommendation API is running"
}
```

## Integration with Existing Features

### Option 1: Add to Main Search Tab

Update `src/components/MainAppContent.tsx` to add a recommendations section:

```tsx
// In MainAppContent.tsx
import { PropertyRecommendations } from './PropertyRecommendations';

// Add a new tab or section
<div className="mt-8">
  <h2 className="text-2xl font-bold mb-4">Recommended For You</h2>
  <PropertyRecommendations
    buyerProfileId={currentUser?.id}
    limit={10}
  />
</div>
```

### Option 2: Create a New Recommendations Page

Create `src/pages/Recommendations.tsx`:

```tsx
import { PropertyRecommendations } from '@/components/PropertyRecommendations';
import { useAuth } from '@/contexts/AuthContext';

export function RecommendationsPage() {
  const { currentUser } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold">Smart Property Recommendations</h1>
        <p className="text-muted-foreground mt-2">
          AI-powered recommendations based on your preferences
        </p>
      </div>

      <PropertyRecommendations
        buyerProfileId={currentUser?.id}
        limit={50}
        onPropertySelect={(propertyId) => {
          // Handle property selection
        }}
      />
    </div>
  );
}
```

### Option 3: Integrate with Buyer Profiles

When a buyer updates their profile, trigger recommendations:

```tsx
// In your profile update handler
async function handleProfileUpdate(profileData: BuyerProfile) {
  await updateBuyerProfile(profileData);

  // Trigger recommendations
  const { recommendations } = await usePropertyRecommendations(
    profileData.person_id,
    profileData.raw_background,
    profileData.preferred_areas,
    30
  );

  // Show recommendations to user
}
```

## Performance Considerations

### Execution Time
- **Typical**: 10-15 seconds for 50 properties
- **Maximum**: 30 seconds (Vercel timeout limit)

**Factors affecting speed:**
- Number of properties to score
- OpenAI API response time
- Database query performance

### Caching Strategy

Consider caching recommendations:

```tsx
// Simple time-based cache
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function useCachedRecommendations(buyerId: string) {
  const [cache, setCache] = useState<{
    data: RecommendedProperty[];
    timestamp: number;
  } | null>(null);

  const shouldRefetch = !cache ||
    (Date.now() - cache.timestamp > CACHE_DURATION);

  // Implementation...
}
```

### Cost Optimization

Each recommendation request makes 1-2 OpenAI API calls:
- 1 call to parse preferences (if using `preferences_text`)
- 1 call to score all properties

**Cost per request**: ~$0.01-0.03 (depending on number of properties)

**Optimization tips:**
1. Cache recommendations for logged-in users
2. Limit number of properties scored (use database filters)
3. Only re-generate when preferences change
4. Consider background processing for large requests

## Troubleshooting

### API returns 500 error
- Check Vercel logs: `vercel logs`
- Verify environment variables are set
- Check OpenAI API key is valid

### No properties returned
- Verify `properties` table has data
- Check filters aren't too restrictive
- Verify city names in `preferred_areas` match database values

### Slow response times
- Reduce `limit` parameter (try 20-30 instead of 50)
- Implement caching
- Use more specific database filters

### LLM parsing errors
- Ensure `preferences_text` is descriptive enough
- Check OpenAI API status
- Review API logs for parsing errors

## Testing

### Local Development

```bash
# Install dependencies
cd buyer-journey-ai
npm install

# Start Vercel dev server
vercel dev

# In another terminal, test the API
curl -X POST http://localhost:3000/api/recommend.py \
  -H "Content-Type: application/json" \
  -d '{
    "preferences_text": "3 bedroom home under $800k in Sunnyvale",
    "limit": 10
  }'
```

### Unit Testing the Component

```tsx
// Example test using React Testing Library
import { render, screen, waitFor } from '@testing-library/react';
import { PropertyRecommendations } from './PropertyRecommendations';

test('displays recommendations', async () => {
  render(<PropertyRecommendations buyerProfileId="test-id" />);

  await waitFor(() => {
    expect(screen.getByText(/AI-Powered Recommendations/i)).toBeInTheDocument();
  });
});
```

## Next Steps

1. **Deploy to production**: `vercel --prod`
2. **Add to UI**: Integrate the component into your app
3. **Monitor performance**: Check Vercel analytics and logs
4. **Collect feedback**: Track user engagement with recommendations
5. **Iterate**: Adjust scoring weights based on user behavior

## Support

For detailed API usage examples, see: `api/RECOMMEND_API_USAGE.md`

For questions or issues:
1. Check Vercel logs: `vercel logs`
2. Review API documentation in `api/recommend.py`
3. Test with curl to isolate frontend vs backend issues
