import { useState, useEffect } from 'react';
import { Edit2, MapPin, DollarSign, Home, Star, Settings, Heart, User, Phone, Mail, Calendar, UserCheck, Loader2, MessageSquare, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAgent } from '@/hooks/useAgent';
import { UserData } from '@/types/user';

interface ProfilePageProps {
  userData: UserData;
}

const ProfilePage = ({ userData }: ProfilePageProps) => {
  const [editMode, setEditMode] = useState(false);
  
  // Fetch agent data using the agent_id from userData
  const { data: agent, isLoading: isLoadingAgent } = useAgent(userData.agent_id || null);
  
  // Log agent data for debugging
  useEffect(() => {

  }, [agent, userData.agent_id]);

  // Mock profile data extracted from user preferences
  const profileData = {
    bedrooms: 3,
    bathrooms: 2,
    minSquareFootage: 1800,
    propertyType: 'Single-family',
    location: 'San Francisco, CA',
    priceRange: { min: 400000, max: 650000 },
    amenities: ['Garage', 'Backyard', 'Near CalTrain'],
    interiorFeatures: ['Updated Kitchen', 'Hardwood Floors'],
    exteriorFeatures: ['Private Yard', 'Deck'],
    schoolDistrict: 'Good schools nearby',
    commutePreferences: 'Close to CalTrain and freeway',
    petPreferences: 'Dog-friendly with yard',
    lifestyle: ['Walkable', 'Near restaurants', 'City living'],
    mustHaves: ['3+ bedrooms', 'Private backyard', 'Pet-friendly'],
    niceToHaves: ['Updated kitchen', 'Garage', 'View']
  };



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
                <span>{userData?.phone || 'No phone number provided'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Home size={14} className="text-gray-500" />
                <span>{userData?.address || 'No address provided'}</span>
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
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Your Agent</h3>
                <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message
                </Button>
              </div>
              
              <div className="flex items-center space-x-4">
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
              
              <div className="space-y-2 text-sm">
                {agent.email && (
                  <div className="flex items-center space-x-2">
                    <Mail size={14} className="text-gray-500 flex-shrink-0" />
                    <span className="truncate">{agent.email}</span>
                  </div>
                )}
                {agent.phone && (
                  <div className="flex items-center space-x-2">
                    <Phone size={14} className="text-gray-500 flex-shrink-0" />
                    <span>{agent.phone}</span>
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

        {/* Basic Requirements */}
        <ProfileSection title="Property Requirements" icon={Home}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-600">Bedrooms</p>
              <p className="font-semibold">{profileData.bedrooms}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Bathrooms</p>
              <p className="font-semibold">{profileData.bathrooms}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Min Square Footage</p>
              <p className="font-semibold">{profileData.minSquareFootage} sq ft</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Property Type</p>
              <p className="font-semibold">{profileData.propertyType}</p>
            </div>
          </div>
        </ProfileSection>

        {/* Location & Budget */}
        <ProfileSection title="Location & Budget" icon={MapPin}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Preferred Location</p>
              <p className="font-semibold">{profileData.location}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Price Range</p>
              <p className="font-semibold">
                ${profileData.priceRange.min.toLocaleString()} - ${profileData.priceRange.max.toLocaleString()}
              </p>
            </div>
          </div>
        </ProfileSection>

        {/* Lifestyle Preferences */}
        <ProfileSection title="Lifestyle & Preferences" icon={Star}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2">Lifestyle</p>
              <div className="flex flex-wrap gap-1">
                {profileData.lifestyle.map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1">
                {profileData.amenities.map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Must-Haves vs Nice-to-Haves */}
        <ProfileSection title="Flexibility" icon={Settings}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-2">Must-Haves</p>
              <div className="flex flex-wrap gap-1">
                {profileData.mustHaves.map((item, index) => (
                  <Badge key={index} className="text-xs bg-red-100 text-red-800 hover:bg-red-100">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-2">Nice-to-Haves</p>
              <div className="flex flex-wrap gap-1">
                {profileData.niceToHaves.map((item, index) => (
                  <Badge key={index} className="text-xs bg-green-100 text-green-800 hover:bg-green-100">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Additional Details */}
        <ProfileSection title="Additional Details" icon={DollarSign}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">School District:</span>
              <span className="font-medium">{profileData.schoolDistrict}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commute:</span>
              <span className="font-medium">{profileData.commutePreferences}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pet Requirements:</span>
              <span className="font-medium">{profileData.petPreferences}</span>
            </div>
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
