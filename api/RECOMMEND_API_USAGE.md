# Property Recommendation API - Usage Guide

## Overview

The ML-powered property recommendation API is now available as a Vercel serverless function at `/api/index.py`. It uses a hybrid scoring system combining:
- **LLM (50%)**: Semantic matching via OpenAI GPT-4o-mini
- **ML (30%)**: Ridge regression trained to mimic LLM
- **Rules (20%)**: Budget fit, features, schools

## Key Changes from Original Code

1. **Data Source**: Queries Supabase `properties` table instead of RapidAPI Zillow
2. **Schools**: Uses pre-fetched schools data from the database (no Google Places API calls needed)
3. **Performance**: Optimized for Vercel's 250MB limit and execution time constraints
4. **Integration**: Works directly with existing `buyer_profiles` and `persons` tables

## API Endpoints

### POST `/api/index.py`

Get property recommendations for a buyer.

**Request Body Options:**

#### Option 1: Use existing buyer profile
```json
{
  "buyer_profile_id": "uuid-of-buyer",
  "limit": 50
}
```

#### Option 2: Provide free-form preferences text
```json
{
  "preferences_text": "I'm looking for a 3+ bedroom home under $800k in Sunnyvale or Mountain View. Must have a good school district and a large backyard.",
  "preferred_areas": ["Sunnyvale", "Mountain View"],
  "limit": 50
}
```

#### Option 3: Both (preferences_text will be parsed by LLM, buyer_profile provides defaults)
```json
{
  "buyer_profile_id": "uuid-of-buyer",
  "preferences_text": "Actually, I'd prefer something closer to downtown with walkability",
  "limit": 30
}
```

**Response:**
```json
{
  "success": true,
  "count": 30,
  "recommendations": [
    {
      "zpid": "property-id-123",
      "address": "123 Main St",
      "city": "Sunnyvale",
      "state": "CA",
      "price": 750000,
      "bedrooms": 3,
      "bathrooms": 2.0,
      "sqft": 1800,
      "lot_size": 5000,
      "property_type": "Single Family",
      "year_built": 2010,
      "avg_school_rating": 8.5,
      "hybrid_score": 87.3,
      "llm_score": 85.0,
      "ml_score": 88.2,
      "rule_score": 90.5,
      "match_reasons": "Good budget fit ($750,000); 3 bedrooms (matches requirement); Excellent schools (avg 8.5/10)"
    },
    ...
  ]
}
```

### GET `/api/index.py`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "Property Recommendation API is running"
}
```

## JavaScript/React Integration Examples

### Vanilla JavaScript (for domai-agent-view)

```javascript
// File: js/property-recommendations.js

async function getPropertyRecommendations(buyerProfileId, limit = 50) {
  try {
    const response = await fetch('/api/index.py', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        buyer_profile_id: buyerProfileId,
        limit: limit
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

// Usage example
async function displayRecommendations(buyerProfileId) {
  const loadingEl = document.getElementById('loading');
  const resultsEl = document.getElementById('results');

  loadingEl.style.display = 'block';

  try {
    const recommendations = await getPropertyRecommendations(buyerProfileId);

    resultsEl.innerHTML = '';
    recommendations.forEach((property, index) => {
      const card = document.createElement('div');
      card.className = 'property-card';
      card.innerHTML = `
        <div class="property-rank">#${index + 1}</div>
        <h3>${property.address}</h3>
        <p class="price">$${property.price.toLocaleString()}</p>
        <div class="details">
          <span>${property.bedrooms} beds</span> |
          <span>${property.bathrooms} baths</span> |
          <span>${property.sqft.toLocaleString()} sqft</span>
        </div>
        <div class="scores">
          <div class="score-item">
            <span class="score-label">Match Score:</span>
            <span class="score-value">${property.hybrid_score.toFixed(1)}</span>
          </div>
          <div class="school-rating">
            Schools: ${property.avg_school_rating.toFixed(1)}/10
          </div>
        </div>
        <p class="match-reasons">${property.match_reasons}</p>
      `;
      resultsEl.appendChild(card);
    });
  } catch (error) {
    resultsEl.innerHTML = `<p class="error">Failed to load recommendations: ${error.message}</p>`;
  } finally {
    loadingEl.style.display = 'none';
  }
}
```

### React Component Example

```jsx
// File: components/PropertyRecommendations.jsx

import React, { useState, useEffect } from 'react';

function PropertyRecommendations({ buyerProfileId }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        const response = await fetch('/api/index.py', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            buyer_profile_id: buyerProfileId,
            limit: 50
          })
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setRecommendations(data.recommendations);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (buyerProfileId) {
      fetchRecommendations();
    }
  }, [buyerProfileId]);

  if (loading) {
    return <div className="loading">Loading recommendations...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="property-recommendations">
      <h2>Recommended Properties</h2>
      <p className="count">{recommendations.length} properties found</p>

      <div className="property-grid">
        {recommendations.map((property, index) => (
          <div key={property.zpid} className="property-card">
            <div className="property-rank">#{index + 1}</div>
            <h3>{property.address}</h3>
            <p className="location">{property.city}, {property.state}</p>
            <p className="price">${property.price.toLocaleString()}</p>

            <div className="property-details">
              <span>{property.bedrooms} beds</span>
              <span>{property.bathrooms} baths</span>
              <span>{property.sqft.toLocaleString()} sqft</span>
            </div>

            <div className="scores">
              <div className="hybrid-score">
                <span className="label">Match Score</span>
                <span className="value">{property.hybrid_score.toFixed(1)}</span>
              </div>
              <div className="breakdown">
                <span>LLM: {property.llm_score.toFixed(0)}</span>
                <span>ML: {property.ml_score.toFixed(0)}</span>
                <span>Rules: {property.rule_score.toFixed(0)}</span>
              </div>
            </div>

            {property.avg_school_rating > 0 && (
              <div className="schools">
                Schools: {property.avg_school_rating.toFixed(1)}/10
              </div>
            )}

            <p className="match-reasons">{property.match_reasons}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PropertyRecommendations;
```

### With Custom Preferences Form

```jsx
// File: components/CustomRecommendations.jsx

import React, { useState } from 'react';

function CustomRecommendations() {
  const [preferencesText, setPreferencesText] = useState('');
  const [preferredAreas, setPreferredAreas] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const areas = preferredAreas
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      const response = await fetch('/api/index.py', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferences_text: preferencesText,
          preferred_areas: areas.length > 0 ? areas : null,
          limit: 50
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="custom-recommendations">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="preferences">What are you looking for?</label>
          <textarea
            id="preferences"
            value={preferencesText}
            onChange={(e) => setPreferencesText(e.target.value)}
            placeholder="E.g., I'm looking for a 3+ bedroom home under $800k with a good school district and a large backyard."
            rows={4}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="areas">Preferred Areas (comma-separated)</label>
          <input
            id="areas"
            type="text"
            value={preferredAreas}
            onChange={(e) => setPreferredAreas(e.target.value)}
            placeholder="Sunnyvale, Mountain View, Palo Alto"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Finding properties...' : 'Get Recommendations'}
        </button>
      </form>

      {error && <div className="error">Error: {error}</div>}

      {recommendations.length > 0 && (
        <div className="results">
          <h2>{recommendations.length} Recommended Properties</h2>
          {/* Render property cards here */}
        </div>
      )}
    </div>
  );
}

export default CustomRecommendations;
```

## Environment Variables

Add these to your Vercel project settings:

1. **OPENAI_API_KEY** - Your OpenAI API key
2. **SUPABASE_URL** - Your Supabase project URL
3. **SUPABASE_SERVICE_ROLE_KEY** - Your Supabase service role key

## Deployment

1. **Install Vercel CLI** (if not already):
   ```bash
   npm install -g vercel
   ```

2. **Deploy to Vercel**:
   ```bash
   cd C:\Users\admin-01\Downloads\dom.ai
   vercel
   ```

3. **Set environment variables** in Vercel dashboard or via CLI:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

4. **Redeploy**:
   ```bash
   vercel --prod
   ```

## Testing Locally

To test the serverless function locally:

```bash
# Install Vercel CLI
npm install -g vercel

# Run local development server
vercel dev
```

Then test with curl:

```bash
curl -X POST http://localhost:3000/api/index.py \
  -H "Content-Type: application/json" \
  -d '{
    "preferences_text": "3 bedroom home under $800k in Sunnyvale with good schools",
    "limit": 10
  }'
```

## Performance Considerations

1. **Execution Time**: The function may take 10-30 seconds depending on:
   - Number of properties to score
   - OpenAI API response time
   - Database query performance

2. **Rate Limiting**: OpenAI API has rate limits. Consider:
   - Caching recommendations for a few minutes
   - Reducing the number of properties scored
   - Using a background job for large result sets

3. **Cost**: Each request makes 1-2 OpenAI API calls:
   - 1 call to parse preferences (if using `preferences_text`)
   - 1 call to score all properties

## Troubleshooting

### Error: "Module not found: supabase"
- Make sure `supabase>=2.0.0` is in `api/requirements.txt`
- Redeploy the function

### Error: "OpenAI API key not found"
- Set the `OPENAI_API_KEY` environment variable in Vercel

### Error: "No properties found"
- Check that your `properties` table has data
- Check that the filters aren't too restrictive
- Verify the `preferred_areas` match city names in the database

### Slow response times
- Reduce the `limit` parameter (try 20-30 instead of 50)
- Consider implementing caching
- Use background processing for large queries
