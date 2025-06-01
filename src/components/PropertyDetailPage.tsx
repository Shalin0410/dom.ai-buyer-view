
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
    <div className="w-full max-w-7xl mx-auto">
      {/* Header with back button */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 p-0 h-auto font-normal text-[#2E2E2E] hover:text-[#2E2E2E]/80"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Dashboard
        </Button>
        
        <div className="glass-card shadow-modern p-6">
          <h1 className="text-3xl font-bold text-[#2E2E2E] mb-2">{property.address}</h1>
          <p className="text-lg text-[#2E2E2E]/70">{property.city}</p>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="glass-card shadow-modern mb-8">
        <div className="p-6">
          <nav className="flex space-x-4 overflow-x-auto">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`whitespace-nowrap px-6 py-3 rounded-xl transition-colors font-medium ${
                  activeSection === item.id 
                    ? 'bg-gradient-to-r from-[#3B4A6B] to-[#57C6A8] text-[#E8ECF2] shadow-lg' 
                    : 'hover:bg-white/50 text-[#2E2E2E]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content sections */}
      <div className="space-y-8">
        {/* Overview Section */}
        <section id="overview" className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2E2E2E]">Property Overview</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="aspect-video bg-gray-200 rounded-2xl overflow-hidden">
              <img src={property.image} alt="Property" className="w-full h-full object-cover" />
            </div>
            <Card className="glass-card shadow-modern">
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-3xl font-bold text-[#2E2E2E]">${property.price.toLocaleString()}</h3>
                  <p className="text-[#2E2E2E]/70">{property.address}, {property.city}</p>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2 text-[#2E2E2E]">
                    <Bed size={20} />
                    <span>{property.beds} beds</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#2E2E2E]">
                    <Bath size={20} />
                    <span>{property.baths} baths</span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#2E2E2E]">
                    <Square size={20} />
                    <span>{property.sqft} sqft</span>
                  </div>
                </div>
                <div className="space-y-2 text-[#2E2E2E]">
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
          <h2 className="text-2xl font-bold text-[#2E2E2E]">Buying Process</h2>
          <ProgressTracker showDetailed={true} />
        </section>

        {/* Financials Section */}
        <section id="financials" className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2E2E2E]">Net Sheet</h2>
          
          <Card className="glass-card shadow-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-[#2E2E2E]">
                <DollarSign size={24} />
                <span>Monthly Payment Estimate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-[#2E2E2E]/70">Purchase Price</p>
                  <p className="text-2xl font-semibold text-[#2E2E2E]">${property.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2E2E2E]/70">Down Payment (20%)</p>
                  <p className="text-2xl font-semibold text-[#2E2E2E]">${(property.price * 0.2).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2E2E2E]/70">Loan Amount</p>
                  <p className="text-2xl font-semibold text-[#2E2E2E]">${(property.price * 0.8).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-[#2E2E2E]/70">Monthly Payment</p>
                  <p className="text-3xl font-bold text-[#2E2E2E]">${Math.round(calculateMonthlyPayment()).toLocaleString()}</p>
                </div>
              </div>
              <div className="border-t pt-6 space-y-3">
                <div className="flex justify-between text-lg text-[#2E2E2E]">
                  <span>Principal & Interest</span>
                  <span>${Math.round(calculateMonthlyPayment()).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg text-[#2E2E2E]">
                  <span>Property Taxes (est.)</span>
                  <span>${Math.round(property.price * 0.012 / 12).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg text-[#2E2E2E]">
                  <span>Insurance (est.)</span>
                  <span>$150</span>
                </div>
                <div className="flex justify-between font-bold text-xl border-t pt-3 text-[#2E2E2E]">
                  <span>Total Monthly</span>
                  <span>${(Math.round(calculateMonthlyPayment()) + Math.round(property.price * 0.012 / 12) + 150).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* AI Review Section */}
        <section id="ai-review" className="space-y-6">
          <h2 className="text-2xl font-bold text-[#2E2E2E]">AI Review</h2>
          
          <Card className="glass-card shadow-modern">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-[#2E2E2E]">
                <Bot size={24} />
                <span>Disclosure Analysis</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-[#57C6A8]/20 to-[#57C6A8]/10 border border-[#57C6A8]/30 rounded-2xl p-6">
                <h4 className="font-semibold text-[#2E2E2E] mb-3">Overall Assessment: Good</h4>
                <p className="text-[#2E2E2E]/80">
                  This property shows well-maintained condition with standard disclosures. No major red flags identified.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="border-l-4 border-[#F47C6D] pl-6">
                  <h5 className="font-semibold text-[#2E2E2E] mb-2">Points to Discuss</h5>
                  <ul className="text-[#2E2E2E]/80 space-y-1">
                    <li>• HVAC system is 8 years old - consider inspection timeline</li>
                    <li>• Minor foundation settling noted - typical for area</li>
                    <li>• Roof replaced 3 years ago - good condition</li>
                  </ul>
                </div>
                
                <div className="border-l-4 border-[#57C6A8] pl-6">
                  <h5 className="font-semibold text-[#2E2E2E] mb-2">Positive Highlights</h5>
                  <ul className="text-[#2E2E2E]/80 space-y-1">
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
          <h2 className="text-2xl font-bold text-[#2E2E2E]">Communication</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card shadow-modern">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-[#2E2E2E]">
                  <Bot size={24} />
                  <span>Ask AI Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea 
                  placeholder="Ask any questions about this property..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  className="min-h-[100px] input-modern"
                />
                <Button className="w-full button-primary">
                  <MessageCircle size={16} className="mr-2" />
                  Send Message
                </Button>
                
                <div className="bg-gradient-to-r from-[#E8ECF2]/60 to-white/60 backdrop-blur-sm rounded-2xl p-4">
                  <p className="font-medium text-[#2E2E2E]">AI Assistant:</p>
                  <p className="mt-2 text-[#2E2E2E]/80">I'm here to help answer questions about this property's features, neighborhood, market data, and more!</p>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card shadow-modern">
              <CardHeader>
                <CardTitle className="text-[#2E2E2E]">Message Your Agent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-[#3B4A6B]/10 to-[#57C6A8]/10 rounded-2xl p-4">
                  <p className="font-medium text-[#2E2E2E]">Sarah Chen (Agent):</p>
                  <p className="mt-2 text-[#2E2E2E]/80">Great choice! I've already reached out to the listing agent. When would you like to schedule a viewing?</p>
                  <p className="text-xs text-[#2E2E2E]/60 mt-3">2 hours ago</p>
                </div>
                
                <Textarea 
                  placeholder="Type your message to Sarah..."
                  value={agentMessage}
                  onChange={(e) => setAgentMessage(e.target.value)}
                  className="min-h-[100px] input-modern"
                />
                <Button className="w-full button-secondary">
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
