
import { Calendar, Heart, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Property {
  id: string; // Changed from number to string to match database UUIDs
  address: string;
  city: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  image: string;
  status: string;
  currentStage: string;
  actionNeeded: string;
  lastActivity: string;
}

interface PropertyGridProps {
  properties: Property[];
  onPropertyClick: (propertyId: string) => void; // Changed from number to string
}

const PropertyGrid = ({ properties, onPropertyClick }: PropertyGridProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'tour_scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'liked':
        return 'bg-red-100 text-red-800';
      case 'offer_made':
        return 'bg-orange-100 text-orange-800';
      case 'interested':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'tour_scheduled':
        return 'Tour Scheduled';
      case 'liked':
        return 'Liked';
      case 'offer_made':
        return 'Offer Made';
      case 'interested':
        return 'Interested';
      default:
        return 'New';
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Properties</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {properties.map((property) => (
          <Card 
            key={property.id} 
            className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all cursor-pointer group overflow-hidden"
            onClick={() => onPropertyClick(property.id)}
          >
            <CardContent className="p-0">
              <div className="space-y-0">
                <div className="relative w-full h-56 bg-gray-200 overflow-hidden">
                  <img 
                    src={property.image} 
                    alt={`${property.address} property image`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png') {
                        target.src = '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png';
                      }
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className={getStatusColor(property.status)}>
                      {getStatusText(property.status)}
                    </Badge>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                </div>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <MapPin size={16} className="text-gray-500" />
                        <p className="font-semibold text-gray-900">
                          {property.address}
                        </p>
                      </div>
                      <p className="text-gray-600 mb-3">{property.city}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${property.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                    <span>{property.beds} beds</span>
                    <span>•</span>
                    <span>{property.baths} baths</span>
                    <span>•</span>
                    <span>{property.sqft} sqft</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Calendar size={14} className="mr-1" />
                      Schedule Tour
                    </Button>
                    <Button size="sm" variant="outline" className="flex-shrink-0">
                      <Heart size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PropertyGrid;
