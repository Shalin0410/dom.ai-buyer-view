
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapPin, Bed, Bath, Square, DollarSign, MessageCircle, Bot, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

interface PropertyDetailModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
}

const PropertyDetailModal = ({ property, isOpen, onClose }: PropertyDetailModalProps) => {
  const [chatMessage, setChatMessage] = useState('');
  const [agentMessage, setAgentMessage] = useState('');

  const processStages = [
    'Tour', 'Review Disclosures', 'Write Offer', 'Negotiate Terms', 
    'Offer Accepted', 'Home Inspection', 'Appraisal', 'Remove Contingencies', 
    'Final Walkthrough', 'Closing'
  ];

  const getCurrentStageIndex = () => {
    const stageMap = {
      'tour_scheduled': 0,
      'disclosure_review': 1,
      'offer_written': 2,
      'negotiating': 3,
      'offer_accepted': 4,
      'inspection': 5,
      'appraisal': 6,
      'contingencies': 7,
      'walkthrough': 8,
      'closing': 9
    };
    return stageMap[property?.currentStage] || 0;
  };

  const calculateMonthlyPayment = () => {
    // Simple calculation: 20% down, 7% interest rate, 30 years
    const principal = property?.price * 0.8;
    const monthlyRate = 0.07 / 12;
    const numPayments = 30 * 12;
    const monthly = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                    (Math.pow(1 + monthlyRate, numPayments) - 1);
    return monthly;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin size={20} />
            <span>{property?.address}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="process">Process</TabsTrigger>
            <TabsTrigger value="financials">Net Sheet</TabsTrigger>
            <TabsTrigger value="ai-review">AI Review</TabsTrigger>
            <TabsTrigger value="communication">Communication</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video bg-gray-200 rounded-lg">
                <img src={property?.image} alt="Property" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">${property?.price?.toLocaleString()}</h3>
                  <p className="text-gray-600">{property?.address}</p>
                </div>
                <div className="flex space-x-4">
                  <div className="flex items-center space-x-1">
                    <Bed size={16} />
                    <span>{property?.beds} beds</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Bath size={16} />
                    <span>{property?.baths} baths</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Square size={16} />
                    <span>{property?.sqft} sqft</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p><strong>Year Built:</strong> 2018</p>
                  <p><strong>Lot Size:</strong> 0.25 acres</p>
                  <p><strong>Property Type:</strong> Single Family</p>
                  <p><strong>Days on Market:</strong> 15</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="process" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Buying Process Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processStages.map((stage, index) => {
                    const isCompleted = index < getCurrentStageIndex();
                    const isCurrent = index === getCurrentStageIndex();
                    
                    return (
                      <div key={stage} className={`flex items-center space-x-3 p-3 rounded-lg ${
                        isCurrent ? 'bg-blue-50 border border-blue-200' : 
                        isCompleted ? 'bg-green-50' : 'bg-gray-50'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="text-green-600" size={20} />
                        ) : isCurrent ? (
                          <Calendar className="text-blue-600" size={20} />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                        )}
                        <span className={`font-medium ${
                          isCurrent ? 'text-blue-900' : 
                          isCompleted ? 'text-green-900' : 'text-gray-600'
                        }`}>
                          {stage}
                        </span>
                        {isCurrent && (
                          <Badge className="bg-blue-100 text-blue-800">Current</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign size={20} />
                  <span>Monthly Payment Estimate</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Purchase Price</p>
                    <p className="text-lg font-semibold">${property?.price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Down Payment (20%)</p>
                    <p className="text-lg font-semibold">${((property?.price || 0) * 0.2).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Loan Amount</p>
                    <p className="text-lg font-semibold">${((property?.price || 0) * 0.8).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Monthly Payment</p>
                    <p className="text-xl font-bold text-blue-600">${Math.round(calculateMonthlyPayment()).toLocaleString()}</p>
                  </div>
                </div>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Principal & Interest</span>
                    <span>${Math.round(calculateMonthlyPayment()).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Property Taxes (est.)</span>
                    <span>${Math.round((property?.price || 0) * 0.012 / 12).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Insurance (est.)</span>
                    <span>$150</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total Monthly</span>
                    <span>${(Math.round(calculateMonthlyPayment()) + Math.round((property?.price || 0) * 0.012 / 12) + 150).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-review" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot size={20} />
                  <span>AI Disclosure Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">Overall Assessment: Good</h4>
                  <p className="text-green-700 text-sm">
                    This property shows well-maintained condition with standard disclosures. No major red flags identified.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="border-l-4 border-yellow-400 pl-4">
                    <h5 className="font-semibold text-yellow-800">Points to Discuss</h5>
                    <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                      <li>• HVAC system is 8 years old - consider inspection timeline</li>
                      <li>• Minor foundation settling noted - typical for area</li>
                      <li>• Roof replaced 3 years ago - good condition</li>
                    </ul>
                  </div>
                  
                  <div className="border-l-4 border-blue-400 pl-4">
                    <h5 className="font-semibold text-blue-800">Positive Highlights</h5>
                    <ul className="text-sm text-blue-700 mt-1 space-y-1">
                      <li>• Recently updated electrical system</li>
                      <li>• No history of major repairs</li>
                      <li>• Energy-efficient windows installed</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bot size={20} />
                    <span>Ask AI Assistant</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Ask any questions about this property..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                  />
                  <Button className="w-full">
                    <MessageCircle size={16} className="mr-2" />
                    Send Message
                  </Button>
                  
                  <div className="bg-gray-50 rounded-lg p-3 text-sm">
                    <p className="font-medium">AI Assistant:</p>
                    <p className="mt-1">I'm here to help answer questions about this property's features, neighborhood, market data, and more!</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Your Agent</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <p className="font-medium">Sarah Chen (Agent):</p>
                    <p className="mt-1">Great choice! I've already reached out to the listing agent. When would you like to schedule a viewing?</p>
                    <p className="text-xs text-gray-500 mt-2">2 hours ago</p>
                  </div>
                  
                  <Textarea 
                    placeholder="Type your message to Sarah..."
                    value={agentMessage}
                    onChange={(e) => setAgentMessage(e.target.value)}
                  />
                  <Button className="w-full" variant="outline">
                    Send to Agent
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailModal;
