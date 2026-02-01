import { useState, useEffect } from 'react';
import { Edit2, MapPin, DollarSign, Home, Star, Settings, Heart, User, Phone, Mail, Calendar, UserCheck, Loader2, MessageSquare, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgent } from '@/hooks/useAgent';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserData } from '@/types/user';
import { AgentMessageModal } from '@/components/AgentMessageModal';
import { EditProfileModal } from '@/components/EditProfileModal';

interface ProfilePageProps {
  userData: UserData;
  openEditModalOnMount?: boolean;
  onEditModalOpened?: () => void;
}

const ProfilePage = ({ userData, openEditModalOnMount, onEditModalOpened }: ProfilePageProps) => {
  const [editMode, setEditMode] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Open edit modal on mount if requested
  useEffect(() => {
    if (openEditModalOnMount) {
      setIsEditProfileModalOpen(true);
      onEditModalOpened?.();
    }
  }, [openEditModalOnMount, onEditModalOpened]);

  // Fetch full user profile data from database
  const { data: userProfile, isLoading: isLoadingProfile, error: profileError, refetch: refetchProfile } = useUserProfile(userData.email);
  
  // Fetch agent data using the agent_id from user profile
  const { data: agent, isLoading: isLoadingAgent } = useAgent(userProfile?.agent_id || null);
  

  // Extract buyer_profiles data (comes from the database query)
  // Note: Supabase returns buyer_profiles as an object, not an array
  const buyerProfile = userProfile?.buyer_profiles || null;


  // Create profile data utilizing both persons table and buyer_profiles table
  const profileData = {
    // Price range - only from buyer_profiles table
    priceRange: {
      min: buyerProfile?.price_min || null,
      max: buyerProfile?.price_max || null
    },
    // Budget and financing info - only from buyer_profiles table
    budgetApproved: buyerProfile?.budget_approved ?? null,
    preApprovalAmount: buyerProfile?.pre_approval_amount || null,
    preApprovalExpiry: buyerProfile?.pre_approval_expiry || null,
    downPaymentAmount: buyerProfile?.down_payment_amount || null,
    // Buyer preferences - only from buyer_profiles table
    buyerNeeds: buyerProfile?.buyer_needs || null,
    preferredAreas: buyerProfile?.preferred_areas || [],
    propertyTypePreferences: buyerProfile?.property_type_preferences || [],
    mustHaveFeatures: buyerProfile?.must_have_features || [],
    niceToHaveFeatures: buyerProfile?.nice_to_have_features || [],
    bathrooms: buyerProfile?.bathrooms || null,
    bedrooms: buyerProfile?.bedrooms || null,
    idealMoveInDate: buyerProfile?.ideal_move_in_date || null,
    urgencyLevel: buyerProfile?.urgency_level || null,
    // Activity info - from persons table
    lastContactDate: userProfile?.last_contact_date || null,
    nextFollowupDate: userProfile?.next_followup_date || null
  };

  if (isLoadingProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }



  const ProfileSection = ({ title, children, icon: Icon }) => (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
          <Icon size={16} className="mr-2 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="mt-1 text-gray-600">Manage your personal information and preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <ProfileSection title="Personal Information" icon={User}>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-xl">
                  {userData?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{userData?.name || 'User'}</p>
                <p className="text-sm text-gray-600">{userData?.email || 'No email provided'}</p>
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone size={14} className="text-gray-500" />
                <span>{userProfile?.phone || userData?.phone || 'No phone number provided'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar size={14} className="text-gray-500" />
                <span>Member since {new Date(userProfile?.created_at || Date.now()).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Agent Information */}
        <ProfileSection title="Your Agent" icon={UserCheck}>
          {isLoadingAgent ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Loading agent information...</p>
            </div>
          ) : agent ? (
                         <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                   <div className="flex-shrink-0 h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                     <span className="text-white font-semibold text-xl">
                       {agent.first_name?.charAt(0) || 'A'}
                     </span>
                   </div>
                   <div>
                     <p className="font-semibold text-gray-900">
                       {agent.first_name || 'Agent'} {agent.last_name || ''}
                     </p>
                     <p className="text-sm text-gray-600">Real Estate Agent</p>
                   </div>
                 </div>
                 <Button
                   variant="ghost"
                   size="sm"
                   className="text-blue-600 hover:bg-blue-50"
                   onClick={() => setIsMessageModalOpen(true)}
                 >
                   <MessageSquare className="mr-2 h-4 w-4" />
                   Message
                 </Button>
               </div>
               
               <div className="space-y-1.5 text-sm">
                 {agent.email && (
                   <div className="flex items-center space-x-2">
                     <Mail size={14} className="text-gray-500 flex-shrink-0" />
                     <span className="truncate text-amber-600">{agent.email}</span>
                   </div>
                 )}
                 {agent.phone && (
                   <div className="flex items-center space-x-2">
                     <Phone size={14} className="text-gray-500 flex-shrink-0" />
                     <span className="text-amber-600">{agent.phone}</span>
                   </div>
                 )}
               </div>
             </div>
          ) : (
            <div className="text-center py-6">
              <UserX className="mx-auto h-10 w-10 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                No agent assigned yet. Contact support to get matched with an agent.
              </p>
              <Button className="mt-4" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Support
              </Button>
            </div>
          )}
        </ProfileSection>

        {/* Price Range */}
        <ProfileSection title="Price Range" icon={DollarSign}>
          <div className="space-y-3">
            {(profileData.priceRange.min || profileData.priceRange.max) ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Min Price</p>
                  <p className="font-semibold">
                    {profileData.priceRange.min ? `$${profileData.priceRange.min.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Max Price</p>
                  <p className="font-semibold">
                    {profileData.priceRange.max ? `$${profileData.priceRange.max.toLocaleString()}` : 'Not specified'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No price range specified</p>
              </div>
            )}
          </div>
        </ProfileSection>


        {/* Location & Area Preferences */}
        <ProfileSection title="Location & Area Preferences" icon={MapPin}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2">Preferred Areas</p>
              {profileData.preferredAreas && profileData.preferredAreas.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {profileData.preferredAreas.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                      {area}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No preferred areas specified</p>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Buyer Needs & Requirements</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {profileData.buyerNeeds || 'No specific requirements provided'}
              </p>
            </div>
          </div>
        </ProfileSection>

        {/* Property Preferences */}
        <ProfileSection title="Property Preferences" icon={Home}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2">Property Types</p>
              {profileData.propertyTypePreferences.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {profileData.propertyTypePreferences.map((type, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-green-50 text-green-700">
                      {type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No property types specified</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-2">Must-Have Features</p>
              {profileData.mustHaveFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {profileData.mustHaveFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-red-50 text-red-700">
                      {feature}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No must-have features specified</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-600 mb-2">Nice-to-Have Features</p>
              {profileData.niceToHaveFeatures.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {profileData.niceToHaveFeatures.map((feature, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No nice-to-have features specified</p>
              )}
            </div>

            {/* Bedrooms and Bathrooms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Bedrooms</p>
                <p className="font-semibold">
                  {profileData.bedrooms ? `${profileData.bedrooms} ${profileData.bedrooms === 1 ? 'bedroom' : 'bedrooms'}` : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Bathrooms</p>
                <p className="font-semibold">
                  {profileData.bathrooms ? `${profileData.bathrooms} ${profileData.bathrooms === 1 ? 'bathroom' : 'bathrooms'}` : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Ideal Move-in Date</p>
                <p className="font-semibold">
                  {profileData.idealMoveInDate ? new Date(profileData.idealMoveInDate).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Urgency Level</p>
                <p className="font-semibold capitalize">
                  {profileData.urgencyLevel || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </ProfileSection>


        {/* Quick Actions */}
        <ProfileSection title="Quick Actions" icon={Settings}>
          <div className="space-y-3">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => setIsEditProfileModalOpen(true)}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Update Preferences
            </Button>
          </div>
        </ProfileSection>

        {/* Realtor Info */}
        {userData?.realtorInfo && (
          <ProfileSection title="Realtor Information" icon={Settings}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{userData.realtorInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-medium">{userData.realtorInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{userData.realtorInfo.phone}</span>
              </div>
            </div>
          </ProfileSection>
        )}
      </div>

      {/* Agent Message Modal */}
      {agent && (
        <AgentMessageModal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          agentName={`${agent.first_name || 'Agent'} ${agent.last_name || ''}`.trim()}
          agentEmail={agent.email || ''}
          buyerName={userData?.name || 'User'}
          buyerEmail={userData?.email || ''}
        />
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileModalOpen}
        onClose={() => setIsEditProfileModalOpen(false)}
        userProfile={userProfile}
        onProfileUpdate={refetchProfile}
      />
    </div>
  );
};

export default ProfilePage;
