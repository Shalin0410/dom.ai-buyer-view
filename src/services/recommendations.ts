/**
 * ML Property Recommendation Service
 *
 * This service fetches AI-powered property recommendations and automatically
 * adds them to the buyer_properties table with interest_level='interested'
 * so they appear in the Search Tab.
 */

import { dataService } from '@/services';

export interface RecommendedProperty {
  zpid: string;
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
  avg_school_rating: number;
  hybrid_score: number;
  llm_score: number;
  ml_score: number;
  rule_score: number;
  match_reasons: string;
}

export interface RecommendationResponse {
  success: boolean;
  count: number;
  recommendations: RecommendedProperty[];
  error?: string;
}

export interface LoadRecommendationsOptions {
  buyerId: string;
  buyerProfileId?: string;
  preferencesText?: string;
  preferredAreas?: string[];
  limit?: number;
  organizationId: string;
}

export interface LoadRecommendationsResult {
  success: boolean;
  totalRecommendations: number;
  propertiesAdded: number;
  propertiesSkipped: number;
  errors: string[];
  addedProperties: Array<{
    zpid: string;
    address: string;
    propertyId: string;
    score: number;
  }>;
}

/**
 * Fetch ML recommendations and automatically add them to buyer_properties table
 *
 * This function:
 * 1. Calls the ML recommendation API
 * 2. For each recommended property, checks if it exists in the properties table
 * 3. Adds it to buyer_properties with interest_level='interested'
 * 4. Properties then automatically appear in the Search Tab
 *
 * @returns Result object with counts and any errors
 */
export async function loadRecommendationsToSearchTab(
  options: LoadRecommendationsOptions
): Promise<LoadRecommendationsResult> {
  const {
    buyerId,
    buyerProfileId,
    preferencesText,
    preferredAreas,
    limit = 30,
    organizationId
  } = options;

  const result: LoadRecommendationsResult = {
    success: false,
    totalRecommendations: 0,
    propertiesAdded: 0,
    propertiesSkipped: 0,
    errors: [],
    addedProperties: []
  };

  try {
    // Step 1: Get ML recommendations
    const requestBody: any = { limit };

    if (buyerProfileId) {
      requestBody.buyer_profile_id = buyerProfileId;
    }

    if (preferencesText) {
      requestBody.preferences_text = preferencesText;
    }

    if (preferredAreas && preferredAreas.length > 0) {
      requestBody.preferred_areas = preferredAreas;
    }

    const response = await fetch('/api/recommend.py', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`ML API error: ${response.status}`);
    }

    const data: RecommendationResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get recommendations');
    }

    result.totalRecommendations = data.recommendations.length;

    // Step 2: Add each property to buyer_properties table
    for (const recommendation of data.recommendations) {
      try {
        // The zpid from recommendations is the property ID in our database
        const propertyId = recommendation.zpid;

        // Use the existing service to add property to buyer
        // This creates the buyer_properties relationship with:
        // - interest_level='interested'
        // - is_active=true
        // - relationship_type='home_buyer'
        const addResponse = await dataService.addPropertyToBuyer(
          buyerId,
          propertyId
        );

        if (addResponse.success) {
          result.propertiesAdded++;
          result.addedProperties.push({
            zpid: recommendation.zpid,
            address: recommendation.address,
            propertyId: propertyId,
            score: recommendation.hybrid_score
          });
        } else {
          // Property might already be added, or other error
          result.propertiesSkipped++;
          if (addResponse.error && !addResponse.error.includes('already exists')) {
            result.errors.push(`${recommendation.address}: ${addResponse.error}`);
          }
        }
      } catch (error) {
        result.propertiesSkipped++;
        result.errors.push(
          `${recommendation.address}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }

    result.success = result.propertiesAdded > 0;

    return result;

  } catch (error) {
    result.errors.push(
      error instanceof Error ? error.message : 'Failed to load recommendations'
    );
    return result;
  }
}

/**
 * Just fetch recommendations without adding to buyer_properties
 * Useful for preview/display purposes
 */
export async function fetchRecommendations(
  buyerProfileId?: string,
  preferencesText?: string,
  preferredAreas?: string[],
  limit = 50
): Promise<RecommendationResponse> {
  try {
    const requestBody: any = { limit };

    if (buyerProfileId) {
      requestBody.buyer_profile_id = buyerProfileId;
    }

    if (preferencesText) {
      requestBody.preferences_text = preferencesText;
    }

    if (preferredAreas && preferredAreas.length > 0) {
      requestBody.preferred_areas = preferredAreas;
    }

    const response = await fetch('/api/recommend.py', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: RecommendationResponse = await response.json();
    return data;

  } catch (err) {
    return {
      success: false,
      count: 0,
      recommendations: [],
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}
