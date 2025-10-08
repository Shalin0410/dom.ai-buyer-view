import React from 'react';
import { Calendar, MapPin, TrendingUp, AlertCircle, Home, Bath, Bed, Heart, Clock, DollarSign, Eye, FileText } from 'lucide-react';
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
  // Enhanced status colors with modern design
  const getStatusConfig = (status: string) => {
    const configs = {
      'researching': {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-700',
        dot: 'bg-blue-500',
        label: 'Researching'
      },
      'viewing': {
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
        label: 'Viewing'
      },
      'offer_submitted': {
        bg: 'bg-orange-50 border-orange-200',
        text: 'text-orange-700',
        dot: 'bg-orange-500',
        label: 'Offer Submitted'
      },
      'under_contract': {
        bg: 'bg-purple-50 border-purple-200',
        text: 'text-purple-700',
        dot: 'bg-purple-500',
        label: 'Under Contract'
      },
      'in_escrow': {
        bg: 'bg-indigo-50 border-indigo-200',
        text: 'text-indigo-700',
        dot: 'bg-indigo-500',
        label: 'In Escrow'
      },
      'closed': {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-700',
        dot: 'bg-green-500',
        label: 'Closed'
      },
      'withdrawn': {
        bg: 'bg-gray-50 border-gray-200',
        text: 'text-gray-700',
        dot: 'bg-gray-500',
        label: 'Withdrawn'
      }
    };
    return configs[status as keyof typeof configs] || configs['researching'];
  };

  // Enhanced action colors
  const getActionConfig = (action: string) => {
    if (action === 'none') return null;
    
    const configs = {
      'schedule_viewing': {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-700',
        icon: Eye,
        label: 'Schedule Viewing'
      },
      'submit_offer': {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-700',
        icon: DollarSign,
        label: 'Submit Offer'
      },
      'review_disclosures_reports': {
        bg: 'bg-orange-50 border-orange-200',
        text: 'text-orange-700',
        icon: FileText,
        label: 'Review Disclosures & Reports'
      },
      'inspection': {
        bg: 'bg-purple-50 border-purple-200',
        text: 'text-purple-700',
        icon: Home,
        label: 'Inspection'
      },
      'appraisal': {
        bg: 'bg-indigo-50 border-indigo-200',
        text: 'text-indigo-700',
        icon: TrendingUp,
        label: 'Appraisal'
      },
      'final_walkthrough': {
        bg: 'bg-amber-50 border-amber-200',
        text: 'text-amber-700',
        icon: Eye,
        label: 'Final Walkthrough'
      }
    };

    const actionKey = action.replace(/\s+/g, '_').toLowerCase();
    return configs[actionKey as keyof typeof configs];
  };

  const formatPrice = (price: number) => {
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
  const statusConfig = getStatusConfig(property.status);
  const actionConfig = getActionConfig(property.action_required);

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
    <Card className="group overflow-hidden bg-white border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 cursor-pointer" onClick={handleCardClick}>
      {/* Property Image */}
      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
        {primaryPhoto ? (
          <img 
            src={primaryPhoto.url} 
            alt={property.address}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <Home className="h-16 w-16 text-gray-400" />
          </div>
        )}
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${statusConfig.bg} ${statusConfig.text} backdrop-blur-sm`}>
            <div className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
            <span className="text-xs font-medium">{statusConfig.label}</span>
          </div>
        </div>
        
        {/* Action Required Badge */}
        {actionConfig && (
          <div className="absolute top-3 right-3">
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${actionConfig.bg} ${actionConfig.text} backdrop-blur-sm`}>
              <AlertCircle className="w-3 h-3" />
              <span className="text-xs font-medium">Action Required</span>
            </div>
          </div>
        )}

        {/* Photo Count */}
        {property.photos && property.photos.length > 1 && (
          <div className="absolute bottom-3 right-3">
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-black/50 text-white backdrop-blur-sm">
              <span className="text-xs font-medium">{property.photos.length}</span>
              <span className="text-xs">photos</span>
            </div>
          </div>
        )}
      </div>
      
      <CardContent className="p-5">
        {/* Address and Price */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {property.address}
                </p>
                <p className="text-xs text-gray-600">
                  {property.city}, {property.state} {property.zip_code}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right ml-3">
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(property.listing_price)}
            </p>
            {property.purchase_price && ['under_contract', 'in_escrow', 'closed'].includes(property.status) && (
              <p className="text-sm text-green-600 font-medium">
                Purchase: {formatPrice(property.purchase_price)}
              </p>
            )}
          </div>
        </div>
        
        {/* Property Details */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4" />
            <span className="font-medium">{property.bedrooms}</span>
            <span className="text-xs">bed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4" />
            <span className="font-medium">{property.bathrooms}</span>
            <span className="text-xs">bath</span>
          </div>
          {property.square_feet && (
            <div className="flex items-center gap-1.5">
              <Home className="w-4 h-4" />
              <span className="font-medium">{property.square_feet.toLocaleString()}</span>
              <span className="text-xs">sqft</span>
            </div>
          )}
        </div>

        {/* Last Activity and Action */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {mode === 'tracked' ? formatLastActivity(property.last_activity_at) : 'Available Property'}
          </div>
          
          {mode === 'tracked' && actionConfig && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-medium ${actionConfig.bg} ${actionConfig.text}`}>
              <actionConfig.icon className="w-3 h-3" />
              <span>{actionConfig.label}</span>
            </div>
          )}
          
          {mode === 'browse' && (
            <Button 
              size="sm" 
              className="add-to-interested-btn h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleAddToInterested}
            >
              <Heart className="h-3 w-3 mr-1.5" />
              Add to Interested
            </Button>
          )}
        </div>

        {/* Additional Property Info for Tracked Mode */}
        {mode === 'tracked' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center text-xs">
              <div className="flex items-center gap-4">
                <span className="text-gray-500">
                  <span className="font-medium text-gray-700">{property.property_type.replace('_', ' ')}</span>
                </span>
                {property.year_built && (
                  <span className="text-gray-500">
                    Built <span className="font-medium text-gray-700">{property.year_built}</span>
                  </span>
                )}
              </div>
              {property.mls_number && (
                <span className="text-gray-500">
                  MLS: <span className="font-medium text-gray-700">{property.mls_number}</span>
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
