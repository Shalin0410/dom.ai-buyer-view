import React from 'react';
import { Calendar, MapPin, TrendingUp, AlertCircle, Home, Bath, Bed, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Property, PropertyStatus, ActionRequired } from '@/services/api/types';

// Extend the Property interface to include the optional statusText field
interface PropertyWithStatusText extends Property {
  statusText?: string;
}

interface PropertyCardProps {
  property: PropertyWithStatusText;
  onClick?: () => void;
  mode?: 'tracked' | 'browse';
  onAddToInterested?: (propertyId: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, mode = 'tracked', onAddToInterested }) => {
  // Get status color based on status value
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'researching':
        return 'bg-blue-100 text-blue-800';
      case 'viewing':
        return 'bg-yellow-100 text-yellow-800';
      case 'offer_submitted':
        return 'bg-orange-100 text-orange-800';
      case 'under_contract':
        return 'bg-purple-100 text-purple-800';
      case 'in_escrow':
        return 'bg-indigo-100 text-indigo-800';
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get action text for the action required badge
  const getActionText = (action: string) => {
    if (action === 'none') return null;
    
    // If action is already in a display format, return as is
    if (typeof action === 'string' && action.includes(' ')) {
      return action;
    }
    
    // Otherwise, format the action key into a display string
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}K`;
    }
    return `$${price.toLocaleString()}`;
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const primaryPhoto = property.photos?.find(photo => photo.is_primary) || property.photos?.[0];
  const actionText = property.action_required ? getActionText(property.action_required) : null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on the Add to Interested button
    if ((e.target as HTMLElement).closest('.add-to-interested-btn')) {
      return;
    }
    onClick?.();
  };

  const handleAddToInterested = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToInterested?.(property.id);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={handleCardClick}>
      <div className="aspect-[16/10] bg-gray-200 relative">
        {primaryPhoto ? (
          <img 
            src={primaryPhoto.url} 
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Home className="h-12 w-12 text-gray-400" />
          </div>
        )}
        
        <div className="absolute top-3 left-3">
          <Badge className={getStatusColor(property.status)}>
            {property.statusText || property.status}
          </Badge>
        </div>
        
        {actionText && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-red-100 text-red-800">
              <AlertCircle size={12} className="mr-1" />
              Action Required
            </Badge>
          </div>
        )}
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
            <p className="text-xs text-gray-500">
              {property.city}, {property.state} {property.zip_code}
            </p>
          </div>
          <div className="text-right ml-2">
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(property.listing_price)}
            </p>
            {property.purchase_price && property.status === 'in_escrow' && (
              <p className="text-sm text-green-600 font-medium">
                Purchase: {formatPrice(property.purchase_price)}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center">
            <Bed size={14} className="mr-1" />
            <span>{property.bedrooms}</span>
          </div>
          <div className="flex items-center">
            <Bath size={14} className="mr-1" />
            <span>{property.bathrooms}</span>
          </div>
          {property.square_feet && (
            <span>{property.square_feet.toLocaleString()} sqft</span>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {mode === 'tracked' ? `Last activity: ${formatLastActivity(property.last_activity_at)}` : 'Available Property'}
          </div>
          {mode === 'tracked' && actionText && (
            <Badge variant="outline" className="text-xs">
              {actionText}
            </Badge>
          )}
          {mode === 'browse' && (
            <Button 
              size="sm" 
              variant="outline" 
              className="add-to-interested-btn h-7 px-2 text-xs"
              onClick={handleAddToInterested}
            >
              <Heart className="h-3 w-3 mr-1" />
              Add to Interested
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
