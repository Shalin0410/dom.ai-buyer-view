import React, { useState } from 'react';
import { useProperty, usePropertyActivities } from '@/hooks/useProperties';
import { Property, PropertyActivity } from '@/services/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  MapPin, 
  Home, 
  Bath, 
  Bed, 
  Calendar,
  DollarSign,
  FileText,
  MessageSquare,
  Plus,
  Edit,
  Save,
  X,
  Loader2
} from 'lucide-react';

interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ propertyId, onBack }) => {
  const { property, loading, error, updateProperty } = useProperty(propertyId);
  const { activities, addActivity } = usePropertyActivities(propertyId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState<Partial<Property>>({});
  const [newActivity, setNewActivity] = useState({
    type: 'note' as const,
    title: '',
    description: ''
  });
  const [showAddActivity, setShowAddActivity] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading property details...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || 'Property not found'}</p>
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleSaveEdit = async () => {
    const success = await updateProperty(editedProperty);
    if (success) {
      setIsEditing(false);
      setEditedProperty({});
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedProperty({});
  };

  const handleAddActivity = async () => {
    if (!newActivity.title.trim()) return;
    
    const success = await addActivity({
      property_id: propertyId,
      type: newActivity.type,
      title: newActivity.title,
      description: newActivity.description,
      created_by: property.buyer_id
    });

    if (success) {
      setNewActivity({ type: 'note', title: '', description: '' });
      setShowAddActivity(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'researching': return 'bg-blue-100 text-blue-800';
      case 'viewing': return 'bg-yellow-100 text-yellow-800';
      case 'offer_submitted': return 'bg-orange-100 text-orange-800';
      case 'under_contract': return 'bg-purple-100 text-purple-800';
      case 'in_escrow': return 'bg-indigo-100 text-indigo-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const primaryPhoto = property.photos.find(photo => photo.is_primary) || property.photos[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Properties
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(property.status)}>
            {property.status.replace('_', ' ')}
          </Badge>
          {!isEditing ? (
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSaveEdit}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Property Images */}
          <Card>
            <CardContent className="p-0">
              <div className="aspect-[16/10] bg-gray-200 relative rounded-t-lg overflow-hidden">
                {primaryPhoto ? (
                  <img 
                    src={primaryPhoto.url} 
                    alt={property.address}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <Home className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              {property.photos.length > 1 && (
                <div className="p-4">
                  <div className="grid grid-cols-4 gap-2">
                    {property.photos.slice(1, 5).map((photo, index) => (
                      <div key={photo.id} className="aspect-square bg-gray-200 rounded overflow-hidden">
                        <img 
                          src={photo.url} 
                          alt={`${property.address} - ${index + 2}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle>Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                <div>
                  <p className="font-medium">{property.address}</p>
                  <p className="text-gray-600">{property.city}, {property.state} {property.zip_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-2">
                  <Bed className="h-4 w-4 text-gray-500" />
                  <span>{property.bedrooms} Bedrooms</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bath className="h-4 w-4 text-gray-500" />
                  <span>{property.bathrooms} Bathrooms</span>
                </div>
                {property.square_feet && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-gray-500" />
                    <span>{property.square_feet.toLocaleString()} sqft</span>
                  </div>
                )}
                {property.year_built && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Built {property.year_built}</span>
                  </div>
                )}
              </div>

              {property.notes && (
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-gray-700 mt-1">{property.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Timeline</CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowAddActivity(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Activity
              </Button>
            </CardHeader>
            <CardContent>
              {showAddActivity && (
                <div className="mb-4 p-4 border rounded-lg space-y-3">
                  <div>
                    <Label htmlFor="activity-title">Title</Label>
                    <Input
                      id="activity-title"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Activity title..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="activity-description">Description</Label>
                    <Textarea
                      id="activity-description"
                      value={newActivity.description}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Activity description..."
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddActivity}>
                      Add Activity
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddActivity(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3 pb-4 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{activity.title}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-gray-600 mt-1">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No activities yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-gray-600">Listing Price</Label>
                <p className="text-2xl font-bold">{formatPrice(property.listing_price)}</p>
              </div>
              {property.purchase_price && property.status === 'in_escrow' && (
                <div>
                  <Label className="text-sm text-gray-600">Purchase Price</Label>
                  <p className="text-xl font-semibold text-green-600">
                    {formatPrice(property.purchase_price)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle>Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              {property.action_required !== 'none' ? (
                <div className="space-y-2">
                  <Badge className="bg-red-100 text-red-800">
                    {property.action_required.replace('_', ' ')}
                  </Badge>
                  <p className="text-sm text-gray-600">
                    Action required to move forward with this property.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No immediate action required.</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Viewing
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
              {property.listing_url && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open(property.listing_url, '_blank')}
                >
                  View Listing
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
