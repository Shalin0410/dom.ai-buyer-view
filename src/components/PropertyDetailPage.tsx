
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Bed, Bath, Square, DollarSign, MessageCircle, Bot, CheckCircle, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ProgressTracker from './ProgressTracker';

interface PropertyDetailPageProps {
  propertyId: number;
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
    currentStage: "tour_scheduled"
  };

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
    { id: 'financials', label: 'Net Sheet' },
    { id: 'ai-review', label: 'AI Review' },
    { id: 'communication', label: 'Communication' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Navigation */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 fixed h-full overflow-y-auto">
        <div className="p-6">
          <Button 
            variant="ghost" 
            onClick={onBack}
            className="mb-6 p-0 h-auto font-normal text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">{property.address}</h2>
            <p className="text-sm text-gray-600">{property.city}</p>
          </div>

          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeSection === item.id 
                    ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 p-8 space-y-8">
        {/* Overview Section */}
        <section id="overview" className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Property Overview</h1>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="aspect-video bg-gray-200 rounded-lg">
              <img src={property.image} alt="Property" className="w-full h-full object-cover rounded-lg" />
            </div>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">${property.price.toLocaleString()}</h3>
                  <p className="text-gray-600">{property.address}, {property.city}</p>
                </div>
                <div className="flex space-x-6">
                  <div className="flex items-center space-x-2">
                    <Bed size={20} />
                    <span>{property.beds} beds</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Bath size={20} />
                    <span>{property.baths} baths</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Square size={20} />
                    <span>{property.sqft} sqft</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><strong>Year Built:</strong> 2018</p>
                  <p><strong>Lot Size:</strong> 0.25 acres</p>
                  <p><strong>Property Type:</strong> Single Family</p>
                  <p><strong>Days on Market:</strong> 15</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Process Section */}
        <section id="process" className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Buying Process</h1>
          
          <ProgressTracker showDetailed={true} />
        </section>

        {/* Financials Section */}
        <section id="financials" className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Net Sheet</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign size={24} />
                <span>Monthly Payment Estimate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Purchase Price</p>
                  <p className="text-2xl font-semibold">${property.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Down Payment (20%)</p>
                  <p className="text-2xl font-semibold">${(property.price * 0.2).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Loan Amount</p>
                  <p className="text-2xl font-semibold">${(property.price * 0.8).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Monthly Payment</p>
                  <p className="text-3xl font-bold text-blue-600">${Math.round(calculateMonthlyPayment()).toLocaleString()}</p>
                </div>
              </div>
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between text-lg">
                  <span>Principal & Interest</span>
                  <span>${Math.round(calculateMonthlyPayment()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Property Taxes (est.)</span>
                  <span>${Math.round(property.price * 0.012 / 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span>Insurance (est.)</span>
                  <span>$150</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t pt-3">
                  <span>Total Monthly</span>
                  <span>${(Math.round(calculateMonthlyPayment()) + Math.round(property.price * 0.012 / 12) + 150).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* AI Review Section */}
        <section id="ai-review" className="space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">AI Review</h1>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bot size={24} />
                <span>Disclosure Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="font-semibold text-green-800 mb-3">Overall Assessment: Good</h4>
                <p className="text-green-700">
                  This property shows well-maintained condition with standard disclosures. No major red flags identified.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-yellow-400 pl-6">
                  <h5 className="font-semibold text-yellow-800 mb-2">Points to Discuss</h5>
                  <ul className="text-yellow-700 space-y-1">
                    <li>• HVAC system is 8 years old - consider inspection timeline</li>
                    <li>• Minor foundation settling noted - typical for area</li>
                    <li>• Roof replaced 3 years ago - good condition</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-blue-400 pl-6">
                  <h5 className="font-semibold text-blue-800 mb-2">Positive Highlights</h5>
                  <ul className="text-blue-700 space-y-1">
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
          <h1 className="text-3xl font-bold text-gray-900">Communication</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot size={24} />
                  <span>Ask AI Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Ask any questions about this property..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button className="w-full">
                  <MessageCircle size={16} className="mr-2" />
                  Send Message
                </Button>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="font-medium">AI Assistant:</p>
                  <p className="mt-2">I'm here to help answer questions about this property's features, neighborhood, market data, and more!</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Message Your Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="font-medium">Sarah Chen (Agent):</p>
                  <p className="mt-2">Great choice! I've already reached out to the listing agent. When would you like to schedule a viewing?</p>
                  <p className="text-xs text-gray-500 mt-3">2 hours ago</p>
                </div>
                
                <Textarea 
                  placeholder="Type your message to Sarah..."
                  value={agentMessage}
                  onChange={(e) => setAgentMessage(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button className="w-full" variant="outline">
                  Send to Agent
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
