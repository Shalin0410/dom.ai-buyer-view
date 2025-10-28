import { useState, useEffect, useCallback } from 'react';
import { Heart, X, Bookmark, Calendar, Loader2, Star, MapPin, Home, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProperties } from '@/hooks/useProperties';
import { Property, PropertyStatus } from '@/services/api/types';
import { toast } from '@/hooks/use-toast';
import { handlePropertyInteraction, PropertyAction } from '@/services/properties/interactions';
import { ViewingScheduleModal } from '@/components/ViewingScheduleModal';
import { LoadRecommendationsButton, LoadRecommendationsCompact } from '@/components/LoadRecommendationsButton';
import { useAuth } from '@/contexts/AuthContext';

// UI extension for property swiping
interface SwipeProperty extends Omit<Property, 'status'> {
  statusText: string;
  image: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  address: string;
  features: string[];
  neighborhood: string;
  daysOnMarket: number;
}

interface PropertySwipingProps {
  userProfile: { id: string; name?: string; email?: string };
  onPropertyAction: (propertyId: string, action: 'like' | 'dislike' | 'save') => void;
  onOpenChat: () => void;
  agentEmail?: string;
}

const PropertySwiping = ({ userProfile, onPropertyAction, onOpenChat, agentEmail = 'agent@example.com' }: PropertySwipingProps) => {
  // State management - all hooks must be called unconditionally at the top level
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [swipeProperties, setSwipeProperties] = useState<SwipeProperty[]>([]);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Get auth context for organization_id
  const { user } = useAuth();

  // Get buyer ID from user profile
  const buyerId = userProfile?.id;
  const organizationId = user?.organization_id || '';

  // Fetch available properties
  const { properties: availableProperties, loading, error, refreshProperties } = useProperties(
    buyerId,
    {}, // Remove status filter to show all properties for this buyer
    'available'
  );

  // Memoized event handlers - must be defined before any conditional returns
  const handleAction = useCallback(async (action: 'like' | 'dislike' | 'save') => {
    const currentProperty = swipeProperties[currentPropertyIndex];
    if (!currentProperty || !buyerId) return;
    
    // Map UI actions to database actions
    let dbAction: PropertyAction;
    let toastMessage = '';
    
    switch (action) {
      case 'dislike':
        dbAction = 'pass';
        toastMessage = 'Property passed';
        break;
      case 'save':
        dbAction = 'save';
        toastMessage = 'Property saved for later';
        break;
      case 'like':
        dbAction = 'love';
        toastMessage = 'Property added to your favorites!';
        break;
      default:
        return;
    }
    
    // Handle the property interaction
    const success = await handlePropertyInteraction({
      buyerId,
      propertyId: currentProperty.id,
      action: dbAction
    });
    
    if (success) {
      toast({
        title: "Done!",
        description: toastMessage,
      });
      
      // Remove property from current list for 'pass' and 'love' actions
      if (action === 'dislike' || action === 'like') {
        const updatedProperties = swipeProperties.filter((_, index) => index !== currentPropertyIndex);
        setSwipeProperties(updatedProperties);
        
        // Adjust current index if needed
        if (currentPropertyIndex >= updatedProperties.length && updatedProperties.length > 0) {
          setCurrentPropertyIndex(0);
        }
        
        if (updatedProperties.length === 0) {
          toast({
            title: "All properties reviewed!",
            description: "Check your dashboard for saved properties.",
          });
        }
      } else {
        // For 'save' action, just move to next property
        const nextIndex = currentPropertyIndex < (swipeProperties.length - 1) 
          ? currentPropertyIndex + 1 
          : 0;
        setCurrentPropertyIndex(nextIndex);
      }
    } else {
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive"
      });
    }
    
    // Also call the original callback
    onPropertyAction(currentProperty.id, action);
  }, [currentPropertyIndex, buyerId, swipeProperties, onPropertyAction]);

  const handleScheduleTour = useCallback(() => {
    setIsScheduleModalOpen(true);
  }, []);

  const handleScheduleConfirm = useCallback(async (schedulingData: {
    propertyId: string;
    selectedDates: Date[];
    additionalInfo: string;
  }) => {
    if (!buyerId) return false;
    
    const success = await handlePropertyInteraction({
      buyerId,
      propertyId: schedulingData.propertyId,
      action: 'schedule_tour'
    });
    
    if (success) {
      // Remove property from search list
      const updatedProperties = swipeProperties.filter((_, index) => index !== currentPropertyIndex);
      setSwipeProperties(updatedProperties);
      
      // Adjust current index if needed
      if (currentPropertyIndex >= updatedProperties.length && updatedProperties.length > 0) {
        setCurrentPropertyIndex(0);
      }
      
      if (updatedProperties.length === 0) {
        toast({
          title: "All properties reviewed!",
          description: "Check your dashboard for tour schedules.",
        });
      }
      
      return true;
    } else {
      toast({
        title: "Error",
        description: "Failed to schedule tour. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [currentPropertyIndex, buyerId, swipeProperties]);

  // Reset photo index when property changes
  useEffect(() => {
    setCurrentPhotoIndex(0);
  }, [currentPropertyIndex]);

  // Photo navigation handlers with cycling
  const handlePreviousPhoto = useCallback(() => {
    const currentProperty = swipeProperties[currentPropertyIndex];
    if (!currentProperty || !currentProperty.photos) return;

    const photoCount = currentProperty.photos.length;
    setCurrentPhotoIndex(prev => (prev === 0 ? photoCount - 1 : prev - 1));
  }, [currentPropertyIndex, swipeProperties]);

  const handleNextPhoto = useCallback(() => {
    const currentProperty = swipeProperties[currentPropertyIndex];
    if (!currentProperty || !currentProperty.photos) return;

    const photoCount = currentProperty.photos.length;
    setCurrentPhotoIndex(prev => (prev === photoCount - 1 ? 0 : prev + 1));
  }, [currentPropertyIndex, swipeProperties]);

  // Transform properties when availableProperties changes
  useEffect(() => {
    if (availableProperties && availableProperties.length > 0) {
      console.log('Available properties:', availableProperties);
      const transformed = availableProperties.map(property => {
        console.log('Property photos:', property.photos);

        // Sort and organize photos properly
        let sortedPhotos = property.photos && property.photos.length > 0
          ? [...property.photos]
          : [{
              id: 'default',
              url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80',
              is_primary: true,
              display_order: 0
            }];

        // Sort photos: primary photo first, then by display_order
        sortedPhotos.sort((a, b) => {
          // Primary photo (is_primary=true OR display_order=0) always comes first
          const aIsPrimary = a.is_primary || a.display_order === 0;
          const bIsPrimary = b.is_primary || b.display_order === 0;

          if (aIsPrimary && !bIsPrimary) return -1;
          if (!aIsPrimary && bIsPrimary) return 1;

          // If both or neither are primary, sort by display_order
          return (a.display_order || 0) - (b.display_order || 0);
        });

        // Filter out any photos with invalid URLs
        const validPhotos = sortedPhotos.filter(p => p.url && p.url.trim() !== '');
        const photos = validPhotos.length > 0 ? validPhotos : sortedPhotos;

        const primaryPhoto = photos[0]; // First photo is now always primary
        const imageUrl = primaryPhoto.url;
        console.log('Sorted photos:', photos.length, 'Primary photo:', imageUrl);
        const formattedAddress = [property.address, property.city, property.state, property.zip_code]
          .filter(Boolean).join(', ');
        return {
          ...property,
          photos: photos, // Use sorted photos array
          statusText: 'Available',
          image: imageUrl,
          price: property.listing_price || 0,
          beds: property.bedrooms || 0,
          baths: property.bathrooms || 0,
          sqft: property.square_feet || 0,
          address: formattedAddress,
          features: [
            property.bedrooms ? `${property.bedrooms} Bed${property.bedrooms > 1 ? 's' : ''}` : '',
            property.bathrooms ? `${property.bathrooms} Bath${property.bathrooms > 1 ? 's' : ''}` : '',
            property.square_feet ? `${property.square_feet.toLocaleString()} sqft` : '',
            property.property_type ? property.property_type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : ''
          ].filter(Boolean) as string[],
          neighborhood: property.city || 'Unknown',
          daysOnMarket: property.days_on_market || Math.floor(Math.random() * 30) + 1
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
  
  // Show error state (only for real errors, not empty results)
  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading properties: {error}
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }
  
  // Show empty state with AI recommendations option
  if (swipeProperties.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
        <div className="max-w-2xl mx-auto pt-12 space-y-8">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
              <Home className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No Properties to Swipe</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Your agent hasn't added any properties yet, or you've reviewed them all.
              Try loading AI-powered recommendations based on your preferences!
            </p>
          </div>

          {/* AI Recommendations Button */}
          <LoadRecommendationsButton
            buyerId={buyerId}
            organizationId={organizationId}
            buyerProfileId={buyerId}
            currentPropertyCount={availableProperties.length}
            onPropertiesLoaded={() => {
              // Refresh the property list
              refreshProperties();
            }}
          />

          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">or</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="px-8"
            >
              Refresh to Check for New Properties
            </Button>
          </div>
        </div>
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
            <LoadRecommendationsCompact
              buyerId={buyerId}
              organizationId={organizationId}
              buyerProfileId={buyerId}
              currentPropertyCount={swipeProperties.length}
              onPropertiesLoaded={refreshProperties}
            />
          </div>
        </div>
      </div>

      {/* Property Card */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Property Image */}
          <div className="relative">
            <Card className="overflow-hidden border border-gray-200 shadow-lg">
              <div className="aspect-[4/3] bg-gray-100 relative group">
                <img
                  src={currentProperty.photos?.[currentPhotoIndex]?.url || currentProperty.image}
                  alt={`${currentProperty.address} - Photo ${currentPhotoIndex + 1}`}
                  className="w-full h-full object-cover min-h-full"
                  style={{ objectFit: 'cover' }}
                  loading="eager"
                  onError={(e) => {
                    // Fallback to default image if photo fails to load
                    const target = e.currentTarget;
                    if (target.src !== 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80') {
                      target.src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1973&q=80';
                    }
                  }}
                />

                {/* Photo Navigation Buttons */}
                {currentProperty.photos && currentProperty.photos.length > 1 && (
                  <>
                    <button
                      onClick={handlePreviousPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Next photo"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}

                {/* Photo Counter */}
                {currentProperty.photos && currentProperty.photos.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-black/70 text-white text-xs px-3 py-1">
                      {currentPhotoIndex + 1}/{currentProperty.photos.length}
                    </Badge>
                  </div>
                )}

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
                      ${currentProperty.price.toLocaleString()}
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

                {/* AI Match Score */}
                {currentProperty.hybrid_score && (
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-900">AI Match Score</h4>
                      <span className="text-lg font-bold text-blue-600">
                        {currentProperty.hybrid_score.toFixed(0)}%
                      </span>
                    </div>
                    <div className="relative h-2 bg-white rounded-full overflow-hidden mb-2">
                      <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${currentProperty.hybrid_score}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      {currentProperty.llm_score && (
                        <span>LLM: {currentProperty.llm_score.toFixed(0)}</span>
                      )}
                      {currentProperty.ml_score && (
                        <span>ML: {currentProperty.ml_score.toFixed(0)}</span>
                      )}
                      {currentProperty.rule_score && (
                        <span>Rules: {currentProperty.rule_score.toFixed(0)}</span>
                      )}
                    </div>
                    {currentProperty.match_reasons && (
                      <p className="text-xs text-gray-700 italic">
                        {currentProperty.match_reasons}
                      </p>
                    )}
                  </div>
                )}

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
                  Schedule Viewing
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

      {/* Viewing Schedule Modal */}
      {currentProperty && (
        <ViewingScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          property={currentProperty}
          buyerName={userProfile?.name || 'Buyer'}
          buyerEmail={userProfile?.email || ''}
          agentEmail={agentEmail}
          onScheduleConfirm={handleScheduleConfirm}
        />
      )}
    </div>
  );
};

export default PropertySwiping;
