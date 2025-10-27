# ML Property Recommendations → Search Tab Integration

## Overview

This document explains how the ML-powered property recommendation system integrates with the Search Tab to automatically populate buyer property matches.

## How It Works (Complete Flow)

### 1. ML Recommendation API (`api/recommend.py`)
```
Buyer Preferences → ML API → Ranked Properties (Hybrid Scoring)
```

The ML API:
- Accepts buyer preferences (from `buyer_profiles` table or free text)
- Queries your 755 properties from Supabase
- Scores each property using:
  - **50% LLM**: OpenAI semantic matching
  - **30% ML**: Ridge regression (trained to mimic LLM)
  - **20% Rules**: Budget fit, features, schools
- Returns ranked list of properties (0-100 score)

### 2. Recommendation Loader Service (`src/services/recommendations.ts`)
```
ML API → Properties → Add to buyer_properties Table
```

The `loadRecommendationsToSearchTab()` function:
- Calls the ML API to get recommendations
- For each recommended property:
  - Calls `dataService.addPropertyToBuyer(buyerId, propertyId)`
  - This creates a `buyer_properties` record with:
    - `interest_level = 'interested'`
    - `is_active = true`
    - `relationship_type = 'home_buyer'`

### 3. Search Tab Display (`src/components/PropertySwiping.tsx`)
```
buyer_properties Table → Search Tab Swipe Interface
```

According to `AGENT_WORKFLOW_REQUIREMENTS.md`, properties appear in Search Tab when:
- `buyer_properties.is_active = true`
- `buyer_properties.interest_level = 'interested'`
- `properties.status = 'active'`

The `useProperties` hook automatically fetches these properties.

### 4. User Interaction → Dashboard
```
User Swipes → Updates interest_level → Appears on Dashboard
```

When users interact with properties:
- **Love**: `interest_level = 'loved'` → Timeline created → Appears on Dashboard
- **Schedule Tour**: `interest_level = 'viewing_scheduled'` → Timeline created → Dashboard
- **Pass**: `interest_level = 'passed'`, `is_active = false` → Removed from Search

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. USER CLICKS "Load AI Recommendations"                            │
│    (LoadRecommendationsButton component)                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. CALL loadRecommendationsToSearchTab()                            │
│    src/services/recommendations.ts                                  │
│                                                                      │
│    Input:                                                            │
│    - buyerId                                                         │
│    - buyerProfileId (optional)                                       │
│    - preferencesText (optional)                                      │
│    - limit (default 30)                                              │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. POST /api/recommend.py (Python Serverless Function)              │
│                                                                      │
│    a. Parse preferences via OpenAI LLM                               │
│    b. Query Supabase properties table (755 properties)               │
│    c. Score each property:                                           │
│       • LLM Score (50%): Semantic matching                           │
│       • ML Score (30%): Ridge regression                             │
│       • Rule Score (20%): Budget + features + schools                │
│    d. Return ranked properties                                       │
│                                                                      │
│    Response:                                                         │
│    [                                                                 │
│      {                                                               │
│        zpid: "property-uuid",                                        │
│        address: "123 Main St",                                       │
│        hybrid_score: 87.3,                                           │
│        ...                                                           │
│      }                                                               │
│    ]                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. FOR EACH RECOMMENDED PROPERTY                                    │
│    Call: dataService.addPropertyToBuyer(buyerId, propertyId)        │
│                                                                      │
│    This creates a buyer_properties record:                          │
│    {                                                                 │
│      buyer_id: "buyer-uuid",                                         │
│      property_id: "property-uuid",                                   │
│      organization_id: "org-uuid",                                    │
│      interest_level: "interested",  ← KEY!                          │
│      is_active: true,                ← KEY!                          │
│      relationship_type: "home_buyer"                                 │
│    }                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. PROPERTIES AUTOMATICALLY APPEAR IN SEARCH TAB                    │
│    Component: PropertySwiping.tsx                                   │
│    Hook: useProperties(buyerId, {}, 'available')                    │
│                                                                      │
│    Query filters:                                                    │
│    - buyer_properties.is_active = true                              │
│    - buyer_properties.interest_level = 'interested'                 │
│    - properties.status = 'active'                                   │
│                                                                      │
│    User sees: Tinder-style swipe interface                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. USER INTERACTS WITH PROPERTIES                                   │
│                                                                      │
│    Love (❤️):                                                        │
│    → interest_level = 'loved'                                        │
│    → Timeline created (via database trigger)                         │
│    → Appears on Dashboard                                            │
│                                                                      │
│    Schedule Tour (📅):                                               │
│    → interest_level = 'viewing_scheduled'                            │
│    → Timeline created                                                │
│    → Appears on Dashboard                                            │
│                                                                      │
│    Pass (✗):                                                         │
│    → interest_level = 'passed'                                       │
│    → is_active = false                                               │
│    → Removed from Search Tab                                         │
│                                                                      │
│    Save (🔖):                                                        │
│    → interest_level stays 'interested'                               │
│    → Stays in Search Tab                                             │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Components

### 1. Backend: Python ML API

**File**: `api/recommend.py`

**What it does**:
- Receives buyer preferences
- Queries Supabase for matching properties
- Scores properties using hybrid ML system
- Returns ranked list

**Scoring Algorithm**:
```python
hybrid_score = (
    0.5 * llm_score +      # OpenAI semantic matching
    0.3 * ml_score +       # Ridge regression
    0.2 * rule_score       # Hard rules
)
```

### 2. Recommendation Service

**File**: `src/services/recommendations.ts`

**Main Function**: `loadRecommendationsToSearchTab()`

**What it does**:
```typescript
async function loadRecommendationsToSearchTab(options) {
  // 1. Get ML recommendations
  const response = await fetch('/api/recommend.py', { ... });

  // 2. Add each property to buyer_properties
  for (const property of recommendations) {
    await dataService.addPropertyToBuyer(buyerId, property.zpid);
  }

  // 3. Return results
  return {
    propertiesAdded: 15,
    propertiesSkipped: 5,
    ...
  };
}
```

### 3. UI Component

**File**: `src/components/LoadRecommendationsButton.tsx`

**What it does**:
- Displays "Load AI Recommendations" button
- Shows loading state while processing
- Displays success message with count
- Refreshes property list

**Where it appears**:
- **Empty state**: When user has no properties in Search Tab
- **Header**: Compact button in Search Tab header (always visible)

### 4. Search Tab Integration

**File**: `src/components/PropertySwiping.tsx`

**Changes made**:
1. Imported `LoadRecommendationsButton` and `LoadRecommendationsCompact`
2. Added full button to empty state
3. Added compact button to header
4. Button triggers recommendation loading

## Database Tables Involved

### `properties` Table
```sql
id (uuid)
organization_id (uuid)
address, city, state, zip_code
listing_price, bedrooms, bathrooms, square_feet, lot_size
property_type, year_built
status ('active', 'pending', 'sold', 'off_market')
schools (jsonb)
coordinates (jsonb)
zillow_property_id
```

**Note**: Your database has 755 properties with full Zillow data

### `buyer_properties` Table
```sql
id (uuid)
organization_id (uuid)
buyer_id (uuid) → persons table
property_id (uuid) → properties table
relationship_type ('home_buyer', 'seller', 'investor')
interest_level ('interested', 'loved', 'viewing_scheduled', 'under_contract', 'pending', 'passed')
is_active (boolean)
created_at, updated_at
```

**Key for Search Tab**:
- `interest_level = 'interested'`
- `is_active = true`

### `buyer_profiles` Table
```sql
person_id (uuid) → persons table
price_min, price_max
budget_approved, pre_approval_amount
buyer_needs (text)
preferred_areas (text[])
property_type_preferences (text[])
must_have_features (text[])
nice_to_have_features (text[])
raw_background (text)
```

**Used by ML API**: Provides preference data for recommendations

## Usage Instructions

### For Users

1. **Navigate to Search Tab**
2. **If no properties**: Large "Load AI Recommendations" card appears
3. **If properties exist**: Click "Get AI Picks" button in header
4. **Wait 10-30 seconds**: ML processes recommendations
5. **Properties appear**: Start swiping through matches

### For Developers

#### Deploy the ML API
```bash
cd buyer-journey-ai
vercel --prod
```

#### Set Environment Variables
```bash
vercel env add OPENAI_API_KEY
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

#### Test Locally
```bash
vercel dev

# In another terminal
curl -X POST http://localhost:3000/api/recommend.py \
  -H "Content-Type: application/json" \
  -d '{"buyer_profile_id": "uuid", "limit": 10}'
```

#### Customize Recommendation Count
Edit `src/components/LoadRecommendationsButton.tsx`:
```typescript
const result = await loadRecommendationsToSearchTab({
  buyerId,
  buyerProfileId,
  preferredAreas,
  limit: 50, // Change from 30 to 50
  organizationId
});
```

#### Adjust Scoring Weights
Edit `api/recommend.py`:
```python
def recommend_hybrid(..., w_llm=0.5, w_ml=0.3, w_rule=0.2):
    # Change weights: w_llm=0.6, w_ml=0.2, w_rule=0.2
    hybrid_scores = (
        w_llm * np.array(llm_scores) +
        w_ml * ml_scores +
        w_rule * rule_scores_norm
    )
```

## Property States & Workflow

According to `AGENT_WORKFLOW_REQUIREMENTS.md`:

### Initial State (ML Recommendations)
```
interest_level: 'interested'
is_active: true
→ Appears in: SEARCH TAB
```

### After User Loves Property
```
interest_level: 'loved'
is_active: true
timeline: Created automatically (database trigger)
→ Appears in: DASHBOARD
```

### After User Schedules Tour
```
interest_level: 'viewing_scheduled'
is_active: true
timeline: Created automatically
→ Appears in: DASHBOARD
```

### After User Passes
```
interest_level: 'passed'
is_active: false
→ Appears in: NOWHERE (removed from view)
```

## Performance Considerations

### ML API Response Time
- **Typical**: 10-15 seconds for 30 properties
- **Maximum**: 30 seconds (Vercel timeout)
- **Bottleneck**: OpenAI API calls

### Cost per Request
- **LLM Parsing**: ~$0.005 per request (if using preferences_text)
- **LLM Scoring**: ~$0.01-0.02 per batch of 30 properties
- **Total**: ~$0.015-0.025 per recommendation request

### Optimization Tips
1. **Cache recommendations**: Don't regenerate for 5-10 minutes
2. **Limit batch size**: 30 properties is optimal
3. **Use buyer_profile_id**: Skip LLM parsing step
4. **Filter at database**: Use preferred_areas to reduce properties scored

## Troubleshooting

### No properties appear after loading
**Check**:
1. Verify properties were added: `SELECT * FROM buyer_properties WHERE buyer_id = '...'`
2. Check interest_level: Should be 'interested'
3. Check is_active: Should be true
4. Verify property status: Should be 'active' in properties table

### ML API returns 500 error
**Check**:
1. Vercel logs: `vercel logs`
2. OpenAI API key is set
3. Supabase credentials are correct
4. Properties table has data

### Recommendations are poor quality
**Adjust**:
1. Update buyer profile with better preferences
2. Adjust scoring weights in `api/recommend.py`
3. Add more property data (descriptions, features)
4. Fine-tune rule scoring logic

### Slow performance
**Optimize**:
1. Reduce limit to 20 properties
2. Add database indexes on buyer_properties
3. Use buyer_profile_id instead of preferences_text
4. Implement caching in frontend

## Testing Checklist

- [ ] ML API returns recommendations
- [ ] Properties added to buyer_properties table
- [ ] Properties appear in Search Tab
- [ ] Empty state shows recommendation button
- [ ] Header button works when properties exist
- [ ] Loading state displays correctly
- [ ] Success message shows property count
- [ ] Properties can be swiped (Love/Pass/Schedule)
- [ ] Loved properties move to Dashboard
- [ ] Passed properties are removed
- [ ] Page refresh shows new properties

## Next Steps

1. **Deploy to Production**: `vercel --prod`
2. **Test with Real Buyer**: Create buyer profile and load recommendations
3. **Monitor Performance**: Check Vercel analytics
4. **Collect Feedback**: Track user engagement with recommendations
5. **Iterate on Scoring**: Adjust weights based on user behavior
6. **Add Features**:
   - Recommendation explanations (why this property?)
   - Property comparison tool
   - Save recommendation sets
   - Email recommendations to buyers

## Support

For questions or issues:
1. Check Vercel logs: `vercel logs`
2. Review API documentation: `api/RECOMMEND_API_USAGE.md`
3. Test API directly with curl
4. Check database records in Supabase dashboard
