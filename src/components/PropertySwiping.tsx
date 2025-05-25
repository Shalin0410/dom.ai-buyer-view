
import { useState, useEffect } from 'react';
import { Heart, X, Bookmark, Info, MapPin, Calendar, Star } from 'lucide-react';
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
        profileDeviation: undefined
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
        profileDeviation: "This is outside your preferred Mission neighborhood"
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
      // Show success message for like/save actions
      console.log(`Property ${action}d!`);
    }
    
    // Move to next property
    if (currentPropertyIndex < mockProperties.length - 1) {
      setCurrentPropertyIndex(currentPropertyIndex + 1);
    } else {
      // Reset to first property (in real app, would load more)
      setCurrentPropertyIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Your Matches</h1>
              <p className="text-sm text-gray-600">Swipe to find your perfect home</p>
            </div>
            <Button onClick={onOpenChat} variant="outline" size="sm">
              Ask Questions
            </Button>
          </div>
        </div>
      </div>

      {/* Property Card */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <Card className="overflow-hidden shadow-lg">
          {/* Property Image */}
          <div className="aspect-[4/3] bg-gray-200 relative">
            <img 
              src={currentProperty.image} 
              alt={currentProperty.address}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-blue-600 hover:bg-blue-600">
                <Star size={12} className="mr-1" />
                Perfect Match
              </Badge>
            </div>
            <div className="absolute top-4 right-4">
              <Badge variant="secondary">
                {currentProperty.daysOnMarket} days on market
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {/* Property Info */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  ${(currentProperty.price / 1000000).toFixed(2)}M
                </h3>
                <Badge variant="outline">{currentProperty.neighborhood}</Badge>
              </div>
              <div className="flex items-start space-x-2 mb-3">
                <MapPin size={16} className="text-gray-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">{currentProperty.address}</p>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                <span>{currentProperty.beds} beds</span>
                <span>•</span>
                <span>{currentProperty.baths} baths</span>
                <span>•</span>
                <span>{currentProperty.sqft?.toLocaleString()} sqft</span>
              </div>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Key Features</h4>
              <div className="flex flex-wrap gap-2">
                {currentProperty.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Insights */}
            {showInsights && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-start space-x-2">
                  <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">
                      Why this is suggested for you
                    </h4>
                    <p className="text-sm text-blue-800">
                      {currentProperty.insights.whySuggested}
                    </p>
                    {currentProperty.insights.profileDeviation && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-800">
                          <strong>Note:</strong> {currentProperty.insights.profileDeviation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-2">
              <Button
                onClick={() => handleAction('dislike')}
                variant="outline"
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              >
                <X size={20} className="mr-2" />
                Pass
              </Button>
              <Button
                onClick={() => handleAction('save')}
                variant="outline"
                className="flex-1 border-yellow-200 text-yellow-600 hover:bg-yellow-50"
              >
                <Bookmark size={20} className="mr-2" />
                Save
              </Button>
              <Button
                onClick={() => handleAction('like')}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Heart size={20} className="mr-2" />
                Love It
              </Button>
            </div>

            {/* Schedule Tour Button */}
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Calendar size={16} className="mr-2" />
              Schedule Tour (Auto-booking in progress...)
            </Button>
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Property {currentPropertyIndex + 1} of {mockProperties.length}
          </p>
          <div className="flex justify-center mt-2 space-x-1">
            {mockProperties.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
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
