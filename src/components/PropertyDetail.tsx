import React, { useState } from 'react';
import { useProperty, usePropertyActivities } from '@/hooks/useProperties';
import { Property, PropertyActivity } from '@/services/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ViewingScheduleModal } from '@/components/ViewingScheduleModal';
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
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Eye,
  TrendingUp,
  Banknote,
  Calculator
} from 'lucide-react';

interface PropertyDetailProps {
  propertyId: string;
  onBack: () => void;
  buyerInfo?: {
    id: string;
    name: string;
    email: string;
  };
  agentEmail?: string;
}

export const PropertyDetail: React.FC<PropertyDetailProps> = ({ 
  propertyId, 
  onBack, 
  buyerInfo = { id: '', name: 'Buyer', email: '' },
  agentEmail = 'agent@example.com'
}) => {
  const { property, loading, error, updateProperty } = useProperty(propertyId);
  const { activities, addActivity } = usePropertyActivities(propertyId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProperty, setEditedProperty] = useState<Partial<Property>>({});
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'note' as const,
    title: '',
    description: ''
  });
  const [showAddActivity, setShowAddActivity] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading property details...</span>
      </div>
    );
  }

  if (error || !property) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Property not found</h3>
            <p className="text-red-700 mb-4">{error || 'Property not found'}</p>
            <Button onClick={onBack} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
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
      created_by: property.buyer_id || ''
    });

    if (success) {
      setNewActivity({ type: 'note', title: '', description: '' });
      setShowAddActivity(false);
    }
  };

  const handleScheduleConfirm = async (schedulingData: {
    propertyId: string;
    selectedDates: Date[];
    additionalInfo: string;
  }) => {
    // This would normally update the buyer_properties table through the service layer
    // For now, we'll just simulate success and add an activity
    const success = await addActivity({
      property_id: propertyId,
      type: 'viewing',
      title: 'Viewing Scheduled',
      description: `Viewing scheduled for ${schedulingData.selectedDates.length} preferred dates. ${schedulingData.additionalInfo ? `Additional info: ${schedulingData.additionalInfo}` : ''}`,
      created_by: buyerInfo.id || ''
    });

    if (success) {
      setIsScheduleModalOpen(false);
      return true;
    }
    return false;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      'researching': { color: 'bg-blue-500', label: 'Researching', progress: 10 },
      'viewing': { color: 'bg-amber-500', label: 'Viewing', progress: 25 },
      'offer_submitted': { color: 'bg-orange-500', label: 'Offer Submitted', progress: 50 },
      'under_contract': { color: 'bg-purple-500', label: 'Under Contract', progress: 75 },
      'in_escrow': { color: 'bg-indigo-500', label: 'In Escrow', progress: 90 },
      'closed': { color: 'bg-green-500', label: 'Closed', progress: 100 },
      'withdrawn': { color: 'bg-gray-500', label: 'Withdrawn', progress: 0 }
    };
    return configs[status as keyof typeof configs] || configs['researching'];
  };

  const getBuyingStageConfig = (stage: string) => {
    const configs = {
      'initial_research': { icon: Eye, label: 'Initial Research', description: 'Exploring options and gathering information' },
      'active_search': { icon: TrendingUp, label: 'Active Search', description: 'Actively viewing properties and comparing options' },
      'offer_negotiation': { icon: DollarSign, label: 'Offer Negotiation', description: 'Making offers and negotiating terms' },
      'under_contract': { icon: FileText, label: 'Under Contract', description: 'Property is under contract, proceeding to close' },
      'closing': { icon: CheckCircle, label: 'Closing', description: 'Finalizing the purchase and preparing for handover' }
    };
    return configs[stage as keyof typeof configs] || configs['initial_research'];
  };

  const getActionConfig = (action: string) => {
    if (action === 'none') return null;
    
    const configs = {
      'schedule_viewing': { icon: Eye, color: 'text-blue-700', bg: 'bg-blue-50', label: 'Schedule Viewing' },
      'submit_offer': { icon: DollarSign, color: 'text-green-700', bg: 'bg-green-50', label: 'Submit Offer' },
      'review_disclosures_reports': { icon: FileText, color: 'text-orange-700', bg: 'bg-orange-50', label: 'Review Disclosures & Reports' },
      'inspection': { icon: Home, color: 'text-purple-700', bg: 'bg-purple-50', label: 'Inspection' },
      'appraisal': { icon: TrendingUp, color: 'text-indigo-700', bg: 'bg-indigo-50', label: 'Appraisal' },
      'final_walkthrough': { icon: Eye, color: 'text-amber-700', bg: 'bg-amber-50', label: 'Final Walkthrough' }
    };
    return configs[action as keyof typeof configs];
  };

  const statusConfig = getStatusConfig(property.status);
  const stageConfig = getBuyingStageConfig(property.buying_stage);
  const actionConfig = getActionConfig(property.action_required);
  const primaryPhoto = property.photos.find(photo => photo.is_primary) || property.photos[0];

  // Calculate estimated net sheet
  const estimatedClosingCosts = (property.purchase_price || property.listing_price) * 0.03; // 3% estimate
  const estimatedDownPayment = (property.purchase_price || property.listing_price) * 0.20; // 20% estimate
  const estimatedLoanAmount = (property.purchase_price || property.listing_price) - estimatedDownPayment;

  return (
    <div className="space-y-8">
      {/* Header with Timeline Progress */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Properties
          </Button>
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium text-white ${statusConfig.color}`}>
              <div className="w-2 h-2 rounded-full bg-white/80" />
              {statusConfig.label}
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSaveEdit} className="bg-green-600 hover:bg-green-700">
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

        {/* Progress Timeline */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Purchase Progress</h3>
                <span className="text-sm text-gray-600">{statusConfig.progress}% Complete</span>
              </div>
              <Progress value={statusConfig.progress} className="h-3" />
              <div className="flex items-center gap-3">
                <stageConfig.icon className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{stageConfig.label}</p>
                  <p className="text-sm text-gray-600">{stageConfig.description}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
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
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Home className="h-20 w-20 text-gray-400" />
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
                    {property.photos.length > 5 && (
                      <div className="aspect-square bg-gray-200 rounded overflow-hidden flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">+{property.photos.length - 5} more</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                <div>
                  <p className="font-semibold text-lg text-gray-900">{property.address}</p>
                  <p className="text-gray-600">{property.city}, {property.state} {property.zip_code}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bed className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                  <p className="text-sm text-gray-600">Bedrooms</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <Bath className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                  <p className="text-sm text-gray-600">Bathrooms</p>
                </div>
                {property.square_feet && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Home className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.square_feet.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Sq Ft</p>
                  </div>
                )}
                {property.year_built && (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-900">{property.year_built}</p>
                    <p className="text-sm text-gray-600">Year Built</p>
                  </div>
                )}
              </div>

              {property.notes && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Notes</Label>
                  <p className="text-gray-800 mt-2 p-3 bg-gray-50 rounded-lg">{property.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities Timeline */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Activity Timeline
              </CardTitle>
              <Button 
                size="sm" 
                onClick={() => setShowAddActivity(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Activity
              </Button>
            </CardHeader>
            <CardContent>
              {showAddActivity && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
                  <div>
                    <Label htmlFor="activity-title">Title</Label>
                    <Input
                      id="activity-title"
                      value={newActivity.title}
                      onChange={(e) => setNewActivity(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Activity title..."
                      className="mt-1"
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
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddActivity} className="bg-green-600 hover:bg-green-700">
                      Add Activity
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowAddActivity(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        <span className="text-sm text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-gray-700 text-sm">{activity.description}</p>
                      )}
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No activities yet</p>
                    <p className="text-sm text-gray-400">Add your first activity to start tracking your progress</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing & Financial */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600">Listing Price</Label>
                <p className="text-3xl font-bold text-gray-900">{formatPrice(property.listing_price)}</p>
              </div>
              {property.purchase_price && ['under_contract', 'in_escrow', 'closed'].includes(property.status) && (
                <div className="pt-3 border-t border-gray-200">
                  <Label className="text-sm text-gray-600">Purchase Price</Label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPrice(property.purchase_price)}
                  </p>
                  <div className="mt-2 text-sm">
                    {property.purchase_price < property.listing_price ? (
                      <span className="text-green-600">
                        ↓ {formatPrice(property.listing_price - property.purchase_price)} under listing
                      </span>
                    ) : property.purchase_price > property.listing_price ? (
                      <span className="text-red-600">
                        ↑ {formatPrice(property.purchase_price - property.listing_price)} over listing
                      </span>
                    ) : (
                      <span className="text-gray-600">At listing price</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              {actionConfig ? (
                <div className={`space-y-3 p-4 rounded-lg border ${actionConfig.bg}`}>
                  <div className="flex items-center gap-3">
                    <actionConfig.icon className={`h-5 w-5 ${actionConfig.color}`} />
                    <div>
                      <h4 className={`font-medium ${actionConfig.color}`}>{actionConfig.label}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Complete this action to move forward with your purchase.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">No immediate action required</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estimated Net Sheet */}
          {(property.purchase_price || property.status !== 'researching') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Estimated Net Sheet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Purchase Price</span>
                  <span className="font-medium">{formatPrice(property.purchase_price || property.listing_price)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Down Payment (20%)</span>
                  <span className="font-medium text-red-600">-{formatPrice(estimatedDownPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Closing Costs (~3%)</span>
                  <span className="font-medium text-red-600">-{formatPrice(estimatedClosingCosts)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>Loan Amount</span>
                  <span>{formatPrice(estimatedLoanAmount)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-lg">
                  <span>Total Cash Needed</span>
                  <span className="text-red-600">{formatPrice(estimatedDownPayment + estimatedClosingCosts)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-3">
                  *Estimates only. Actual costs may vary.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => setIsScheduleModalOpen(true)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Viewing
              </Button>
              <Button className="w-full" variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                View Documents
              </Button>
              <Button className="w-full" variant="outline">
                <Banknote className="h-4 w-4 mr-2" />
                Get Pre-approved
              </Button>
              {property.listing_url && (
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => window.open(property.listing_url, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Original Listing
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Viewing Schedule Modal */}
      {property && (
        <ViewingScheduleModal
          isOpen={isScheduleModalOpen}
          onClose={() => setIsScheduleModalOpen(false)}
          property={property}
          buyerName={buyerInfo.name}
          buyerEmail={buyerInfo.email}
          agentEmail={agentEmail}
          onScheduleConfirm={handleScheduleConfirm}
        />
      )}
    </div>
  );
};
