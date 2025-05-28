
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
          <div className="w-4 h-4 bg-gradient-to-r from-brand-teal to-brand-teal/80 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white relative z-10">
            <CheckCircle size={8} />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-4 h-4 bg-gradient-to-r from-brand-coral to-brand-coral/80 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white relative z-10">
            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      default:
        return (
          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center text-brand-navy/60 shadow-sm border-2 border-brand-gray relative z-10">
            <span className="text-xs font-medium">{index + 1}</span>
          </div>
        );
    }
  };

  if (!showDetailed) {
    return (
      <div className="glass-card shadow-modern">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between text-brand-navy">
            Your Progress
            <Badge className="bg-gradient-to-r from-brand-coral to-brand-coral/80 text-white border-0 shadow-sm">
              {currentStep} of {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-navy/70">Overall Progress</span>
              <span className="font-medium text-brand-navy">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="w-full h-2 bg-brand-gray rounded-full overflow-hidden"
            />
            <div className="flex items-center text-sm text-brand-navy/70">
              <Clock size={16} className="mr-2 text-brand-coral" />
              Currently: {steps.find(s => s.status === 'in_progress')?.title}
            </div>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Progress Line */}
      <div className="glass-card shadow-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-brand-navy">
              Home Buying Progress
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-brand-navy/70 hover:text-brand-navy hover:bg-white/60 rounded-xl transition-all duration-300"
            >
              <span className="text-sm">Details</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
          
          {/* Single Line Progress */}
          <div className="relative px-2">
            {/* Background Line */}
            <div className="absolute top-[8px] left-4 right-4 h-0.5 bg-brand-gray rounded-full"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute top-[8px] left-4 h-0.5 bg-gradient-to-r from-brand-teal via-brand-coral to-brand-coral rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `calc(${progressPercentage}% * 0.9)` }}
            ></div>
            
            {/* Progress Steps - Single Line */}
            <div className="flex justify-between items-start">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  {getStepIcon(step.status, index)}
                  <span className={`text-xs mt-2 font-medium text-center max-w-[50px] leading-tight ${
                    step.status === 'completed' ? 'text-brand-teal' :
                    step.status === 'in_progress' ? 'text-brand-coral' : 
                    'text-brand-navy/50'
                  }`}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Compact Stats */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-brand-navy">{currentStep}</div>
                <div className="text-brand-navy/60 text-xs">Current</div>
              </div>
              <div className="w-px h-8 bg-brand-gray"></div>
              <div className="text-center">
                <div className="text-lg font-bold bg-gradient-to-r from-brand-coral to-brand-teal bg-clip-text text-transparent">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-brand-navy/60 text-xs">Complete</div>
              </div>
              <div className="w-px h-8 bg-brand-gray"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-brand-navy">{steps.length - currentStep}</div>
                <div className="text-brand-navy/60 text-xs">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Detailed Timeline */}
          <div className="glass-card shadow-modern">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-brand-navy">Detailed Timeline</h3>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-white/40 transition-all duration-300 group">
                    {getStepIcon(step.status, index)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${
                          step.status === 'completed' ? 'text-brand-teal' :
                          step.status === 'in_progress' ? 'text-brand-coral' : 
                          'text-brand-navy'
                        }`}>
                          {step.title}
                        </h4>
                        <span className="text-sm text-brand-navy/60">{step.date}</span>
                      </div>
                      <p className="text-sm text-brand-navy/70 mt-1">{step.description}</p>
                      {step.status === 'in_progress' && (
                        <Badge className="mt-3 bg-gradient-to-r from-brand-coral to-brand-coral/80 text-white text-xs border-0 shadow-sm">
                          Current Step
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </div>

          {/* Up Next Card */}
          <div className="glass-card shadow-floating bg-gradient-to-br from-brand-coral/10 via-white/60 to-brand-teal/10">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-brand-coral to-brand-coral/80 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Clock size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-brand-navy mb-3">Up Next</h4>
                  <p className="text-brand-navy/80 mb-4 leading-relaxed">
                    You're currently working on writing your offer. Make sure to review the property disclosures and prepare your financing documentation.
                  </p>
                  <div className="glass-card p-4 shadow-sm bg-gradient-to-r from-white/80 to-brand-teal/5">
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <span className="font-medium text-brand-navy text-sm">Pro Tip: </span>
                        <span className="text-brand-navy/80 text-sm">
                          Consider including an escalation clause in your offer to stay competitive in this market.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
