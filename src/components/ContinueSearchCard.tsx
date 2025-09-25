
import { Plus, Home } from 'lucide-react';
import { Property } from '@/services/api/types';

interface ContinueSearchCardProps {
  onNavigateToSearch?: () => void;
  availableProperties?: Property[];
  loading?: boolean;
}

const ContinueSearchCard = ({ onNavigateToSearch, availableProperties = [], loading = false }: ContinueSearchCardProps) => {

  // Show loading state
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl p-8 text-white mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Looking for new matches...</h2>
            <p className="text-gray-100">Searching for properties that match your preferences</p>
          </div>
          <div className="w-20 h-10 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  // Show no properties message
  if (!availableProperties || availableProperties.length === 0) {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">No New Matches</h2>
            <p className="text-blue-100 mb-1">We're actively searching for properties that match your preferences.</p>
            <p className="text-blue-100">Check back later or contact your agent for personalized recommendations.</p>
          </div>
          <button
            onClick={onNavigateToSearch}
            className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Browse All
          </button>
        </div>
      </div>
    );
  }

  // Get the first property to highlight
  const featuredProperty = availableProperties[0];
  const additionalCount = availableProperties.length - 1;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white mb-12">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">New Matches Available</h2>
          <p className="text-blue-100 mb-1">
            {featuredProperty.address}, {featuredProperty.city} - looks perfect for you!
          </p>
          {additionalCount > 0 && (
            <p className="text-blue-100">
              Plus {additionalCount} more {additionalCount === 1 ? 'match' : 'matches'} based on your preferences
            </p>
          )}
          {additionalCount === 0 && (
            <p className="text-blue-100">
              New match found based on your preferences
            </p>
          )}
        </div>
        <button
          onClick={onNavigateToSearch}
          className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
        >
          View All Properties
        </button>
      </div>
    </div>
  );
};

export default ContinueSearchCard;
