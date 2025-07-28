import { useState, useEffect, useCallback } from 'react';
import { Heart, X, Bookmark, Calendar, TrendingUp, Loader2, Star, MapPin, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProperties } from '@/hooks/useProperties';
import { Property, PropertyStatus } from '@/services/api/types';
import { toast } from '@/hooks/use-toast';

// UI extension for property swiping
interface SwipeProperty extends Omit<Property, 'status'> {
  statusText: string;
  image: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  insights: {
    whySuggested: string;
    profileDeviation?: string;
    appreciation: string;
  };
  features: string[];
  neighborhood: string;
  daysOnMarket: number;
}

interface PropertySwipingProps {
  userProfile: { id: string };
  onPropertyAction: (propertyId: string, action: 'like' | 'dislike' | 'save') => void;
  onOpenChat: () => void;
}

const PropertySwiping = ({ userProfile, onPropertyAction, onOpenChat }: PropertySwipingProps) => {
  // State management - all hooks must be called unconditionally at the top level
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [showInsights, setShowInsights] = useState(true);
  const [swipeProperties, setSwipeProperties] = useState<SwipeProperty[]>([]);
  
  // Get buyer ID from user profile
  const buyerId = userProfile?.id;

  // Fetch available properties
  const { properties: availableProperties, loading, error } = useProperties(
    buyerId,
    { status: ['researching'] as PropertyStatus[] },
    'available'
  );

  // Memoized event handlers - must be defined before any conditional returns
  const handleAction = useCallback((action: 'like' | 'dislike' | 'save') => {
    const currentProperty = swipeProperties[currentPropertyIndex];
    if (!currentProperty) return;
    
    onPropertyAction(currentProperty.id, action);
    
    const nextIndex = currentPropertyIndex < (swipeProperties.length - 1) 
      ? currentPropertyIndex + 1 
      : 0;
      
    setCurrentPropertyIndex(nextIndex);
    
    if (nextIndex === 0 && swipeProperties.length > 0) {
      toast({
        title: "You've seen all properties!",
        description: "Starting over from the beginning.",
      });
    }
  }, [currentPropertyIndex, onPropertyAction, swipeProperties]);

  const handleScheduleTour = useCallback(() => {
    toast({
      title: "We are on it!",
      description: "Your tour request has been sent to Kelsey.",
    });
  }, []);

  // Transform properties when availableProperties changes
  useEffect(() => {
    if (availableProperties && availableProperties.length > 0) {
      const transformed = availableProperties.map(property => {
        const primaryPhoto = property.photos?.find(p => p.is_primary) || property.photos?.[0];
        const imageUrl = primaryPhoto?.url || '/placeholder-property.jpg';
        const formattedAddress = [property.address, property.city, property.state, property.zip_code]
          .filter(Boolean).join(', ');
        return {
          ...property,
          statusText: 'Available',
          image: imageUrl,
          price: property.listing_price || 0,
          beds: property.bedrooms || 0,
          baths: property.bathrooms || 0,
          sqft: property.square_feet || 0,
          address: formattedAddress,
          insights: {
            whySuggested: "This property matches your search criteria and preferences.",
            appreciation: "Market appreciation rates vary. This property is in a desirable location with good growth potential.",
            profileDeviation: undefined
          },
          features: [
            property.bedrooms ? `${property.bedrooms} Bed` : '',
            property.bathrooms ? `${property.bathrooms} Bath` : '',
            property.square_feet ? `${property.square_feet.toLocaleString()} sqft` : '',
            property.property_type ? property.property_type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : ''
          ].filter(Boolean) as string[],
          neighborhood: property.city || 'Unknown',
          daysOnMarket: Math.floor(Math.random() * 30) + 1
        } as SwipeProperty;
      });
      
      setSwipeProperties(transformed);
    }
  }, [availableProperties]);

  // Get current property safely
  const currentProperty = swipeProperties[currentPropertyIndex];
  
  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading properties...</span>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading properties. Please try again later.
      </div>
    );
  }
  
  // Show empty state
  if (swipeProperties.length === 0 && !loading) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No properties found</h3>
        <p className="text-gray-600 mb-4">We couldn't find any properties matching your criteria.</p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Your Property Matches</h1>
              <p className="text-xs text-gray-600 mt-1">Discover properties curated just for you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Card */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Property Image */}
          <div className="relative">
            <Card className="overflow-hidden border border-gray-200 shadow-lg">
              <div className="aspect-[4/3] bg-gray-100 relative">
                <img 
                  src={currentProperty.image} 
                  alt={currentProperty.address}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-black text-white text-xs px-2 py-1 shadow-md">
                    <Star size={10} className="mr-1" />
                    Perfect Match
                  </Badge>
                </div>
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black text-white text-xs px-2 py-1 shadow-md">
                    {currentProperty.daysOnMarket} days on market
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Property Details */}
          <div className="space-y-6">
            <Card className="border border-gray-200 shadow-lg">
              <CardContent className="p-5 space-y-4">
                {/* Property Info */}
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      ${(currentProperty.price / 1000000).toFixed(2)}M
                    </h3>
                    <Badge className="bg-black text-white text-xs px-2 py-1 shadow-sm">{currentProperty.neighborhood}</Badge>
                  </div>
                  <div className="flex items-start space-x-2 mb-3">
                    <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-gray-700">{currentProperty.address}</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-600 mb-3">
                    <span className="font-medium">{currentProperty.beds} beds</span>
                    <span>•</span>
                    <span className="font-medium">{currentProperty.baths} baths</span>
                    <span>•</span>
                    <span className="font-medium">{currentProperty.sqft?.toLocaleString()} sqft</span>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-xs font-semibold text-gray-900 mb-2">Key Features</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentProperty.features.map((feature, index) => (
                      <Badge key={index} className="bg-black text-white text-xs px-2 py-1 shadow-sm">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                {showInsights && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg shadow-sm bg-gray-50/50">
                      <div className="flex items-start space-x-2">
                        <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 mb-1">
                            Why this is suggested for you
                          </h4>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {currentProperty.insights.whySuggested}
                          </p>
                          {currentProperty.insights.profileDeviation && (
                            <div className="mt-2 p-2 border border-gray-200 rounded-md shadow-sm">
                              <p className="text-xs text-gray-600">
                                <strong>Note:</strong> {currentProperty.insights.profileDeviation}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg shadow-sm bg-gray-50/50">
                      <div className="flex items-start space-x-2">
                        <TrendingUp size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <h4 className="text-xs font-semibold text-gray-900 mb-1">
                            Property Appreciation Outlook
                          </h4>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {currentProperty.insights.appreciation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-2">
                  <Button
                    onClick={() => handleAction('dislike')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-red-200 text-red-600 hover:border-red-300 hover:text-red-700 hover:bg-transparent py-2 text-xs shadow-sm"
                  >
                    <X size={14} className="mr-1" />
                    Pass
                  </Button>
                  <Button
                    onClick={() => handleAction('save')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-700 hover:bg-transparent py-2 text-xs shadow-sm"
                  >
                    <Bookmark size={14} className="mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={() => handleAction('like')}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 hover:text-white py-2 text-xs shadow-md"
                  >
                    <Heart size={14} className="mr-1" />
                    Love It
                  </Button>
                </div>

                {/* Schedule Tour Button */}
                <Button 
                  onClick={handleScheduleTour}
                  size="sm" 
                  className="w-full bg-blue-600 hover:bg-blue-700 py-2 text-xs shadow-md"
                >
                  <Calendar size={14} className="mr-1" />
                  Schedule Tour (Auto-booking in progress...)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600 mb-3">
            {swipeProperties.length > 0 ? `Property ${currentPropertyIndex + 1} of ${swipeProperties.length}` : 'No properties available'}
          </p>
          {swipeProperties.length > 0 && (
            <div className="flex justify-center space-x-2">
              {swipeProperties.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors shadow-sm ${
                    index === currentPropertyIndex ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertySwiping;
