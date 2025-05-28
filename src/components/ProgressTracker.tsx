
import { CheckCircle, Circle, Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

const ProgressTracker = ({ showDetailed = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      id: 1,
      title: "Tour",
      description: "Schedule and complete property tour",
      status: "completed",
      date: "2024-01-15"
    },
    {
      id: 2,
      title: "Review Disclosures", 
      description: "Review property disclosures and reports",
      status: "completed",
      date: "2024-01-18"
    },
    {
      id: 3,
      title: "Write Offer",
      description: "Prepare and submit your offer",
      status: "in_progress",
      date: "In Progress"
    },
    {
      id: 4,
      title: "Negotiate Terms",
      description: "Negotiate price and contract terms", 
      status: "upcoming",
      date: "Upcoming"
    },
    {
      id: 5,
      title: "Offer Accepted",
      description: "Celebrate your accepted offer",
      status: "upcoming", 
      date: "Upcoming"
    },
    {
      id: 6,
      title: "Home Inspection",
      description: "Professional property inspection",
      status: "upcoming", 
      date: "Upcoming"
    },
    {
      id: 7,
      title: "Appraisal",
      description: "Lender orders property appraisal",
      status: "upcoming", 
      date: "Upcoming"
    },
    {
      id: 8,
      title: "Remove Contingencies",
      description: "Remove inspection and appraisal contingencies",
      status: "upcoming", 
      date: "Upcoming"
    },
    {
      id: 9,
      title: "Final Walkthrough",
      description: "Final property inspection before closing",
      status: "upcoming", 
      date: "Upcoming"
    },
    {
      id: 10,
      title: "Closing",
      description: "Sign documents and get your keys!",
      status: "upcoming", 
      date: "Upcoming"
    }
  ];

  const currentStep = steps.findIndex(step => step.status === 'in_progress') + 1;
  const progressPercentage = ((currentStep - 1) / (steps.length - 1)) * 100;

  const getStepIcon = (status, index) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white relative z-10">
            <CheckCircle size={10} />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm border-2 border-white relative z-10">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      default:
        return (
          <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shadow-sm border-2 border-white relative z-10">
            <span className="text-xs font-medium">{index + 1}</span>
          </div>
        );
    }
  };

  if (!showDetailed) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            Your Progress
            <Badge variant="outline">{currentStep} of {steps.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-2" />
              Currently: {steps.find(s => s.status === 'in_progress')?.title}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Progress Line */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">
              Home Buying Progress
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2"
            >
              <span className="text-sm">Details</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
          
          {/* Single Line Progress */}
          <div className="relative px-2">
            {/* Background Line */}
            <div className="absolute top-[10px] left-4 right-4 h-0.5 bg-gray-200 rounded-full"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute top-[10px] left-4 h-0.5 bg-gradient-to-r from-green-500 via-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `calc(${progressPercentage}% * 0.9)` }}
            ></div>
            
            {/* Progress Steps - Single Line */}
            <div className="flex justify-between items-start">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  {getStepIcon(step.status, index)}
                  <span className={`text-xs mt-1 font-medium text-center max-w-[60px] leading-tight ${
                    step.status === 'completed' ? 'text-green-700' :
                    step.status === 'in_progress' ? 'text-blue-700' : 
                    'text-gray-500'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Compact Stats */}
          <div className="flex justify-center mt-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="text-center">
                <div className="text-base font-bold text-gray-900">{currentStep}</div>
                <div className="text-gray-600 text-xs">Current</div>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-base font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
                <div className="text-gray-600 text-xs">Complete</div>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-base font-bold text-gray-900">{steps.length - currentStep}</div>
                <div className="text-gray-600 text-xs">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Detailed Timeline */}
          <Card className="bg-white shadow-sm">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Timeline</h3>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    {getStepIcon(step.status, index)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${
                          step.status === 'completed' ? 'text-green-700' :
                          step.status === 'in_progress' ? 'text-blue-700' : 
                          'text-gray-700'
                        }`}>
                          {step.title}
                        </h4>
                        <span className="text-sm text-gray-500">{step.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      {step.status === 'in_progress' && (
                        <Badge className="mt-2 bg-blue-50 text-blue-700 text-xs">
                          Current Step
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Up Next Card */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-2">Up Next</h4>
                  <p className="text-blue-800 mb-3">
                    You're currently working on writing your offer. Make sure to review the property disclosures and prepare your financing documentation.
                  </p>
                  <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <span className="text-lg">💡</span>
                      <div>
                        <span className="font-medium text-blue-900 text-sm">Pro Tip: </span>
                        <span className="text-blue-800 text-sm">
                          Consider including an escalation clause in your offer to stay competitive in this market.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
