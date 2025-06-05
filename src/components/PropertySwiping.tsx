
import { useState, useEffect } from 'react';
import { Heart, X, Bookmark, Info, MapPin, Calendar, Star, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Property {
  id: number;
  address: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
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
  userProfile: any;
  onPropertyAction: (propertyId: number, action: 'like' | 'dislike' | 'save') => void;
  onOpenChat: () => void;
}

const PropertySwiping = ({ userProfile, onPropertyAction, onOpenChat }: PropertySwipingProps) => {
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);
  const [showInsights, setShowInsights] = useState(true);

  const mockProperties: Property[] = [
    {
      id: 1,
      address: "1234 Valencia Street, San Francisco, CA 94110",
      price: 1250000,
      beds: 3,
      baths: 2,
      sqft: 1850,
      image: "/placeholder.svg",
      insights: {
        whySuggested: "In your price range, in the Mission (walkable neighborhood), and has the private backyard you need for your dog. You consistently liked homes with outdoor space.",
        profileDeviation: undefined,
        appreciation: "This property is expected to appreciate 4-6% annually based on Mission District trends. The area's ongoing development and proximity to tech companies suggest strong long-term value growth."
      },
      features: ["Private Backyard", "Near CalTrain", "Pet-Friendly", "Great Restaurants Nearby"],
      neighborhood: "Mission District",
      daysOnMarket: 12
    },
    {
      id: 2,
      address: "567 Noe Street, San Francisco, CA 94114",
      price: 1450000,
      beds: 3,
      baths: 2.5,
      sqft: 2100,
      image: "/placeholder.svg",
      insights: {
        whySuggested: "We know you prefer the Mission, but have you considered Noe Valley? It's super walkable, family-friendly with great schools for your future plans, and still in the city - take a look!",
        profileDeviation: "This is outside your preferred Mission neighborhood",
        appreciation: "Noe Valley properties typically appreciate 5-7% annually. Family-friendly neighborhoods with top-rated schools tend to maintain strong property values and demand."
      },
      features: ["Great Schools", "Family-Friendly", "Near Transit", "Garden"],
      neighborhood: "Noe Valley",
      daysOnMarket: 8
    }
  ];

  const currentProperty = mockProperties[currentPropertyIndex];

  const handleAction = (action: 'like' | 'dislike' | 'save') => {
    onPropertyAction(currentProperty.id, action);
    
    if (action !== 'dislike') {
      console.log(`Property ${action}d!`);
    }
    
    if (currentPropertyIndex < mockProperties.length - 1) {
      setCurrentPropertyIndex(currentPropertyIndex + 1);
    } else {
      setCurrentPropertyIndex(0);
    }
  };

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
            <Button onClick={onOpenChat} variant="outline" size="sm" className="px-3 py-2 text-xs shadow-sm">
              Ask Questions
            </Button>
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
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 py-2 text-xs shadow-sm"
                  >
                    <X size={14} className="mr-1" />
                    Pass
                  </Button>
                  <Button
                    onClick={() => handleAction('save')}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 py-2 text-xs shadow-sm"
                  >
                    <Bookmark size={14} className="mr-1" />
                    Save
                  </Button>
                  <Button
                    onClick={() => handleAction('like')}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 py-2 text-xs shadow-md"
                  >
                    <Heart size={14} className="mr-1" />
                    Love It
                  </Button>
                </div>

                {/* Schedule Tour Button */}
                <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 py-2 text-xs shadow-md">
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
            Property {currentPropertyIndex + 1} of {mockProperties.length}
          </p>
          <div className="flex justify-center space-x-2">
            {mockProperties.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors shadow-sm ${
                  index === currentPropertyIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertySwiping;
