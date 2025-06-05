
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
      console.log(`Property ${action}d!`);
    }
    
    if (currentPropertyIndex < mockProperties.length - 1) {
      setCurrentPropertyIndex(currentPropertyIndex + 1);
    } else {
      setCurrentPropertyIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Your Property Matches</h1>
              <p className="text-lg text-gray-600 mt-2">Discover properties curated just for you</p>
            </div>
            <Button onClick={onOpenChat} variant="outline" size="lg" className="px-8 py-4 text-lg">
              Ask Questions
            </Button>
          </div>
        </div>
      </div>

      {/* Property Card */}
      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Property Image */}
          <div className="relative">
            <Card className="overflow-hidden shadow-xl">
              <div className="aspect-[4/3] bg-gray-200 relative">
                <img 
                  src={currentProperty.image} 
                  alt={currentProperty.address}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-6 left-6">
                  <Badge className="bg-blue-600 hover:bg-blue-600 text-lg px-4 py-2">
                    <Star size={16} className="mr-2" />
                    Perfect Match
                  </Badge>
                </div>
                <div className="absolute top-6 right-6">
                  <Badge variant="secondary" className="text-base px-4 py-2">
                    {currentProperty.daysOnMarket} days on market
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Property Details */}
          <div className="space-y-8">
            <Card className="shadow-lg">
              <CardContent className="p-8 space-y-6">
                {/* Property Info */}
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-3xl font-bold text-gray-900">
                      ${(currentProperty.price / 1000000).toFixed(2)}M
                    </h3>
                    <Badge variant="outline" className="text-lg px-4 py-2">{currentProperty.neighborhood}</Badge>
                  </div>
                  <div className="flex items-start space-x-3 mb-6">
                    <MapPin size={20} className="text-gray-500 mt-1 flex-shrink-0" />
                    <p className="text-lg text-gray-700">{currentProperty.address}</p>
                  </div>
                  <div className="flex items-center space-x-6 text-lg text-gray-600 mb-6">
                    <span className="font-medium">{currentProperty.beds} beds</span>
                    <span>•</span>
                    <span className="font-medium">{currentProperty.baths} baths</span>
                    <span>•</span>
                    <span className="font-medium">{currentProperty.sqft?.toLocaleString()} sqft</span>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h4>
                  <div className="flex flex-wrap gap-3">
                    {currentProperty.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-base px-4 py-2">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Insights */}
                {showInsights && (
                  <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Info size={20} className="text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="text-lg font-semibold text-blue-900 mb-3">
                          Why this is suggested for you
                        </h4>
                        <p className="text-base text-blue-800 leading-relaxed">
                          {currentProperty.insights.whySuggested}
                        </p>
                        {currentProperty.insights.profileDeviation && (
                          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-800">
                              <strong>Note:</strong> {currentProperty.insights.profileDeviation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <Button
                    onClick={() => handleAction('dislike')}
                    variant="outline"
                    size="lg"
                    className="flex-1 border-red-200 text-red-600 hover:bg-red-50 py-4 text-lg"
                  >
                    <X size={20} className="mr-3" />
                    Pass
                  </Button>
                  <Button
                    onClick={() => handleAction('save')}
                    variant="outline"
                    size="lg"
                    className="flex-1 border-yellow-200 text-yellow-600 hover:bg-yellow-50 py-4 text-lg"
                  >
                    <Bookmark size={20} className="mr-3" />
                    Save
                  </Button>
                  <Button
                    onClick={() => handleAction('like')}
                    size="lg"
                    className="flex-1 bg-green-600 hover:bg-green-700 py-4 text-lg"
                  >
                    <Heart size={20} className="mr-3" />
                    Love It
                  </Button>
                </div>

                {/* Schedule Tour Button */}
                <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg">
                  <Calendar size={20} className="mr-3" />
                  Schedule Tour (Auto-booking in progress...)
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-600 mb-4">
            Property {currentPropertyIndex + 1} of {mockProperties.length}
          </p>
          <div className="flex justify-center space-x-2">
            {mockProperties.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
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
