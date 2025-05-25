
import { useState } from 'react';
import { MessageSquare, Home, Search, BarChart3, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ChatInterface from '@/components/ChatInterface';
import PropertyMatch from '@/components/PropertyMatch';
import ProgressTracker from '@/components/ProgressTracker';
import PropertyCard from '@/components/PropertyCard';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock data for demonstration
  const mockProperties = [
    {
      id: 1,
      address: "123 Maple Street, Austin, TX 78704",
      price: 485000,
      beds: 3,
      baths: 2,
      sqft: 1850,
      fitScore: 92,
      image: "/placeholder.svg",
      status: "viewing_scheduled"
    },
    {
      id: 2,
      address: "456 Oak Avenue, Austin, TX 78758",
      price: 520000,
      beds: 4,
      baths: 3,
      sqft: 2100,
      fitScore: 87,
      image: "/placeholder.svg",
      status: "interested"
    }
  ];

  const NavButton = ({ icon: Icon, label, tabKey, count = 0 }) => (
    <button
      onClick={() => setActiveTab(tabKey)}
      className={`flex flex-col items-center p-3 rounded-lg transition-all ${
        activeTab === tabKey 
          ? 'bg-blue-600 text-white shadow-lg' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <div className="relative">
        <Icon size={24} />
        {count > 0 && (
          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-orange-500 hover:bg-orange-500">
            {count}
          </Badge>
        )}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">RealEstate AI</h1>
              <p className="text-sm text-gray-600">Your smart home buying assistant</p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-teal-600 rounded-full flex items-center justify-center">
              <User className="text-white" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Welcome Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-teal-600 text-white border-0">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-2">Welcome back, Sarah!</h2>
                <p className="text-blue-100 mb-4">You have 2 properties to review and 1 showing scheduled for tomorrow.</p>
                <Button className="bg-white text-blue-600 hover:bg-blue-50">
                  <Plus size={16} className="mr-2" />
                  Start New Search
                </Button>
              </CardContent>
            </Card>

            {/* Progress Tracker */}
            <ProgressTracker />

            {/* Matched Properties */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Your Matches</h3>
                <Button variant="ghost" size="sm" className="text-blue-600">
                  View All
                </Button>
              </div>
              <div className="space-y-4">
                {mockProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && <ChatInterface />}
        {activeTab === 'search' && <PropertyMatch />}
        {activeTab === 'progress' && <ProgressTracker showDetailed />}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-2">
          <div className="flex justify-around">
            <NavButton 
              icon={Home} 
              label="Dashboard" 
              tabKey="dashboard" 
            />
            <NavButton 
              icon={MessageSquare} 
              label="AI Chat" 
              tabKey="chat" 
              count={3}
            />
            <NavButton 
              icon={Search} 
              label="Find Homes" 
              tabKey="search" 
            />
            <NavButton 
              icon={BarChart3} 
              label="Progress" 
              tabKey="progress" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
