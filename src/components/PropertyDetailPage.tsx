
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Bed, Bath, Square, DollarSign, MessageCircle, Bot, CheckCircle, Calendar, TrendingUp, Star, Clock, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ProgressTracker from './ProgressTracker';

interface PropertyDetailPageProps {
  propertyId: string;
  onBack: () => void;
}

const PropertyDetailPage = ({ propertyId, onBack }: PropertyDetailPageProps) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [chatMessage, setChatMessage] = useState('');
  const [agentMessage, setAgentMessage] = useState('');

  // Mock property data
  const property = {
    id: propertyId,
    address: "123 Maple Street",
    city: "Austin, TX",
    price: 485000,
    beds: 3,
    baths: 2,
    sqft: 1850,
    image: "/placeholder.svg",
    currentStage: "tour_scheduled",
    whySuitable: "Perfect for your growing family with excellent school district ratings (9/10), walkable neighborhood, and modern updates throughout. The open floor plan matches your preference for entertaining spaces.",
    upsellValue: "Expected 5-7% annual appreciation based on neighborhood trends. Recent comparable sales show $26K average appreciation over 2 years. Prime location near tech corridor adds long-term value potential."
  };

  const actionItems = [
    { id: 1, task: "Schedule home inspection", status: "pending", dueDate: "Dec 15, 2024" },
    { id: 2, task: "Submit mortgage pre-approval", status: "completed", dueDate: "Dec 10, 2024" },
    { id: 3, task: "Review HOA documents", status: "pending", dueDate: "Dec 18, 2024" },
    { id: 4, task: "Schedule final walkthrough", status: "upcoming", dueDate: "Dec 20, 2024" }
  ];

  const calculateMonthlyPayment = () => {
    const principal = property?.price * 0.8;
    const monthlyRate = 0.07 / 12;
    const numPayments = 30 * 12;
    const monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                    (Math.pow(1 + monthlyRate, numPayments) - 1);
    return monthly;
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'process', label: 'Process' },
    { id: 'action-items', label: 'Action Items' },
    { id: 'financials', label: 'Net Sheet' },
    { id: 'ai-review', label: 'AI Review' },
    { id: 'communication', label: 'Communication' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-gray-400';
      case 'upcoming': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8ECF2] via-white to-[#F47C6D]/10">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header with back button */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6 p-0 h-auto font-normal text-gray-700 hover:text-gray-900 text-sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          
          <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.address}</h1>
              <p className="text-base text-gray-600 flex items-center">
                <MapPin size={16} className="mr-2" />
                {property.city}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation tabs */}
        <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm mb-8">
          <CardContent className="p-6">
            <nav className="flex space-x-2 overflow-x-auto">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
                    activeSection === item.id 
                      ? 'bg-gray-900 text-white shadow-md' 
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content sections */}
        <div className="space-y-8">
          {/* Overview Section */}
          <section id="overview" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Property Overview</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <img src={property.image} alt="Property" className="w-full h-full object-cover" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-gray-900 text-white text-xs px-2 py-1 shadow-md">
                      <Star size={10} className="mr-1" />
                      Perfect Match
                    </Badge>
                  </div>
                </div>
              </Card>

              <div className="space-y-4">
                <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">${property.price.toLocaleString()}</h3>
                      <p className="text-gray-600 text-sm">{property.address}, {property.city}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-6 text-sm">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Bed size={18} />
                        <span>{property.beds} beds</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Bath size={18} />
                        <span>{property.baths} baths</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Square size={18} />
                        <span>{property.sqft} sqft</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><strong>Year Built:</strong> 2018</p>
                      <p><strong>Lot Size:</strong> 0.25 acres</p>
                      <p><strong>Property Type:</strong> Single Family</p>
                      <p><strong>Days on Market:</strong> 15</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Why Suitable Section */}
                <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <div className="flex items-start space-x-2 mb-3">
                        <Target size={16} className="text-blue-500 mt-0.5 flex-shrink-0" />
                        <h4 className="text-sm font-semibold text-gray-900">Why this home suits you</h4>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed mb-4">
                        {property.whySuitable}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-start space-x-2 mb-3">
                        <TrendingUp size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        <h4 className="text-sm font-semibold text-gray-900">Value Potential</h4>
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {property.upsellValue}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section id="process" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Buying Process</h2>
            <ProgressTracker showDetailed={true} />
          </section>

          {/* Action Items Section */}
          <section id="action-items" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Action Items</h2>
            
            <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {actionItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)} shadow-sm`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.task}</p>
                          <p className="text-xs text-gray-600 flex items-center">
                            <Clock size={12} className="mr-1" />
                            Due: {item.dueDate}
                          </p>
                        </div>
                      </div>
                      <Badge className={`text-xs px-2 py-1 ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'pending' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Financials Section */}
          <section id="financials" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Net Sheet</h2>
            
            <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 text-lg">
                  <DollarSign size={20} />
                  <span>Monthly Payment Estimate</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-gray-600">Purchase Price</p>
                    <p className="text-xl font-semibold text-gray-900">${property.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Down Payment (20%)</p>
                    <p className="text-xl font-semibold text-gray-900">${(property.price * 0.2).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Loan Amount</p>
                    <p className="text-xl font-semibold text-gray-900">${(property.price * 0.8).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Monthly Payment</p>
                    <p className="text-2xl font-bold text-gray-900">${Math.round(calculateMonthlyPayment()).toLocaleString()}</p>
                  </div>
                </div>
                <div className="border-t pt-6 space-y-3">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Principal & Interest</span>
                    <span>${Math.round(calculateMonthlyPayment()).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Property Taxes (est.)</span>
                    <span>${Math.round(property.price * 0.012 / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Insurance (est.)</span>
                    <span>$150</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t pt-3 text-gray-900">
                    <span>Total Monthly</span>
                    <span>${(Math.round(calculateMonthlyPayment()) + Math.round(property.price * 0.012 / 12) + 150).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI Review Section */}
          <section id="ai-review" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">AI Review</h2>
            
            <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-gray-900 text-lg">
                  <Bot size={20} />
                  <span>Disclosure Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-green-200 rounded-lg p-4 shadow-sm">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Overall Assessment: Good</h4>
                  <p className="text-gray-700 text-xs">
                    This property shows well-maintained condition with standard disclosures. No major red flags identified.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="border-l-4 border-red-400 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm">Points to Discuss</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• HVAC system is 8 years old - consider inspection timeline</li>
                      <li>• Minor foundation settling noted - typical for area</li>
                      <li>• Roof replaced 3 years ago - good condition</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-green-400 pl-4">
                    <h5 className="font-semibold text-gray-900 mb-2 text-sm">Positive Highlights</h5>
                    <ul className="text-gray-700 space-y-1 text-xs">
                      <li>• Recently updated electrical system</li>
                      <li>• No history of major repairs</li>
                      <li>• Energy-efficient windows installed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Communication Section */}
          <section id="communication" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Communication</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-gray-900 text-lg">
                    <Bot size={20} />
                    <span>Ask AI Assistant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Ask any questions about this property..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="min-h-[100px] text-sm border-gray-200 focus:border-gray-400 bg-white"
                  />
                  <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white text-sm shadow-md">
                    <MessageCircle size={16} className="mr-2" />
                    Send Message
                  </Button>
                  
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-medium text-gray-900 text-sm">AI Assistant:</p>
                    <p className="mt-2 text-gray-700 text-xs">I'm here to help answer questions about this property's features, neighborhood, market data, and more!</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-gray-900 text-lg">Message Your Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="font-medium text-gray-900 text-sm">Sarah Chen (Agent):</p>
                    <p className="mt-2 text-gray-700 text-xs">Great choice! I've already reached out to the listing agent. When would you like to schedule a viewing?</p>
                    <p className="text-xs text-gray-400 mt-3">2 hours ago</p>
                  </div>
                  
                  <Textarea 
                    placeholder="Type your message to Sarah..."
                    value={agentMessage}
                    onChange={(e) => setAgentMessage(e.target.value)}
                    className="min-h-[100px] text-sm border-gray-200 focus:border-gray-400 bg-white"
                  />
                  <Button className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm shadow-md">
                    Send to Agent
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
