
import { useState } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { Property } from '@/services/api/types';
import ActionItems from './ActionItems';
import DashboardHeader from './DashboardHeader';
import ContinueSearchCard from './ContinueSearchCard';
import SearchAndFilters from './SearchAndFilters';
import PropertyGrid from './PropertyGrid';

interface ModernDashboardProps {
  userData: any;
  onPropertyClick: (propertyId: string) => void;
  onNavigateToSearch?: () => void;
}

const ModernDashboard = ({ userData, onPropertyClick, onNavigateToSearch }: ModernDashboardProps) => {
  const [selectedStages, setSelectedStages] = useState(['tour_scheduled', 'disclosure_review']);
  const [selectedActions, setSelectedActions] = useState(['tour_scheduled']);
  const [selectedActivities, setSelectedActivities] = useState(['recently_updated']);

  // Fetch real properties from Supabase using userData.id
  const { properties, loading, error } = useProperties(userData?.id, {}, 'tracked');

  // Map database properties to dashboard format
  const mapPropertiesToDashboardFormat = (dbProperties: Property[]) => {
    return dbProperties.map(property => {
      const primaryPhoto = property.photos?.find(photo => photo.is_primary) || property.photos?.[0];
      
      // Map database status to dashboard status
      const getDashboardStatus = (dbStatus: string) => {
        switch (dbStatus) {
          case 'viewing': return 'tour_scheduled';
          case 'researching': return 'interested';
          case 'offer_submitted': return 'offer_made';
          case 'under_contract':
          case 'in_escrow': return 'offer_made';
          default: return 'interested';
        }
      };

      // Map buying stage to current stage
      const getCurrentStage = (buyingStage: string) => {
        switch (buyingStage) {
          case 'active_search': return 'tour_scheduled';
          case 'offer_negotiation': return 'negotiating';
          case 'under_contract': return 'disclosure_review';
          case 'closing': return 'final_review';
          default: return 'tour_scheduled';
        }
      };

      // Map action required to action needed
      const getActionNeeded = (actionRequired: string) => {
        switch (actionRequired) {
          case 'schedule_viewing': return 'tour_scheduled';
          case 'review_documents': return 'disclosure_review';
          case 'submit_offer': return 'offer_deadline';
          case 'final_walkthrough': return 'final_review';
          default: return 'tour_scheduled';
        }
      };

      // Determine last activity
      const getLastActivity = (lastActivityAt: string) => {
        const daysDiff = Math.floor((Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 3) return 'recently_updated';
        if (daysDiff <= 7) return 'last_contacted';
        return 'needs_attention';
      };

      return {
        id: property.id,
        address: property.address,
        city: `${property.city}, ${property.state}`,
        price: property.purchase_price || property.listing_price,
        beds: property.bedrooms,
        baths: property.bathrooms,
        sqft: property.square_feet || 0,
        image: primaryPhoto?.url || '/placeholder.svg',
        status: getDashboardStatus(property.status),
        currentStage: getCurrentStage(property.buying_stage),
        actionNeeded: getActionNeeded(property.action_required),
        lastActivity: getLastActivity(property.last_activity_at)
      };
    });
  };

  // Convert database properties to dashboard format
  const dashboardProperties = mapPropertiesToDashboardFormat(properties);

  // Filter properties based on selected filters
  const filteredProperties = dashboardProperties.filter(property => {
    if (selectedStages.length > 0 && !selectedStages.includes(property.currentStage)) return false;
    if (selectedActions.length > 0 && !selectedActions.includes(property.actionNeeded)) return false;
    if (selectedActivities.length > 0 && !selectedActivities.includes(property.lastActivity)) return false;
    return true;
  });

  const handleNavigateToSearch = () => {
    if (onNavigateToSearch) {
      onNavigateToSearch();
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <DashboardHeader userData={userData} />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your properties...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
        <DashboardHeader userData={userData} />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <DashboardHeader userData={userData} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <ContinueSearchCard onNavigateToSearch={handleNavigateToSearch} />

            <SearchAndFilters
              selectedStages={selectedStages}
              selectedActions={selectedActions}
              selectedActivities={selectedActivities}
              onStagesChange={setSelectedStages}
              onActionsChange={setSelectedActions}
              onActivitiesChange={setSelectedActivities}
            />

            <PropertyGrid 
              properties={filteredProperties}
              onPropertyClick={onPropertyClick}
            />
          </div>

          <div className="space-y-6">
            <ActionItems />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
