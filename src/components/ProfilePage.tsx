import { useState, useEffect } from 'react';
import { Edit2, MapPin, DollarSign, Home, Star, Settings, Heart, User, Phone, Mail, Calendar, UserCheck, Loader2, MessageSquare, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgent } from '@/hooks/useAgent';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserData } from '@/types/user';

interface ProfilePageProps {
  userData: UserData;
}

const ProfilePage = ({ userData }: ProfilePageProps) => {
  const [editMode, setEditMode] = useState(false);
  
  // Fetch full user profile data from database
  const { data: userProfile, isLoading: isLoadingProfile, error: profileError } = useUserProfile(userData.email);
  
  // Fetch agent data using the agent_id from user profile
  const { data: agent, isLoading: isLoadingAgent } = useAgent(userProfile?.agent_id || null);
  
  // Parse tags into arrays for display
  const parseTags = (tagString?: string) => {
    if (!tagString) return [];
    return tagString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
  };

  // Create profile data from database or use fallback values
  const profileData = {
    // Basic requirements - derive from user profile data
    bedrooms: 3, // Could be derived from buyer_needs analysis
    bathrooms: 2,
    minSquareFootage: 1800,
    propertyType: 'Single-family',
    location: userProfile?.background?.includes('tech') ? 'San Francisco, CA' : 
              userProfile?.background?.includes('family') ? 'Suburban area' : 'City area',
    priceRange: { 
      min: userProfile?.price_min || 400000, 
      max: userProfile?.price_max || 650000 
    },
    // Lifestyle preferences - parse from buyer_needs
    lifestyle: userProfile?.buyer_needs?.includes('family') ? ['Family-friendly', 'Good schools', 'Safe neighborhood'] :
               userProfile?.buyer_needs?.includes('modern') ? ['Modern amenities', 'Move-in ready', 'City living'] :
               userProfile?.buyer_needs?.includes('investment') ? ['Investment potential', 'Rental income', 'Appreciation'] :
               ['Low maintenance', 'Accessibility', 'Quiet area'],
    // Tags from database
    tags: parseTags(userProfile?.tags),
    // Budget info
    budgetApproved: userProfile?.budget_approved || false,
    preApprovalAmount: userProfile?.pre_approval_amount,
    preApprovalExpiry: userProfile?.pre_approval_expiry
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
                 <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
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

        {/* Property Requirements */}
        <ProfileSection title="Property Requirements" icon={Home}>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 mb-2">Buyer Needs</p>
              <p className="text-sm text-gray-800 leading-relaxed">
                {userProfile?.buyer_needs || 'No specific requirements provided'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600">Min Price</p>
                <p className="font-semibold">${profileData.priceRange.min.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Max Price</p>
                <p className="font-semibold">${profileData.priceRange.max.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Budget & Financing */}
        <ProfileSection title="Budget & Financing" icon={DollarSign}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Price Range</p>
              <p className="font-semibold">
                ${profileData.priceRange.min.toLocaleString()} - ${profileData.priceRange.max.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Budget Status</p>
              <div className="flex items-center gap-2">
                <Badge variant={profileData.budgetApproved ? 'default' : 'secondary'} className="text-xs">
                  {profileData.budgetApproved ? 'Pre-approved' : 'Not pre-approved'}
                </Badge>
                {profileData.budgetApproved && profileData.preApprovalAmount && (
                  <span className="text-sm text-gray-600">
                    ${profileData.preApprovalAmount.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
            {profileData.budgetApproved && profileData.preApprovalExpiry && (
              <div>
                <p className="text-xs text-gray-600">Pre-approval Expires</p>
                <p className="font-semibold">{new Date(profileData.preApprovalExpiry).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Background & Preferences */}
        <ProfileSection title="Background & Preferences" icon={Star}>
          <div className="space-y-3">
            {userProfile?.background && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Background</p>
                <p className="text-sm text-gray-800">{userProfile.background}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-gray-600 mb-2">Lifestyle Preferences</p>
              <div className="flex flex-wrap gap-1">
                {profileData.lifestyle.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            {profileData.tags.length > 0 && (
              <div>
                <p className="text-xs text-gray-600 mb-2">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {profileData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Activity & Communication */}
        <ProfileSection title="Activity & Communication" icon={Calendar}>
          <div className="space-y-3">
            {userProfile?.last_contact_date && (
              <div>
                <p className="text-xs text-gray-600">Last Contact</p>
                <p className="font-semibold">{new Date(userProfile.last_contact_date).toLocaleDateString()}</p>
              </div>
            )}
            {userProfile?.next_followup_date && (
              <div>
                <p className="text-xs text-gray-600">Next Follow-up</p>
                <p className="font-semibold">{new Date(userProfile.next_followup_date).toLocaleDateString()}</p>
              </div>
            )}
            {(!userProfile?.last_contact_date && !userProfile?.next_followup_date) && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </ProfileSection>

        {/* Quick Actions */}
        <ProfileSection title="Quick Actions" icon={Settings}>
          <div className="space-y-3">
            <Button className="w-full" variant="outline">
              <Edit2 className="h-4 w-4 mr-2" />
              Update Preferences
            </Button>
            <Button className="w-full" variant="outline">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contact Agent
            </Button>
            {!profileData.budgetApproved && (
              <Button className="w-full" variant="outline">
                <DollarSign className="h-4 w-4 mr-2" />
                Get Pre-approved
              </Button>
            )}
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
    </div>
  );
};

export default ProfilePage;
