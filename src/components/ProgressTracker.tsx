
import { CheckCircle, Circle, Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

const ProgressTracker = ({ showDetailed = false, property = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Map database status to timeline steps
  const generateTimelineSteps = () => {
    const baseSteps = [
      {
        id: 1,
        title: "Research",
        description: "Initial property research and evaluation",
        status: "researching",
        stageName: "initial_research"
      },
      {
        id: 2,
        title: "Schedule Tour",
        description: "Schedule and complete property viewing",
        status: "viewing", 
        stageName: "active_search"
      },
      {
        id: 3,
        title: "Review Disclosures",
        description: "Review property disclosures and reports",
        status: "viewing",
        stageName: "active_search"
      },
      {
        id: 4,
        title: "Write Offer",
        description: "Prepare and submit your offer",
        status: "offer_submitted",
        stageName: "offer_negotiation"
      },
      {
        id: 5,
        title: "Negotiate Terms",
        description: "Negotiate price and contract terms",
        status: "offer_submitted",
        stageName: "offer_negotiation"
      },
      {
        id: 6,
        title: "Under Contract",
        description: "Offer accepted, contract signed",
        status: "under_contract",
        stageName: "under_contract"
      },
      {
        id: 7,
        title: "Home Inspection",
        description: "Professional property inspection",
        status: "under_contract",
        stageName: "under_contract"
      },
      {
        id: 8,
        title: "Appraisal",
        description: "Lender orders property appraisal",
        status: "under_contract",
        stageName: "under_contract"
      },
      {
        id: 9,
        title: "In Escrow",
        description: "Remove contingencies and prepare for closing",
        status: "in_escrow",
        stageName: "closing"
      },
      {
        id: 10,
        title: "Final Walkthrough",
        description: "Final property inspection before closing",
        status: "in_escrow",
        stageName: "closing"
      },
      {
        id: 11,
        title: "Closing",
        description: "Sign documents and get your keys!",
        status: "closed",
        stageName: "closing"
      }
    ];

    if (!property) {
      return baseSteps.map(step => ({ ...step, status: "upcoming", date: "Upcoming" }));
    }

    const currentStatus = property.status;
    const currentStage = property.buying_stage;
    
    return baseSteps.map(step => {
      let stepStatus = "upcoming";
      let date = "Upcoming";
      
      // Mark steps as completed based on current property status
      if (currentStatus === "closed") {
        stepStatus = "completed";
        date = step.id === 11 ? (property.closing_date || "Completed") : "Completed";
      } else if (currentStatus === "in_escrow") {
        if (step.id <= 9) {
          stepStatus = "completed";
          date = "Completed";
        } else if (step.id === 10) {
          stepStatus = property.action_required === "final_walkthrough" ? "in_progress" : "upcoming";
          date = stepStatus === "in_progress" ? "In Progress" : "Upcoming";
        }
      } else if (currentStatus === "under_contract") {
        if (step.id <= 6) {
          stepStatus = "completed";
          date = step.id === 6 ? (property.contract_date || property.offer_date || "Completed") : "Completed";
        } else if (step.id === 7 && property.action_required === "inspection") {
          stepStatus = "in_progress";
          date = "In Progress";
        } else if (step.id === 8 && property.action_required === "appraisal") {
          stepStatus = "in_progress";
          date = "In Progress";
        }
      } else if (currentStatus === "offer_submitted") {
        if (step.id <= 4) {
          stepStatus = "completed";
          date = step.id === 4 ? (property.offer_date || "Completed") : "Completed";
        } else if (step.id === 5) {
          stepStatus = "in_progress";
          date = "In Progress";
        }
      } else if (currentStatus === "viewing") {
        if (step.id <= 2) {
          stepStatus = "completed";
          date = "Completed";
        } else if ((step.id === 3 && property.action_required === "review_disclosures_reports") || 
                   (step.id === 4 && property.action_required === "submit_offer")) {
          stepStatus = "in_progress";
          date = "In Progress";
        }
      } else if (currentStatus === "researching") {
        if (step.id === 1) {
          stepStatus = "in_progress";
          date = "In Progress";
        } else if (step.id === 2 && property.action_required === "schedule_viewing") {
          stepStatus = "in_progress";
          date = "In Progress";
        }
      }
      
      return { ...step, status: stepStatus, date };
    });
  };

  const steps = generateTimelineSteps();

  const currentStepIndex = steps.findIndex(step => step.status === 'in_progress');
  const completedStepsCount = steps.filter(step => step.status === 'completed').length;
  
  // If there's an in-progress step, use its position for display purposes
  const currentStep = currentStepIndex >= 0 ? currentStepIndex + 1 : completedStepsCount + 1;
  
  // Calculate progress based on completed steps, plus partial credit for in-progress
  const progressValue = currentStepIndex >= 0 ? completedStepsCount + 0.5 : completedStepsCount;
  const progressPercentage = Math.max(0, (progressValue / steps.length) * 100);

  const getStepIcon = (status, index) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white relative z-10">
            <CheckCircle size={8} />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white relative z-10">
            <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      default:
        return (
          <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-sm border-2 border-gray-300 relative z-10">
            <span className="text-[8px] font-medium">{index + 1}</span>
          </div>
        );
    }
  };

  if (!showDetailed) {
    return (
      <div className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between text-gray-900">
            Your Progress
            <Badge className="bg-blue-500 text-white border-0 shadow-sm">
              {currentStep} of {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium text-gray-900">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress 
              value={progressPercentage} 
              className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
            />
            <div className="flex items-center text-sm text-gray-600">
              <Clock size={16} className="mr-2 text-blue-500" />
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
      <div className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Home Buying Progress
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300"
            >
              <span className="text-sm">Details</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>
          
          {/* Single Line Progress */}
          <div className="relative px-2">
            {/* Background Line */}
            <div className="absolute top-[6px] left-4 right-4 h-0.5 bg-gray-300 rounded-full"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute top-[6px] left-4 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-1000 ease-out shadow-sm"
              style={{ width: `calc(${progressPercentage}% * 0.9)` }}
            ></div>
            
            {/* Progress Steps - Single Line */}
            <div className="flex justify-between items-start">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  {getStepIcon(step.status, index)}
                  <span className={`text-[10px] mt-1 font-medium text-center max-w-[40px] leading-tight ${
                    step.status === 'completed' ? 'text-green-600' :
                    step.status === 'in_progress' ? 'text-blue-600' : 
                    'text-gray-500'
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
                <div className="text-lg font-bold text-gray-900">{currentStep}</div>
                <div className="text-gray-600 text-xs">Current</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-gray-600 text-xs">Complete</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{steps.length - currentStep}</div>
                <div className="text-gray-600 text-xs">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="space-y-4 animate-fade-in">
          {/* Detailed Timeline */}
          <div className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Detailed Timeline</h3>
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-all duration-300 group">
                    {getStepIcon(step.status, index)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className={`font-medium ${
                          step.status === 'completed' ? 'text-green-600' :
                          step.status === 'in_progress' ? 'text-blue-600' : 
                          'text-gray-900'
                        }`}>
                          {step.title}
                        </h4>
                        <span className="text-sm text-gray-600">{step.date}</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      {step.status === 'in_progress' && (
                        <Badge className="mt-3 bg-blue-500 text-white text-xs border-0 shadow-sm">
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
          <div className="border border-gray-200 shadow-lg bg-white/90 backdrop-blur-sm rounded-lg">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Clock size={20} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-3">Up Next</h4>
{(() => {
                    const currentInProgressStep = steps.find(s => s.status === 'in_progress');
                    const nextStep = steps.find(s => s.status === 'upcoming');
                    
                    if (!currentInProgressStep && !nextStep) {
                      return (
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          Congratulations! You've completed all the major steps in the home buying process.
                        </p>
                      );
                    }
                    
                    const step = currentInProgressStep || nextStep;
                    const actionMessages = {
                      'schedule_viewing': 'Schedule a property tour to see the home in person and evaluate its condition.',
                      'review_disclosures_reports': 'Review all property disclosures, reports, and documentation carefully.',
                      'submit_offer': 'Prepare and submit your offer with appropriate terms and pricing strategy.',
                      'inspection': 'Schedule and complete a professional home inspection to identify any issues.',
                      'appraisal': 'Your lender will order an appraisal to determine the property\'s market value.',
                      'final_walkthrough': 'Complete your final walkthrough to ensure the property is in agreed-upon condition.',
                      'none': `Focus on ${step?.title?.toLowerCase()} to continue your home buying journey.`
                    };
                    
                    const tips = {
                      'schedule_viewing': 'Bring a list of questions and look for potential issues during your tour.',
                      'review_disclosures_reports': 'Pay special attention to any disclosures about repairs, renovations, or known issues.',
                      'submit_offer': 'Consider including an escalation clause to stay competitive in this market.',
                      'inspection': 'Accompany the inspector and ask questions about any concerns they identify.',
                      'appraisal': 'Ensure the property appraises for at least your offer amount to secure financing.',
                      'final_walkthrough': 'Verify that any negotiated repairs have been completed satisfactorily.',
                      'none': 'Stay in communication with your agent and lender throughout the process.'
                    };
                    
                    return (
                      <>
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {property ? actionMessages[property.action_required] || actionMessages.none : 
                           `You're currently working on: ${step?.title}. ${step?.description}`}
                        </p>
                        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                          <div className="flex items-start space-x-3">
                            <span className="text-xl">💡</span>
                            <div>
                              <span className="font-medium text-gray-900 text-sm">Pro Tip: </span>
                              <span className="text-gray-700 text-sm">
                                {property ? tips[property.action_required] || tips.none : tips.none}
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
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
