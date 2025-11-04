/**
 * ML Property Recommendation Service
 *
 * This service fetches AI-powered property recommendations and automatically
 * adds them to the buyer_properties table with interest_level='interested'
 * so they appear in the Search Tab.
 */

import { dataService } from '@/services';

export interface RecommendedProperty {
  id: string;  // Database UUID (use this for addPropertyToBuyer)
  zpid: string;  // Display ID (Zillow ID or fallback to database ID)
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
 * Delete the oldest passed property to allow re-recommendation
 * This helps capture evolving buyer preferences over time
 *
 * IMPORTANT: This performs a HARD DELETE (removes record completely from buyer_properties)
 * so the property can be recommended again by AI if match score meets threshold
 */
async function deleteOldestPassedProperty(buyerId: string): Promise<void> {
  try {
    const { supabase } = await import('@/lib/supabaseClient');

    // Find the oldest passed property
    // Passed properties have is_active = false
    const { data: oldestPassed, error } = await supabase
      .from('buyer_properties')
      .select('id, property_id')
      .eq('buyer_id', buyerId)
      .eq('interest_level', 'passed')
      .eq('is_active', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error || !oldestPassed) {
      // No passed properties to delete
      return;
    }

    // HARD DELETE - completely remove the record from buyer_properties
    // This allows the property to be re-recommended if it matches criteria again
    await supabase
      .from('buyer_properties')
      .delete()
      .eq('id', oldestPassed.id);

    console.log(`[DeletePassedProperty] Deleted oldest passed property: ${oldestPassed.property_id} (can now be re-recommended)`);
  } catch (err) {
    console.error('[DeletePassedProperty] Error:', err);
    // Don't fail the whole recommendation flow if this fails
  }
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
    console.log(`[LoadRecommendations] Starting for buyer ${buyerId}, limit: ${limit}`);

    // Step 0: Probabilistic deletion of oldest passed property (10% chance)
    // This allows properties to be re-recommended as buyer preferences evolve
    // BUT only after user has built a long interaction history (30-40+ properties)
    const MIN_TOTAL_INTERACTIONS = 35;
    const shouldDeleteOldPassed = Math.random() < 0.10; // 10% probability
    if (shouldDeleteOldPassed) {
      const { supabase } = await import('@/lib/supabaseClient');

      // Count TOTAL interaction history (all interest levels, active only)
      const { count: totalInteractions } = await supabase
        .from('buyer_properties')
        .select('id', { count: 'exact', head: true })
        .eq('buyer_id', buyerId)
        .eq('is_active', true);

      // Only delete if user has sufficient interaction history
      if (totalInteractions && totalInteractions >= MIN_TOTAL_INTERACTIONS) {
        console.log(`[LoadRecommendations] User has ${totalInteractions} total interactions, deleting oldest passed property`);
        await deleteOldestPassedProperty(buyerId);
      } else {
        console.log(`[LoadRecommendations] User has ${totalInteractions || 0} total interactions, need ${MIN_TOTAL_INTERACTIONS} before deletion`);
      }
    }

    // Step 1: Fetch loved properties for similarity boosting
    // NOTE: The Python API now filters duplicates at the DATABASE level using buyer_id
    // We only need to send loved_property_ids for similarity boosting (price, location matching)
    const interactionHistory = await dataService.getBuyerPropertyInteractions(buyerId);
    console.log('[LoadRecommendations] Interaction history:', interactionHistory);

    // Step 2: Get ML recommendations with similarity boosting
    const requestBody: any = {
      limit,
      buyer_id: buyerId  // Always send buyer_id so API can look up buyer profile
    };

    if (buyerProfileId) {
      requestBody.buyer_profile_id = buyerProfileId;
    }

    if (preferencesText) {
      requestBody.preferences_text = preferencesText;
    }

    if (preferredAreas && preferredAreas.length > 0) {
      requestBody.preferred_areas = preferredAreas;
    }

    // Send loved properties for similarity boosting
    // Python API will automatically exclude ALL interacted properties using buyer_id
    if (interactionHistory.success && interactionHistory.data) {
      const interactions = interactionHistory.data;

      if (interactions.loved && interactions.loved.length > 0) {
        requestBody.loved_property_ids = interactions.loved;
      }
    }

    // Use GCP Cloud Function URL from environment variable
    const apiUrl = import.meta.env.VITE_RECOMMEND_API_URL || '/api/recommend';

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      // Try to get detailed error from API
      let errorDetails = `ML API error: ${response.status}`;
      try {
        const errorData = await response.json();
        console.error('API Error Details:', errorData);
        errorDetails = errorData.error || errorData.traceback || errorDetails;
      } catch (e) {
        // If response isn't JSON, use status text
        errorDetails = response.statusText || errorDetails;
      }
      throw new Error(errorDetails);
    }

    const data: RecommendationResponse = await response.json();
    console.log('[LoadRecommendations] API response:', { success: data.success, count: data.recommendations?.length });

    if (!data.success) {
      throw new Error(data.error || 'Failed to get recommendations');
    }

    result.totalRecommendations = data.recommendations.length;
    console.log(`[LoadRecommendations] Received ${result.totalRecommendations} recommendations from API`);

    // FRONTEND PROTECTION: Only take the first 'limit' properties
    // This ensures we never exceed the 20-property max, even if API returns more
    const recommendationsToAdd = data.recommendations.slice(0, limit);
    if (recommendationsToAdd.length < data.recommendations.length) {
      console.log(`[LoadRecommendations] Limiting to ${limit} properties (API returned ${data.recommendations.length})`);
    }

    // Step 2: Add each property to buyer_properties table
    for (const recommendation of recommendationsToAdd) {
      try {
        // Use the database UUID (id) for adding to buyer_properties
        const propertyId = recommendation.id;

        // Use the existing service to add property to buyer
        // This creates the buyer_properties relationship with:
        // - interest_level='interested'
        // - is_active=true
        // - ML scoring data for ranking and display
        const addResponse = await dataService.addPropertyToBuyer(
          buyerId,
          propertyId,
          {
            hybridScore: recommendation.hybrid_score,
            llmScore: recommendation.llm_score,
            mlScore: recommendation.ml_score,
            ruleScore: recommendation.rule_score,
            matchReasons: recommendation.match_reasons,
            recommendationSource: 'ml_api'
          }
        );

        if (addResponse.success) {
          result.propertiesAdded++;
          result.addedProperties.push({
            zpid: recommendation.zpid,
            address: recommendation.address,
            propertyId: propertyId,
            score: recommendation.hybrid_score
          });
          console.log(`[LoadRecommendations] ✓ Added: ${recommendation.address}`);
        } else {
          // Property might already be added, or other error
          result.propertiesSkipped++;
          console.log(`[LoadRecommendations] ✗ Skipped: ${recommendation.address} - ${addResponse.error}`);
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

    console.log('[LoadRecommendations] Final result:', {
      success: result.success,
      added: result.propertiesAdded,
      skipped: result.propertiesSkipped,
      errors: result.errors.length
    });

    return result;

  } catch (error) {
    console.error('[LoadRecommendations] Error:', error);
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

    // Use GCP Cloud Function URL from environment variable
    const apiUrl = import.meta.env.VITE_RECOMMEND_API_URL || '/api/recommend';

    const response = await fetch(apiUrl, {
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
