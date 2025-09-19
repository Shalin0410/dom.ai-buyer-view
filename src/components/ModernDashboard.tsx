
import { useState, useEffect } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { Property } from '@/services/api/types';
import { dataService } from '@/services';
import ActionItems from './ActionItems';
import DashboardHeader from './DashboardHeader';
import ContinueSearchCard from './ContinueSearchCard';
import PropertyGrid from './PropertyGrid';

interface ModernDashboardProps {
  userData: any;
  onPropertyClick: (propertyId: string) => void;
  onNavigateToSearch?: () => void;
}

const ModernDashboard = ({ userData, onPropertyClick, onNavigateToSearch }: ModernDashboardProps) => {
  const [agentEmail, setAgentEmail] = useState<string>('agent@example.com');
  const [agentLoading, setAgentLoading] = useState<boolean>(false);

  // Fetch real properties from Supabase using userData.id
  const { properties, loading, error } = useProperties(userData?.id, {}, 'tracked');

  // Fetch available properties for the "new matches" section
  const { properties: availableProperties, loading: availableLoading } = useProperties(userData?.id, {}, 'available');

  // Debug logging for available properties
  console.log('[ModernDashboard] Available properties:', availableProperties);
  console.log('[ModernDashboard] Available loading:', availableLoading);

  // Fetch agent email using proper buyer->agent lookup flow
  useEffect(() => {
    const fetchAgentEmail = async () => {
      if (!userData?.email) {
        console.log('[ModernDashboard] No user email available for agent lookup');
        return;
      }

      setAgentLoading(true);
      try {
        console.log('[ModernDashboard] Fetching buyer info for email:', userData.email);

        // Step 1: Get buyer info to find their assigned_agent_id
        const buyerResponse = await dataService.getBuyerByEmail(userData.email);
        console.log('[ModernDashboard] getBuyerByEmail response:', buyerResponse);

        if (buyerResponse.success && buyerResponse.data?.assigned_agent_id) {
          const agentId = buyerResponse.data.assigned_agent_id;
          console.log('[ModernDashboard] Found assigned_agent_id:', agentId);

          // Step 2: Get agent info using the assigned_agent_id
          const agentResponse = await dataService.getAgentById(agentId);
          console.log('[ModernDashboard] getAgentById response:', agentResponse);

          if (agentResponse.success && agentResponse.data?.email) {
            console.log('[ModernDashboard] Setting agent email to:', agentResponse.data.email);
            setAgentEmail(agentResponse.data.email);
          } else {
            console.log('[ModernDashboard] Failed to get agent details:', agentResponse);
          }
        } else {
          console.log('[ModernDashboard] No assigned_agent_id found for buyer:', buyerResponse);
        }
      } catch (error) {
        console.error('[ModernDashboard] Error fetching agent email:', error);
        // Keep default email on error
      } finally {
        setAgentLoading(false);
      }
    };

    fetchAgentEmail();
  }, [userData?.email]);

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
          case 'review_disclosures_reports': return 'disclosure_review';
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
        image: primaryPhoto?.url || '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png',
        status: getDashboardStatus(property.status),
        currentStage: getCurrentStage(property.buying_stage),
        actionNeeded: getActionNeeded(property.action_required),
        lastActivity: getLastActivity(property.last_activity_at)
      };
    });
  };

  // Convert database properties to dashboard format
  const dashboardProperties = mapPropertiesToDashboardFormat(properties);

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

  // Show error state only for actual errors, not for "no properties" messages
  if (error && !error.includes('No properties found')) {
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
            <ContinueSearchCard
              onNavigateToSearch={handleNavigateToSearch}
              availableProperties={availableProperties}
              loading={availableLoading}
            />

            {dashboardProperties.length === 0 ? (
              <div className="text-center py-12">
                <div className="bg-white rounded-lg shadow-sm p-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Properties in Your Journey</h3>
                  <p className="text-gray-600 mb-4">
                    Start exploring properties in the search tab to build your personalized dashboard.
                  </p>
                  <button
                    onClick={handleNavigateToSearch}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Browse Properties
                  </button>
                </div>
              </div>
            ) : (
              <PropertyGrid
                properties={dashboardProperties}
                onPropertyClick={onPropertyClick}
                buyerInfo={{
                  id: userData?.id || '',
                  name: userData?.first_name ? `${userData.first_name} ${userData.last_name || ''}`.trim() : 'Buyer',
                  email: userData?.email || ''
                }}
                agentEmail={agentEmail}
              />
            )}
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
