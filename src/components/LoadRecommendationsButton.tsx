import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sparkles, Loader2, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';
import { loadRecommendationsToSearchTab } from '@/services/recommendations';
import { toast } from '@/hooks/use-toast';

interface LoadRecommendationsButtonProps {
  buyerId: string;
  organizationId: string;
  buyerProfileId?: string;
  preferredAreas?: string[];
  onPropertiesLoaded?: () => void;
}

/**
 * Button component to load AI-powered property recommendations
 * into the Search Tab
 *
 * When clicked:
 * 1. Calls ML API to get ranked property recommendations
 * 2. Automatically adds properties to buyer_properties table
 * 3. Properties appear in Search Tab with interest_level='interested'
 * 4. User can then swipe through them
 */
export function LoadRecommendationsButton({
  buyerId,
  organizationId,
  buyerProfileId,
  preferredAreas,
  onPropertiesLoaded
}: LoadRecommendationsButtonProps) {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    added: number;
    skipped: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLoadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      setLastResult(null);

      const result = await loadRecommendationsToSearchTab({
        buyerId,
        buyerProfileId,
        preferredAreas,
        limit: 30, // Load top 30 recommendations
        organizationId
      });

      if (result.success) {
        setLastResult({
          added: result.propertiesAdded,
          skipped: result.propertiesSkipped,
          total: result.totalRecommendations
        });

        toast({
          title: '✨ Recommendations Loaded!',
          description: `Added ${result.propertiesAdded} new properties to your search. Start swiping!`,
          duration: 5000,
        });

        // Notify parent to refresh property list
        onPropertiesLoaded?.();
      } else {
        setError(result.errors.join(', ') || 'Failed to load recommendations');
        toast({
          title: 'Error Loading Recommendations',
          description: 'Please try again or contact support',
          variant: 'destructive',
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">AI Property Recommendations</CardTitle>
        </div>
        <CardDescription>
          Get personalized property matches based on your preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastResult && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Loaded {lastResult.added} new {lastResult.added === 1 ? 'property' : 'properties'}.
              {lastResult.skipped > 0 && ` (${lastResult.skipped} already in your search)`}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleLoadRecommendations}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Finding Properties...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Load AI Recommendations
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground text-center">
          This will add up to 30 recommended properties to your search tab
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for inline use
 */
export function LoadRecommendationsCompact({
  buyerId,
  organizationId,
  buyerProfileId,
  preferredAreas,
  onPropertiesLoaded
}: LoadRecommendationsButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleLoad = async () => {
    try {
      setLoading(true);

      const result = await loadRecommendationsToSearchTab({
        buyerId,
        buyerProfileId,
        preferredAreas,
        limit: 30,
        organizationId
      });

      if (result.success) {
        toast({
          title: '✨ Success!',
          description: `Added ${result.propertiesAdded} recommended properties`,
        });
        onPropertiesLoaded?.();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load recommendations',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleLoad}
      disabled={loading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Sparkles className="h-3 w-3" />
      )}
      {loading ? 'Loading...' : 'Get AI Picks'}
    </Button>
  );
}
