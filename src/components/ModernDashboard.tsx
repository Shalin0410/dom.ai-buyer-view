import { useState } from 'react';
import { Plus, Heart, Calendar, TrendingUp, Filter, MapPin, ChevronDown, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
      {/* Header - Web optimized */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Good morning, {userData?.name || 'Sarah'}!
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Ready to find your dream home?</p>
            </div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-xl">
                {userData?.name?.charAt(0) || 'S'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content - Web layout */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Your Search */}
            <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Continue Your Search</h3>
                    <p className="text-blue-100">8 new matches found based on your preferences</p>
                  </div>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-medium">
                    <Plus size={16} className="mr-2" />
                    View Matches
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search and Filters */}
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input 
                    placeholder="Search in properties" 
                    className="pl-10 h-12"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center space-x-2 h-12 ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
                >
                  <Filter size={16} />
                  <span>Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {showFilters && (
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                      <Button variant="ghost" size="sm" className="text-blue-600">
                        Save view
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Collapsible defaultOpen>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded">
                          <span className="font-medium">Stage in Buying Process</span>
                          <ChevronDown size={16} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-3">
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
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded">
                          <span className="font-medium">Upcoming Action Required</span>
                          <ChevronDown size={16} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-3">
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
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded">
                          <span className="font-medium">Last Activity Date</span>
                          <ChevronDown size={16} />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-3 mt-3">
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
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Properties */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Properties</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProperties.map((property) => (
                  <Card 
                    key={property.id} 
                    className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all cursor-pointer group"
                    onClick={() => onPropertyClick(property.id)}
                  >
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden">
                          <img 
                            src={property.image} 
                            alt="Property"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <MapPin size={16} className="text-gray-500" />
                                <p className="font-semibold text-gray-900">
                                  {property.address}
                                </p>
                              </div>
                              <p className="text-gray-600 mb-2">{property.city}</p>
                              <p className="text-xl font-bold text-gray-900">
                                ${property.price.toLocaleString()}
                              </p>
                            </div>
                            <Badge className={getStatusColor(property.status)}>
                              {getStatusText(property.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Quick Stats</h3>
              <div className="space-y-4">
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Heart size={24} className="mx-auto text-red-500 mb-3" />
                    <p className="text-3xl font-bold text-gray-900">{mockStats.savedHomes}</p>
                    <p className="text-gray-600">Saved Homes</p>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-6 text-center">
                    <Calendar size={24} className="mx-auto text-blue-500 mb-3" />
                    <p className="text-3xl font-bold text-gray-900">{mockStats.scheduledTours}</p>
                    <p className="text-gray-600">Scheduled Tours</p>
                  </CardContent>
                </Card>
                <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
                  <CardContent className="p-6 text-center">
                    <TrendingUp size={24} className="mx-auto text-green-500 mb-3" />
                    <p className="text-3xl font-bold text-gray-900">{mockStats.marketAlerts}</p>
                    <p className="text-gray-600">Market Alerts</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Items */}
            <ActionItems />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
