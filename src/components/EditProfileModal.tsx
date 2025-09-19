import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Save, X, User, Home, DollarSign, Star, Plus, Trash2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { dataService } from '@/services';
import { UserProfile } from '@/hooks/useUserProfile';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onProfileUpdate: () => void;
}

interface ProfileFormData {
  // Personal info
  first_name: string;
  last_name: string;
  phone: string;

  // Price range and financing
  price_min: number | null;
  price_max: number | null;
  budget_approved: boolean | null;
  pre_approval_amount: number | null;
  pre_approval_expiry: Date | null;
  down_payment_amount: number | null;

  // Buyer preferences
  buyer_needs: string;
  preferred_areas: string[];
  property_type_preferences: string[];
  must_have_features: string[];
  nice_to_have_features: string[];
  bathrooms: number | null;
  bedrooms: number | null;
  ideal_move_in_date: Date | null;
  urgency_level: string;
}

const propertyTypes = [
  'Single Family Home',
  'Condo',
  'Townhouse',
  'Multi-Family',
  'Land/Lot',
  'Mobile Home',
  'Other'
];

const commonFeatures = [
  'Swimming Pool',
  'Garage',
  'Hardwood Floors',
  'Updated Kitchen',
  'Master Suite',
  'Walk-in Closet',
  'Fireplace',
  'Basement',
  'Deck/Patio',
  'Garden/Yard',
  'Air Conditioning',
  'Dishwasher',
  'Washer/Dryer',
  'Security System',
  'Elevator'
];

const urgencyLevels = [
  { value: 'low', label: 'Low - Just browsing' },
  { value: 'medium', label: 'Medium - Actively looking' },
  { value: 'high', label: 'High - Ready to buy soon' },
  { value: 'urgent', label: 'Urgent - Need to move ASAP' }
];

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdate
}) => {
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    phone: '',
    price_min: null,
    price_max: null,
    budget_approved: null,
    pre_approval_amount: null,
    pre_approval_expiry: null,
    down_payment_amount: null,
    buyer_needs: '',
    preferred_areas: [],
    property_type_preferences: [],
    must_have_features: [],
    nice_to_have_features: [],
    bathrooms: null,
    bedrooms: null,
    ideal_move_in_date: null,
    urgency_level: ''
  });

  const [originalFormData, setOriginalFormData] = useState<ProfileFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newArea, setNewArea] = useState('');

  // Initialize form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      // Note: Supabase returns buyer_profiles as an object, not an array
      const buyerProfile = userProfile.buyer_profiles;

      const initialData = {
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        phone: userProfile.phone || '',
        price_min: buyerProfile?.price_min || null,
        price_max: buyerProfile?.price_max || null,
        budget_approved: buyerProfile?.budget_approved ?? null,
        pre_approval_amount: buyerProfile?.pre_approval_amount || null,
        pre_approval_expiry: buyerProfile?.pre_approval_expiry ? new Date(buyerProfile.pre_approval_expiry) : null,
        down_payment_amount: buyerProfile?.down_payment_amount || null,
        buyer_needs: buyerProfile?.buyer_needs || '',
        preferred_areas: buyerProfile?.preferred_areas || [],
        property_type_preferences: buyerProfile?.property_type_preferences || [],
        must_have_features: buyerProfile?.must_have_features || [],
        nice_to_have_features: buyerProfile?.nice_to_have_features || [],
        bathrooms: buyerProfile?.bathrooms || null,
        bedrooms: buyerProfile?.bedrooms || null,
        ideal_move_in_date: buyerProfile?.ideal_move_in_date ? new Date(buyerProfile.ideal_move_in_date) : null,
        urgency_level: buyerProfile?.urgency_level || ''
      };

      setFormData(initialData);
      setOriginalFormData(initialData); // Store original data for comparison
    }
  }, [userProfile]);

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const addArea = () => {
    if (newArea.trim() && !formData.preferred_areas.includes(newArea.trim())) {
      setFormData(prev => ({
        ...prev,
        preferred_areas: [...prev.preferred_areas, newArea.trim()]
      }));
      setNewArea('');
    }
  };

  const removeArea = (areaToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_areas: prev.preferred_areas.filter(area => area !== areaToRemove)
    }));
  };

  const toggleFeature = (feature: string, type: 'must_have' | 'nice_to_have') => {
    const field = type === 'must_have' ? 'must_have_features' : 'nice_to_have_features';
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(feature)
        ? prev[field].filter(f => f !== feature)
        : [...prev[field], feature]
    }));
  };

  const togglePropertyType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      property_type_preferences: prev.property_type_preferences.includes(type)
        ? prev.property_type_preferences.filter(t => t !== type)
        : [...prev.property_type_preferences, type]
    }));
  };

  // Helper function to detect what fields have changed
  const getChangedFields = (current: ProfileFormData, original: ProfileFormData | null) => {
    if (!original) return { personUpdates: {}, profileUpdates: {} };

    const personUpdates: any = {};
    const profileUpdates: any = {};

    // Check person fields
    if (current.first_name !== original.first_name) {
      personUpdates.first_name = current.first_name;
    }
    if (current.last_name !== original.last_name) {
      personUpdates.last_name = current.last_name;
    }
    if (current.phone !== original.phone) {
      personUpdates.phone = current.phone || null;
    }

    // Check buyer profile fields
    if (current.price_min !== original.price_min) {
      profileUpdates.price_min = current.price_min;
    }
    if (current.price_max !== original.price_max) {
      profileUpdates.price_max = current.price_max;
    }
    if (current.budget_approved !== original.budget_approved) {
      profileUpdates.budget_approved = current.budget_approved;
    }
    if (current.pre_approval_amount !== original.pre_approval_amount) {
      profileUpdates.pre_approval_amount = current.pre_approval_amount;
    }
    if (current.pre_approval_expiry?.getTime() !== original.pre_approval_expiry?.getTime()) {
      profileUpdates.pre_approval_expiry = current.pre_approval_expiry ? current.pre_approval_expiry.toISOString().split('T')[0] : null;
    }
    if (current.down_payment_amount !== original.down_payment_amount) {
      profileUpdates.down_payment_amount = current.down_payment_amount;
    }
    if (current.buyer_needs !== original.buyer_needs) {
      profileUpdates.buyer_needs = current.buyer_needs || null;
    }
    if (JSON.stringify(current.preferred_areas) !== JSON.stringify(original.preferred_areas)) {
      profileUpdates.preferred_areas = current.preferred_areas;
    }
    if (JSON.stringify(current.property_type_preferences) !== JSON.stringify(original.property_type_preferences)) {
      profileUpdates.property_type_preferences = current.property_type_preferences;
    }
    if (JSON.stringify(current.must_have_features) !== JSON.stringify(original.must_have_features)) {
      profileUpdates.must_have_features = current.must_have_features;
    }
    if (JSON.stringify(current.nice_to_have_features) !== JSON.stringify(original.nice_to_have_features)) {
      profileUpdates.nice_to_have_features = current.nice_to_have_features;
    }
    if (current.bathrooms !== original.bathrooms) {
      profileUpdates.bathrooms = current.bathrooms;
    }
    if (current.bedrooms !== original.bedrooms) {
      profileUpdates.bedrooms = current.bedrooms;
    }
    if (current.ideal_move_in_date?.getTime() !== original.ideal_move_in_date?.getTime()) {
      profileUpdates.ideal_move_in_date = current.ideal_move_in_date ? current.ideal_move_in_date.toISOString().split('T')[0] : null;
    }
    if (current.urgency_level !== original.urgency_level) {
      profileUpdates.urgency_level = current.urgency_level || null;
    }

    return { personUpdates, profileUpdates };
  };

  const handleSubmit = async () => {
    if (!userProfile) return;

    setIsSubmitting(true);

    try {
      // Get only the fields that have changed
      const { personUpdates, profileUpdates } = getChangedFields(formData, originalFormData);

      // Check if there are any changes to make
      if (Object.keys(personUpdates).length === 0 && Object.keys(profileUpdates).length === 0) {
        toast({
          title: "No Changes",
          description: "No changes were made to your profile.",
          variant: "default"
        });
        setIsSubmitting(false);
        onClose();
        return;
      }

      // Debug logging
      console.log('Sending only changed fields:');
      console.log('personUpdates:', personUpdates);
      console.log('profileUpdates:', profileUpdates);

      // Use the combined update method that handles both tables
      const response = await dataService.updateBuyerComplete(userProfile.id, personUpdates, profileUpdates);

      console.log('Update response:', response);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update profile');
      }

      toast({
        title: "Profile Updated!",
        description: "Your profile has been successfully updated.",
      });

      onProfileUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card text-card-foreground border border-border rounded-2xl shadow-modern">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-slate-900">
            <User className="h-5 w-5 text-blue-600" />
            <span className="text-xl">Edit Profile</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Personal Information */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-slate-800">
                <User className="h-4 w-4 text-blue-600" />
                <span>Personal Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    className="bg-white/80"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  className="bg-white/80"
                />
              </div>

            </CardContent>
          </Card>

          {/* Budget & Financing */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-slate-800">
                <DollarSign className="h-4 w-4 text-blue-600" />
                <span>Budget & Financing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_min">Minimum Price</Label>
                  <Input
                    id="price_min"
                    type="number"
                    value={formData.price_min || ''}
                    onChange={(e) => handleInputChange('price_min', e.target.value ? Number(e.target.value) : null)}
                    placeholder="300000"
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <Label htmlFor="price_max">Maximum Price</Label>
                  <Input
                    id="price_max"
                    type="number"
                    value={formData.price_max || ''}
                    onChange={(e) => handleInputChange('price_max', e.target.value ? Number(e.target.value) : null)}
                    placeholder="500000"
                    className="bg-white/80"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="budget_approved"
                  checked={formData.budget_approved === true}
                  onCheckedChange={(checked) => handleInputChange('budget_approved', checked)}
                />
                <Label htmlFor="budget_approved">I am pre-approved for a mortgage</Label>
              </div>

              {formData.budget_approved && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pre_approval_amount">Pre-approval Amount</Label>
                    <Input
                      id="pre_approval_amount"
                      type="number"
                      value={formData.pre_approval_amount || ''}
                      onChange={(e) => handleInputChange('pre_approval_amount', e.target.value ? Number(e.target.value) : null)}
                      placeholder="450000"
                      className="bg-white/80"
                    />
                  </div>
                  <div>
                    <Label>Pre-approval Expiry</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal bg-white/80"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.pre_approval_expiry ? format(formData.pre_approval_expiry, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.pre_approval_expiry}
                          onSelect={(date) => handleInputChange('pre_approval_expiry', date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="down_payment_amount">Down Payment Amount</Label>
                <Input
                  id="down_payment_amount"
                  type="number"
                  value={formData.down_payment_amount || ''}
                  onChange={(e) => handleInputChange('down_payment_amount', e.target.value ? Number(e.target.value) : null)}
                  placeholder="90000"
                  className="bg-white/80"
                />
              </div>
            </CardContent>
          </Card>

          {/* Property Preferences */}
          <Card className="bg-card text-card-foreground border border-border shadow-sm rounded-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center space-x-2 text-slate-800">
                <Home className="h-4 w-4 text-blue-600" />
                <span>Property Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="buyer_needs">What are you looking for?</Label>
                <Textarea
                  id="buyer_needs"
                  value={formData.buyer_needs}
                  onChange={(e) => handleInputChange('buyer_needs', e.target.value)}
                  placeholder="Describe your ideal home, lifestyle needs, family requirements, etc."
                  className="min-h-[100px] bg-white/80"
                />
              </div>

              <div>
                <Label>Preferred Areas</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.preferred_areas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                      {area}
                      <button
                        type="button"
                        onClick={() => removeArea(area)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="Add a preferred area"
                    className="bg-white/80"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addArea())}
                  />
                  <Button type="button" onClick={addArea} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Property Types</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {propertyTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={formData.property_type_preferences.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => togglePropertyType(type)}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Must-Have Features</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonFeatures.map((feature) => {
                    const isSelected = formData.must_have_features.includes(feature);
                    return (
                      <Badge
                        key={feature}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${
                          isSelected
                            ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                            : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                        }`}
                        onClick={() => toggleFeature(feature, 'must_have')}
                      >
                        {feature}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div>
                <Label>Nice-to-Have Features</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commonFeatures.map((feature) => {
                    const isSelected = formData.nice_to_have_features.includes(feature);
                    return (
                      <Badge
                        key={feature}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                            : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        }`}
                        onClick={() => toggleFeature(feature, 'nice_to_have')}
                      >
                        {feature}
                      </Badge>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    value={formData.bedrooms || ''}
                    onChange={(e) => handleInputChange('bedrooms', e.target.value ? Number(e.target.value) : null)}
                    placeholder="3"
                    min="1"
                    max="10"
                    className="bg-white/80"
                  />
                </div>
                <div>
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    value={formData.bathrooms || ''}
                    onChange={(e) => handleInputChange('bathrooms', e.target.value ? Number(e.target.value) : null)}
                    placeholder="2"
                    min="1"
                    max="10"
                    step="0.5"
                    className="bg-white/80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ideal Move-in Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal bg-white/80"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.ideal_move_in_date ? format(formData.ideal_move_in_date, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.ideal_move_in_date}
                        onSelect={(date) => handleInputChange('ideal_move_in_date', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="urgency_level">Urgency Level</Label>
                  <Select value={formData.urgency_level} onValueChange={(value) => handleInputChange('urgency_level', value)}>
                    <SelectTrigger className="bg-white/80">
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencyLevels.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-border text-slate-700 hover:bg-slate-50"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};