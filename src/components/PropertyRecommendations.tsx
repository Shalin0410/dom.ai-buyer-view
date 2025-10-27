import React, { useState, useEffect } from 'react';
import { PropertyCard } from './PropertyCard';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

interface RecommendedProperty {
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

interface RecommendationResponse {
  success: boolean;
  count: number;
  recommendations: RecommendedProperty[];
  error?: string;
}

interface PropertyRecommendationsProps {
  buyerProfileId?: string;
  preferencesText?: string;
  preferredAreas?: string[];
  limit?: number;
  onPropertySelect?: (propertyId: string) => void;
}

export function PropertyRecommendations({
  buyerProfileId,
  preferencesText,
  preferredAreas,
  limit = 50,
  onPropertySelect
}: PropertyRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (buyerProfileId || preferencesText) {
      fetchRecommendations();
    }
  }, [buyerProfileId, preferencesText]);

  async function fetchRecommendations() {
    try {
      setLoading(true);
      setError(null);

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

      const response = await fetch('/api/recommend', {
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

      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Finding your perfect properties...</p>
        <p className="text-sm text-muted-foreground mt-2">This may take 10-30 seconds</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load recommendations: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Recommendations Yet</CardTitle>
          <CardDescription>
            {buyerProfileId
              ? "We couldn't find any properties matching your criteria. Try adjusting your preferences."
              : "Provide your preferences to get personalized property recommendations."}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI-Powered Recommendations</CardTitle>
          </div>
          <CardDescription>
            {recommendations.length} properties ranked by your preferences using hybrid AI scoring
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((property, index) => (
          <RecommendationCard
            key={property.zpid}
            property={property}
            rank={index + 1}
            onSelect={() => onPropertySelect?.(property.zpid)}
          />
        ))}
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  property: RecommendedProperty;
  rank: number;
  onSelect?: () => void;
}

function RecommendationCard({ property, rank, onSelect }: RecommendationCardProps) {
  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
      <div className="absolute top-4 left-4 bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm z-10">
        {rank}
      </div>

      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{property.address}</CardTitle>
        <CardDescription>
          {property.city}, {property.state}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-2xl font-bold text-primary">
            ${property.price.toLocaleString()}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{property.bedrooms} beds</span>
            <span>•</span>
            <span>{property.bathrooms} baths</span>
            <span>•</span>
            <span>{property.sqft.toLocaleString()} sqft</span>
          </div>

          {property.lot_size > 0 && (
            <div className="text-sm text-muted-foreground">
              Lot: {property.lot_size.toLocaleString()} sqft
            </div>
          )}

          <div className="text-sm text-muted-foreground">
            {property.property_type} • Built {property.year_built}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Match Score</span>
            <span className="text-lg font-bold text-primary">
              {property.hybrid_score.toFixed(1)}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>LLM: {property.llm_score.toFixed(0)}</span>
            <span>ML: {property.ml_score.toFixed(0)}</span>
            <span>Rules: {property.rule_score.toFixed(0)}</span>
          </div>

          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full"
              style={{ width: `${property.hybrid_score}%` }}
            />
          </div>
        </div>

        {property.avg_school_rating > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">School Rating</span>
            <span className="font-medium">
              {property.avg_school_rating.toFixed(1)}/10
            </span>
          </div>
        )}

        {property.match_reasons && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground line-clamp-2">
              {property.match_reasons}
            </p>
          </div>
        )}

        {onSelect && (
          <Button onClick={onSelect} className="w-full">
            View Details
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Hook for easy integration
export function usePropertyRecommendations(
  buyerProfileId?: string,
  preferencesText?: string,
  preferredAreas?: string[],
  limit = 50
) {
  const [recommendations, setRecommendations] = useState<RecommendedProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

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

      const response = await fetch('/api/recommend', {
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

      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        throw new Error(data.error || 'Failed to get recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations,
    refetch: fetchRecommendations
  };
}
