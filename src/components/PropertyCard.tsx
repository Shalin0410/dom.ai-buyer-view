
import { Calendar, MapPin, TrendingUp, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PropertyCard = ({ property }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'viewing_scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'interested':
        return 'bg-green-100 text-green-800';
      case 'offer_made':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'viewing_scheduled':
        return 'Viewing Scheduled';
      case 'interested':
        return 'Interested';
      case 'offer_made':
        return 'Offer Made';
      default:
        return 'New';
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[16/10] bg-gray-200 relative">
        <img 
          src={property.image} 
          alt={property.address}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <Badge className="bg-green-600 hover:bg-green-600 text-white">
            <Star size={12} className="mr-1" />
            {property.fitScore}% Match
          </Badge>
        </div>
        <div className="absolute top-3 right-3">
          <Badge className={getStatusColor(property.status)}>
            {getStatusText(property.status)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-start space-x-2 mb-1">
              <MapPin size={14} className="text-gray-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {property.address}
              </p>
            </div>
          </div>
          <p className="text-lg font-bold text-gray-900 ml-2">
            ${(property.price / 1000).toFixed(0)}k
          </p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <span>{property.beds} beds</span>
          <span>•</span>
          <span>{property.baths} baths</span>
          <span>•</span>
          <span>{property.sqft?.toLocaleString()} sqft</span>
        </div>

        <div className="flex space-x-2">
          {property.status === 'viewing_scheduled' ? (
            <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Calendar size={14} className="mr-1" />
              View Tomorrow 2PM
            </Button>
          ) : (
            <Button size="sm" className="flex-1">
              <Calendar size={14} className="mr-1" />
              Schedule Tour
            </Button>
          )}
          <Button size="sm" variant="outline">
            <TrendingUp size={14} className="mr-1" />
            Details
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
