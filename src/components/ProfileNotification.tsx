
import { useState } from 'react';
import { CheckCircle, Edit, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProfileNotificationProps {
  userInput: string;
  onAccept: () => void;
  onEdit: () => void;
}

const ProfileNotification = ({ userInput, onAccept, onEdit }: ProfileNotificationProps) => {
  const [isVisible, setIsVisible] = useState(true);

  // Mock extracted profile data
  const extractedProfile = {
    buyerType: "First-time buyers",
    location: "San Francisco (City)",
    timeline: "5-7 years",
    bedrooms: 3,
    bathrooms: 2,
    requirements: ["Private backyard", "Pet-friendly", "Near CalTrain", "Close to restaurants"],
    workLocation: "San Mateo / Palo Alto",
    familyStatus: "Couple planning family",
    lifestyle: ["Dog owner", "Frequent entertaining", "Dining out"]
  };

  if (!isVisible) return null;

  const handleAccept = () => {
    setIsVisible(false);
    onAccept();
  };

  const handleEdit = () => {
    setIsVisible(false);
    onEdit();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[80vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={20} />
              Profile Created!
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsVisible(false)}
            >
              <X size={16} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Based on your input, we've automatically created your home buying profile:
          </p>

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-900">Buyer Profile</h4>
              <Badge variant="secondary">{extractedProfile.buyerType}</Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Preferred Location</h4>
              <Badge variant="secondary">{extractedProfile.location}</Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Requirements</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                <Badge variant="outline">{extractedProfile.bedrooms} beds</Badge>
                <Badge variant="outline">{extractedProfile.bathrooms} baths</Badge>
                {extractedProfile.requirements.map((req, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Lifestyle</h4>
              <div className="flex flex-wrap gap-1 mt-1">
                {extractedProfile.lifestyle.map((lifestyle, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {lifestyle}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-900">Work Commute</h4>
              <Badge variant="secondary">{extractedProfile.workLocation}</Badge>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <p className="text-xs text-blue-800">
              💡 We'll use this profile to find your perfect matches. Don't worry - we'll learn and update your preferences as you interact with properties!
            </p>
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleEdit} variant="outline" className="flex-1">
              <Edit size={16} className="mr-2" />
              Edit Profile
            </Button>
            <Button onClick={handleAccept} className="flex-1 bg-green-600 hover:bg-green-700">
              <CheckCircle size={16} className="mr-2" />
              Looks Good!
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileNotification;
