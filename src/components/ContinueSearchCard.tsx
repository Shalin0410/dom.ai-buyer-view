
import { Plus, Heart, Home } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Property } from '@/services/api/types';

interface ContinueSearchCardProps {
  onNavigateToSearch?: () => void;
  availableProperties?: Property[];
  loading?: boolean;
}

const ContinueSearchCard = ({ onNavigateToSearch, availableProperties = [], loading = false }: ContinueSearchCardProps) => {
  // Debug logging
  console.log('[ContinueSearchCard] Props:', { availableProperties, loading, count: availableProperties?.length });

  // Show loading state
  if (loading) {
    return (
      <Card className="border-0 bg-gradient-to-r from-gray-400 to-gray-500 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
                <h3 className="text-xl font-semibold">Looking for new matches...</h3>
              </div>
              <p className="text-gray-100">Searching for properties that match your preferences</p>
            </div>
            <div className="w-20 h-10 bg-gray-300 rounded animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show no properties message
  if (!availableProperties || availableProperties.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Home className="w-5 h-5 text-blue-200" />
                <h3 className="text-xl font-semibold">No New Matches</h3>
              </div>
              <p className="text-blue-100 mb-1">We're actively searching for properties that match your preferences.</p>
              <p className="text-blue-100 text-sm">Check back later or contact your agent for personalized recommendations.</p>
            </div>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
              onClick={onNavigateToSearch}
            >
              <Plus size={16} className="mr-2" />
              Browse All
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the first property to highlight
  const featuredProperty = availableProperties[0];
  const additionalCount = availableProperties.length - 1;

  return (
    <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-5 h-5 text-pink-200" />
              <h3 className="text-xl font-semibold">New Matches Available</h3>
            </div>
            <p className="text-blue-100 mb-1">
              {featuredProperty.address}, {featuredProperty.city} - looks perfect for you!
            </p>
            {additionalCount > 0 && (
              <p className="text-blue-100 text-sm">
                Plus {additionalCount} more {additionalCount === 1 ? 'match' : 'matches'} based on your preferences
              </p>
            )}
            {additionalCount === 0 && (
              <p className="text-blue-100 text-sm">
                New match found based on your preferences
              </p>
            )}
          </div>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
            onClick={onNavigateToSearch}
          >
            <Plus size={16} className="mr-2" />
            View {availableProperties.length === 1 ? 'Property' : 'All'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContinueSearchCard;
