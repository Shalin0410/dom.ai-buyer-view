import { useState } from 'react';
import { Plus, Heart, Calendar, TrendingUp, Filter, MapPin, ChevronDown, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ProgressTracker from './ProgressTracker';
import ActionItems from './ActionItems';

interface ModernDashboardProps {
  userData: any;
  onPropertyClick: (propertyId: number) => void;
}

const ModernDashboard = ({ userData, onPropertyClick }: ModernDashboardProps) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStages, setSelectedStages] = useState(['tour_scheduled', 'disclosure_review']);
  const [selectedActions, setSelectedActions] = useState(['tour_scheduled']);
  const [selectedActivities, setSelectedActivities] = useState(['recently_updated']);

  const mockStats = {
    savedHomes: 12,
    scheduledTours: 3,
    marketAlerts: 5
  };

  const mockProperties = [
    {
      id: 1,
      address: "123 Maple Street",
      city: "Austin, TX",
      price: 485000,
      beds: 3,
      baths: 2,
      sqft: 1850,
      image: "/placeholder.svg",
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
      image: "/placeholder.svg",
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
      image: "/placeholder.svg",
      status: "offer_made",
      currentStage: "negotiating",
      actionNeeded: "offer_deadline",
      lastActivity: "recently_updated"
    }
  ];

  const stages = [
    { id: 'tour_scheduled', label: 'Tour' },
    { id: 'disclosure_review', label: 'Disclosure Review' },
    { id: 'offer_submitted', label: 'Offer Submitted' },
    { id: 'negotiating', label: 'Negotiation' },
    { id: 'escrow', label: 'Escrow' },
    { id: 'inspection', label: 'Inspection' },
    { id: 'appraisal', label: 'Appraisal' },
    { id: 'contingencies', label: 'Contingencies Removed' },
    { id: 'walkthrough', label: 'Walkthrough' },
    { id: 'closing', label: 'Closing' }
  ];

  const actions = [
    { id: 'tour_scheduled', label: 'Needs Tour Scheduled' },
    { id: 'disclosure_review', label: 'Awaiting Disclosure Review' },
    { id: 'offer_deadline', label: 'Offer Deadline Approaching' },
    { id: 'inspection_needed', label: 'Inspection Needed' },
    { id: 'appraisal_pending', label: 'Appraisal Pending' }
  ];

  const activities = [
    { id: 'recently_updated', label: 'Recently Updated' },
    { id: 'last_contacted', label: 'Last Contacted' },
    { id: 'needs_follow_up', label: 'Needs Follow Up' }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'tour_scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'liked':
        return 'bg-red-100 text-red-800';
      case 'offer_made':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'tour_scheduled':
        return 'Tour Scheduled';
      case 'liked':
        return 'Liked';
      case 'offer_made':
        return 'Offer Made';
      default:
        return 'New';
    }
  };

  const filteredProperties = mockProperties.filter(property => {
    if (selectedStages.length > 0 && !selectedStages.includes(property.currentStage)) return false;
    if (selectedActions.length > 0 && !selectedActions.includes(property.actionNeeded)) return false;
    if (selectedActivities.length > 0 && !selectedActivities.includes(property.lastActivity)) return false;
    return true;
  });

  const activeFiltersCount = selectedStages.length + selectedActions.length + selectedActivities.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-lg mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Good morning, {userData?.name || 'Sarah'}!
              </h1>
              <p className="text-gray-600 mt-1">Ready to find your dream home?</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-lg">
                {userData?.name?.charAt(0) || 'S'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-6 py-6 space-y-6">
        {/* Continue Your Search - Smaller */}
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold mb-0.5">Continue Your Search</h3>
                <p className="text-blue-100 text-xs">8 new matches found</p>
              </div>
              <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-medium text-xs px-2 py-1">
                <Plus size={10} className="mr-1" />
                View
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 text-center">
              <Heart size={20} className="mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{mockStats.savedHomes}</p>
              <p className="text-xs text-gray-600">Saved</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 text-center">
              <Calendar size={20} className="mx-auto text-blue-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{mockStats.scheduledTours}</p>
              <p className="text-xs text-gray-600">Tours</p>
            </CardContent>
          </Card>
          <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
            <CardContent className="p-4 text-center">
              <TrendingUp size={20} className="mx-auto text-green-500 mb-2" />
              <p className="text-2xl font-bold text-gray-900">{mockStats.marketAlerts}</p>
              <p className="text-xs text-gray-600">Alerts</p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Tracker */}
        <ProgressTracker showDetailed={true} />

        {/* Action Items */}
        <ActionItems />

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search in properties" 
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <Filter size={16} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] h-5">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {showFilters && (
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    Save view
                  </Button>
                </div>

                <Collapsible defaultOpen>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">Stage in Buying Process</span>
                    <ChevronDown size={16} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {stages.map((stage) => (
                      <div key={stage.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={stage.id}
                          checked={selectedStages.includes(stage.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStages([...selectedStages, stage.id]);
                            } else {
                              setSelectedStages(selectedStages.filter(s => s !== stage.id));
                            }
                          }}
                        />
                        <label htmlFor={stage.id} className="text-sm cursor-pointer">
                          {stage.label}
                        </label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">Upcoming Action Required</span>
                    <ChevronDown size={16} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {actions.map((action) => (
                      <div key={action.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={action.id}
                          checked={selectedActions.includes(action.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedActions([...selectedActions, action.id]);
                            } else {
                              setSelectedActions(selectedActions.filter(a => a !== action.id));
                            }
                          }}
                        />
                        <label htmlFor={action.id} className="text-sm cursor-pointer">
                          {action.label}
                        </label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-50 rounded">
                    <span className="font-medium">Last Activity Date</span>
                    <ChevronDown size={16} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 mt-2">
                    {activities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={activity.id}
                          checked={selectedActivities.includes(activity.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedActivities([...selectedActivities, activity.id]);
                            } else {
                              setSelectedActivities(selectedActivities.filter(a => a !== activity.id));
                            }
                          }}
                        />
                        <label htmlFor={activity.id} className="text-sm cursor-pointer">
                          {activity.label}
                        </label>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Properties */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Properties</h3>
          <div className="space-y-3">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onPropertyClick(property.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                      <img 
                        src={property.image} 
                        alt="Property"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <MapPin size={14} className="text-gray-500" />
                            <p className="font-medium text-gray-900 truncate">
                              {property.address}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{property.city}</p>
                          <p className="text-lg font-bold text-gray-900">
                            ${property.price.toLocaleString()}
                          </p>
                        </div>
                        <Badge 
                          className={getStatusColor(property.status)}
                        >
                          {getStatusText(property.status)}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3 mt-2 text-xs text-gray-600">
                        <span>{property.beds} beds</span>
                        <span>•</span>
                        <span>{property.baths} baths</span>
                        <span>•</span>
                        <span>{property.sqft} sqft</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
