
import { Plus, Heart, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModernDashboardProps {
  userData: any;
}

const ModernDashboard = ({ userData }: ModernDashboardProps) => {
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
      status: "tour_scheduled"
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
      status: "liked"
    }
  ];

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

        {/* Quick Actions */}
        <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-3">Continue Your Search</h3>
            <p className="text-blue-100 mb-4 text-sm">
              We found 8 new properties that match your preferences
            </p>
            <Button className="bg-white text-blue-600 hover:bg-blue-50 font-medium">
              <Plus size={16} className="mr-2" />
              View New Matches
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {mockProperties.map((property) => (
              <Card key={property.id} className="border-0 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                      <img 
                        src={property.image} 
                        alt="Property"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900 truncate">
                            {property.address}
                          </p>
                          <p className="text-sm text-gray-600">{property.city}</p>
                          <p className="text-sm font-semibold text-gray-900">
                            ${property.price.toLocaleString()}
                          </p>
                        </div>
                        <Badge 
                          variant={property.status === 'tour_scheduled' ? 'default' : 'secondary'}
                          className={property.status === 'tour_scheduled' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                          }
                        >
                          {property.status === 'tour_scheduled' ? 'Tour Set' : 'Liked'}
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
