import { useState } from 'react';
import ActionItems from './ActionItems';
import DashboardHeader from './DashboardHeader';
import ContinueSearchCard from './ContinueSearchCard';
import SearchAndFilters from './SearchAndFilters';
import PropertyGrid from './PropertyGrid';

interface ModernDashboardProps {
  userData: any;
  onPropertyClick: (propertyId: number) => void;
}

const ModernDashboard = ({ userData, onPropertyClick }: ModernDashboardProps) => {
  const [selectedStages, setSelectedStages] = useState(['tour_scheduled', 'disclosure_review']);
  const [selectedActions, setSelectedActions] = useState(['tour_scheduled']);
  const [selectedActivities, setSelectedActivities] = useState(['recently_updated']);

  const mockProperties = [
    {
      id: 1,
      address: "123 Maple Street",
      city: "Austin, TX",
      price: 485000,
      beds: 3,
      baths: 2,
      sqft: 1850,
      image: "/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png",
      status: "tour_scheduled",
      currentStage: "tour_scheduled",
      actionNeeded: "tour_scheduled",
      lastActivity: "recently_updated"
    },
    {
      id: 2,
      address: "456 Oak Avenue",
      city: "Austin, TX", 
      price: 520000,
      beds: 4,
      baths: 3,
      sqft: 2100,
      image: "/lovable-uploads/412b2afb-6d99-48ae-994c-74fea8162b86.png",
      status: "liked",
      currentStage: "disclosure_review",
      actionNeeded: "disclosure_review",
      lastActivity: "last_contacted"
    },
    {
      id: 3,
      address: "789 Pine Road",
      city: "Austin, TX",
      price: 445000,
      beds: 3,
      baths: 2.5,
      sqft: 1920,
      image: "/lovable-uploads/be612467-888f-45c5-ac95-d87b77add016.png",
      status: "offer_made",
      currentStage: "negotiating",
      actionNeeded: "offer_deadline",
      lastActivity: "recently_updated"
    },
    {
      id: 4,
      address: "321 Cedar Lane",
      city: "Austin, TX",
      price: 395000,
      beds: 2,
      baths: 2,
      sqft: 1650,
      image: "/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png",
      status: "interested",
      currentStage: "tour_scheduled",
      actionNeeded: "tour_scheduled",
      lastActivity: "recently_updated"
    }
  ];

  const filteredProperties = mockProperties.filter(property => {
    if (selectedStages.length > 0 && !selectedStages.includes(property.currentStage)) return false;
    if (selectedActions.length > 0 && !selectedActions.includes(property.actionNeeded)) return false;
    if (selectedActivities.length > 0 && !selectedActivities.includes(property.lastActivity)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <DashboardHeader userData={userData} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <ContinueSearchCard />

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
