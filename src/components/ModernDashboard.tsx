
import { useState } from 'react';
import { Plus, Heart, Calendar, TrendingUp, Filter, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PropertyDetailModal from '@/components/PropertyDetailModal';

interface ModernDashboardProps {
  userData: any;
}

const ModernDashboard = ({ userData }: ModernDashboardProps) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');

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

  const handlePropertyClick = (property) => {
    setSelectedProperty(property);
    setIsModalOpen(true);
  };

  const filteredProperties = mockProperties.filter(property => {
    if (stageFilter !== 'all' && property.currentStage !== stageFilter) return false;
    if (actionFilter !== 'all' && property.actionNeeded !== actionFilter) return false;
    if (activityFilter !== 'all' && property.lastActivity !== activityFilter) return false;
    return true;
  });

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
          <CardContent className="p-4">
            <h3 className="text-base font-semibold mb-2">Continue Your Search</h3>
            <p className="text-blue-100 mb-3 text-sm">
              8 new matches found
            </p>
            <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50 font-medium">
              <Plus size={14} className="mr-1" />
              View Matches
            </Button>
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

        {/* Filters */}
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-4">
              <Filter size={16} className="text-gray-600" />
              <h3 className="font-semibold text-gray-900">Filters</h3>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Stage in Buying Process
                </label>
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All stages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stages</SelectItem>
                    <SelectItem value="tour_scheduled">Tour</SelectItem>
                    <SelectItem value="disclosure_review">Disclosure Review</SelectItem>
                    <SelectItem value="offer_submitted">Offer Submitted</SelectItem>
                    <SelectItem value="negotiating">Negotiation</SelectItem>
                    <SelectItem value="escrow">Escrow</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="appraisal">Appraisal</SelectItem>
                    <SelectItem value="contingencies">Contingencies Removed</SelectItem>
                    <SelectItem value="walkthrough">Walkthrough</SelectItem>
                    <SelectItem value="closing">Closing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Upcoming Action Required
                </label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="tour_scheduled">Needs Tour Scheduled</SelectItem>
                    <SelectItem value="disclosure_review">Awaiting Disclosure Review</SelectItem>
                    <SelectItem value="offer_deadline">Offer Deadline Approaching</SelectItem>
                    <SelectItem value="inspection_needed">Inspection Needed</SelectItem>
                    <SelectItem value="appraisal_pending">Appraisal Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Last Activity Date
                </label>
                <Select value={activityFilter} onValueChange={setActivityFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Activity</SelectItem>
                    <SelectItem value="recently_updated">Recently Updated</SelectItem>
                    <SelectItem value="last_contacted">Last Contacted</SelectItem>
                    <SelectItem value="needs_follow_up">Needs Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Properties</h3>
          <div className="space-y-3">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePropertyClick(property)}
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

      <PropertyDetailModal 
        property={selectedProperty}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default ModernDashboard;
