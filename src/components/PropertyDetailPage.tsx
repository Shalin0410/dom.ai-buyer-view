
import { useState, useEffect } from 'react';
import { ArrowLeft, MapPin, Bed, Bath, Square, DollarSign, MessageCircle, Bot, CheckCircle, Calendar, TrendingUp, Star, Clock, Target, Loader2, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ProgressTracker from './ProgressTracker';
import ProgressTrackerLive from './ProgressTrackerLive';
import { useProperty, usePropertyActivities } from '@/hooks/useProperties';
import { useActionItems } from '@/hooks/useActionItems';
import { useAuth } from '@/contexts/AuthContext';

interface PropertyDetailPageProps {
  propertyId: string;
  onBack: () => void;
}

const PropertyDetailPage = ({ propertyId, onBack }: PropertyDetailPageProps) => {
  const [activeSection, setActiveSection] = useState('overview');
  const [chatMessage, setChatMessage] = useState('');
  const [agentMessage, setAgentMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  
  const { user } = useAuth();
  const { property, loading, error } = useProperty(propertyId);
  const { activities, loading: activitiesLoading } = usePropertyActivities(propertyId);
  const { actionItems, loading: actionItemsLoading } = useActionItems(user?.id);

  // Filter action items for this specific property
  const propertyActionItems = actionItems.filter(item => item.property_id === propertyId);



  // Handle loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Property Details</h2>
          <p className="text-gray-600">Please wait while we fetch the property information...</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <ArrowLeft className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The requested property could not be found.'}</p>
          <Button onClick={onBack} className="bg-blue-600 hover:bg-blue-700">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const calculateMonthlyPayment = () => {
    const price = property.purchase_price || property.listing_price;
    const principal = price * 0.8;
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

  const handleSendMessage = async () => {
    if (!agentMessage.trim() || !user || !property || sendingMessage) return;


    setSendingMessage(true);
    try {
      const response = await fetch('/api/send-agent-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: property.buyer?.agent?.email || 'agent@example.com',
          buyerName: user.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Buyer',
          buyerEmail: user.email,
          property: {
            address: property.address,
            city: property.city,
            state: property.state,
            zipCode: property.zip_code,
            price: property.purchase_price || property.listing_price,
            listing_price: property.listing_price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            square_feet: property.square_feet,
            year_built: property.year_built,
            property_type: property.property_type,
            mls_number: property.mls_number,
            lot_size: property.lot_size
          },
          message: agentMessage.trim()
        })
      });

      // Handle non-JSON response (like HTML error pages)
      let result;
      try {
        const responseText = await response.text();
        try {
          result = JSON.parse(responseText);
        } catch (jsonError) {
          console.error('Server returned non-JSON response:', responseText);
          throw new Error(`Server error (${response.status}): Unable to parse response`);
        }
      } catch (readError) {
        console.error('Error reading response:', readError);
        throw new Error(`Server error (${response.status}): Unable to read response`);
      }

      if (response.ok && result.success) {
        setMessageSent(true);
        setAgentMessage('');
        // Reset success message after 3 seconds
        setTimeout(() => setMessageSent(false), 3000);
      } else {
        console.error('Failed to send message:', result.error || result);
        alert(`Failed to send message: ${result.error || 'Unknown error'}. Please try again.`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'process', label: 'Process' },
    { id: 'action-items', label: 'Action Items' },
    { id: 'financials', label: 'Net Sheet' },
    { id: 'communication', label: 'Communication' }
  ];

  const getStatusColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header + Breadcrumb */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="mb-6 p-0 h-auto font-normal text-gray-700 hover:text-gray-900 text-sm"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to Dashboard
          </Button>

          {/* Property Header Card */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-8">
                <p className="text-xs tracking-widest text-gray-500 mb-2">PROPERTY DETAILS</p>
                <div className="mb-3">
                  <Badge className="bg-gray-100 text-gray-800 border border-gray-200 capitalize">
                    {property.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-3">{property.address}</h1>
                <p className="text-gray-700 flex items-center text-lg">
                  <MapPin size={18} className="mr-2 text-gray-600" />
                  {property.city}, {property.state}
                </p>
              </div>
              <div className="relative h-48 md:h-full">
                <img
                  src={property.photos?.[0]?.url || '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png'}
                  alt={`${property.address} hero`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png') {
                      target.src = '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png';
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-l from-white via-white/70 to-transparent" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow">
                  <p className="text-xs text-gray-500">Purchase Price</p>
                  <p className="text-2xl font-bold text-gray-900">${(property.purchase_price || property.listing_price).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mt-4">
            <span className="cursor-pointer hover:text-gray-700" onClick={onBack}>Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{property.address}</span>
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="mb-6">
          <nav className="flex space-x-6 border-b overflow-x-auto">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`whitespace-nowrap py-4 -mb-px text-sm font-medium border-b-2 transition-colors ${
                  activeSection === item.id
                    ? 'border-blue-600 text-gray-900'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content sections */}
        <div className="space-y-8">
          {/* Overview Section */}
          <section id="overview" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Property Overview</h2>
            
            {/* Hero Image Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 overflow-hidden mb-6">
              <div className="aspect-[16/10] bg-gray-100 relative">
                <img
                  src={property.photos?.[0]?.url || '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png'}
                  alt={`${property.address} property main image`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png') {
                      target.src = '/lovable-uploads/473b81b4-4a7f-4522-9fc2-56e9031541f0.png';
                    }
                  }}
                />
              </div>
            </div>

            {/* Property Details Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Bed size={20} className="text-blue-600" />
                    <span className="font-medium">{property.bedrooms} Bedrooms</span>
                  </div>
                  <div className="flex items-center space-x-3 text-gray-700">
                    <Bath size={20} className="text-blue-600" />
                    <span className="font-medium">{property.bathrooms} Bathrooms</span>
                  </div>
                  {property.square_feet && (
                    <div className="flex items-center space-x-3 text-gray-700">
                      <Square size={20} className="text-blue-600" />
                      <span className="font-medium">{property.square_feet.toLocaleString()} sqft</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Info</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  {property.year_built && (
                    <div className="flex justify-between">
                      <span className="font-medium">Year Built:</span>
                      <span>{property.year_built}</span>
                    </div>
                  )}
                  {property.lot_size && (
                    <div className="flex justify-between">
                      <span className="font-medium">Lot Size:</span>
                      <span>{property.lot_size} acres</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Property Type:</span>
                    <span>{property.property_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                  </div>
                  {property.mls_number && (
                    <div className="flex justify-between">
                      <span className="font-medium">MLS #:</span>
                      <span>{property.mls_number}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Investment Summary</h3>
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-gray-600">Estimated Monthly Payment</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${Math.round(calculateMonthlyPayment()).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Down Payment (20%)</span>
                      <span className="font-medium">${((property.purchase_price || property.listing_price) * 0.2).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Process Section */}
          <section id="process" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Buying Process</h2>
            {/* Use ProgressTrackerLive to show real-time timeline from database */}
            {user?.id ? (
              <ProgressTrackerLive personId={user.id} showDetailed={true} />
            ) : (
              <ProgressTracker showDetailed={true} property={property} />
            )}
          </section>

          {/* Action Items Section */}
          <section id="action-items" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Action Items</h2>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
              <div className="p-6">
                {actionItemsLoading ? (
                  <div className="text-center py-8 text-gray-500">
                    Loading action items...
                  </div>
                ) : propertyActionItems.length > 0 ? (
                  <div className="space-y-4">
                    {propertyActionItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80 hover:bg-gray-100/80 transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(item.priority)} shadow-sm`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                            <p className="text-xs text-gray-600 flex items-center">
                              <Clock size={12} className="mr-1" />
                              Due: {new Date(item.due_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <Badge className={`text-xs px-3 py-1 rounded-full ${
                          item.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          item.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          item.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {item.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                    <p>No pending action items for this property</p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Financials Section */}
          <section id="financials" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Net Sheet</h2>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
              <div className="p-6">
                <div className="flex items-center space-x-2 text-gray-900 text-lg mb-6">
                  <DollarSign size={20} className="text-blue-600" />
                  <span className="font-semibold">Monthly Payment Estimate</span>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50/80 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Purchase Price</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${(property.purchase_price || property.listing_price).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Down Payment (20%)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${((property.purchase_price || property.listing_price) * 0.2).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-4">
                      <p className="text-sm text-gray-600 mb-1">Loan Amount</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${((property.purchase_price || property.listing_price) * 0.8).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-4 text-white">
                      <p className="text-sm text-blue-100 mb-1">Monthly Payment</p>
                      <p className="text-3xl font-bold">${Math.round(calculateMonthlyPayment()).toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="bg-gray-50/80 rounded-xl p-4 space-y-3">
                    <h4 className="font-semibold text-gray-900 mb-3">Payment Breakdown</h4>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Principal & Interest</span>
                      <span className="font-medium">${Math.round(calculateMonthlyPayment()).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Property Taxes (est.)</span>
                      <span className="font-medium">${Math.round((property.purchase_price || property.listing_price) * 0.012 / 12).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Insurance (est.)</span>
                      <span className="font-medium">$150</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-3 text-gray-900">
                      <span>Total Monthly</span>
                      <span>${(Math.round(calculateMonthlyPayment()) + Math.round((property.purchase_price || property.listing_price) * 0.012 / 12) + 150).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>



          {/* Communication Section */}
          <section id="communication" className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Communication</h2>
            
            {/* AI Assistant - Commented out as requested */}
            {/*
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
            */}

            <div className="max-w-2xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border-0">
                <div className="p-6">
                  <div className="flex items-center space-x-2 text-gray-900 text-lg mb-6">
                    <MessageCircle size={20} className="text-blue-600" />
                    <span className="font-semibold">Message Your Agent</span>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100 mb-6">
                    <p className="font-medium text-gray-900 text-sm mb-1">
                      Your Agent: {property.buyer?.agent ?
                        `${property.buyer.agent.first_name} ${property.buyer.agent.last_name}` :
                        'Agent'
                      }
                    </p>
                    <p className="text-gray-700 text-xs">Send a message to your real estate agent about this property. They'll receive it via email and can respond directly to you.</p>
                  </div>

                  <Textarea
                    placeholder="Type your message about this property..."
                    value={agentMessage}
                    onChange={(e) => setAgentMessage(e.target.value)}
                    className="min-h-[120px] text-sm border-gray-200 focus:border-blue-400 bg-white/80 rounded-xl mb-4"
                    disabled={sendingMessage}
                  />

                  {messageSent && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <p className="text-sm text-green-800 font-medium">Message sent successfully!</p>
                      </div>
                      <p className="text-xs text-green-700 mt-1">Your agent will receive the email and can reply directly to you.</p>
                    </div>
                  )}

                  <Button
                    onClick={handleSendMessage}
                    disabled={!agentMessage.trim() || sendingMessage}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm shadow-lg rounded-xl py-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {sendingMessage ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} className="mr-2" />
                        Send to Agent
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;
