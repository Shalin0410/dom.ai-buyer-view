import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, ChevronDown, Check } from 'lucide-react';
import { useBuyers } from '@/hooks/useBuyer';
import { Buyer } from '@/services';

interface ProfileSwitcherProps {
  currentBuyerId?: string;
  onBuyerSelect: (buyer: Buyer) => void;
}

const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({ currentBuyerId, onBuyerSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: buyers, isLoading } = useBuyers();

  if (isLoading) return <div>Loading profiles...</div>;

  const currentBuyer = buyers?.find(b => b.id === currentBuyerId);

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-gray-900 flex items-center">
          <Users size={16} className="mr-2 text-blue-600" />
          Profile Switcher (Testing)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="text-xs text-gray-600 mb-2">
            Switch between buyer profiles to test different agent assignments:
          </div>
          
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setIsOpen(!isOpen)}
              className="w-full justify-between"
            >
              <span>
                {currentBuyer 
                  ? `${currentBuyer.first_name} ${currentBuyer.last_name}`
                  : 'Select Profile'
                }
              </span>
              <ChevronDown size={16} />
            </Button>
            
            {isOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg z-10">
                {buyers?.map((buyer) => (
                  <button
                    key={buyer.id}
                    onClick={() => {
                      onBuyerSelect(buyer);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {buyer.first_name} {buyer.last_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Agent: {buyer.agent?.first_name} {buyer.agent?.last_name}
                      </div>
                    </div>
                    {buyer.id === currentBuyerId && (
                      <Check size={16} className="text-green-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {currentBuyer && (
            <div className="pt-2">
              <Badge 
                variant="outline" 
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                Testing as: {currentBuyer.first_name} {currentBuyer.last_name}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSwitcher;
