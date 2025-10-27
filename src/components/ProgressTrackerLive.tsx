// Live Progress Tracker with Real-time Timeline Data
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useTimelineOperations } from '@/hooks/useTimeline';
import { TimelineStep } from '@/services/api/types';
import { format } from 'date-fns';

interface ProgressTrackerProps {
  personId: string;
  showDetailed?: boolean;
}

const ProgressTrackerLive = ({ personId, showDetailed = false }: ProgressTrackerProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { timeline, summary, isLoading, error } = useTimelineOperations(personId);

  if (isLoading) {
    return (
      <div className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2 text-gray-600">
          <Clock className="animate-spin" size={20} />
          <span>Loading your timeline...</span>
        </div>
      </div>
    );
  }

  if (error || !timeline || !summary) {
    return (
      <div className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg p-6">
        <div className="flex items-center space-x-2 text-amber-600">
          <AlertCircle size={20} />
          <span>Timeline not available yet. Your agent will set this up for you.</span>
        </div>
      </div>
    );
  }

  // Map agent's detailed timeline steps to buyer-friendly simplified steps
  const buyerFriendlySteps = [
    { id: 1, title: "Tour", description: "Schedule and complete property tour", agentSteps: ["tour", "viewing", "showings"] },
    { id: 2, title: "Review Disclosures", description: "Review property disclosures and reports", agentSteps: ["disclosures", "seller disclosures"] },
    { id: 3, title: "Write Offer", description: "Prepare and submit your offer", agentSteps: ["offer", "prepare offer"] },
    { id: 4, title: "Negotiate Terms", description: "Negotiate price and contract terms", agentSteps: ["negotiate", "counteroffers"] },
    { id: 5, title: "Offer Accepted", description: "Celebrate your accepted offer", agentSteps: ["open escrow", "earnest money", "wire earnest"] },
    { id: 6, title: "Home Inspection", description: "Professional property inspection", agentSteps: ["inspection", "begin inspections"] },
    { id: 7, title: "Appraisal", description: "Lender orders property appraisal", agentSteps: ["appraisal"] },
    { id: 8, title: "Remove Contingencies", description: "Remove inspection and appraisal contingencies", agentSteps: ["contingenc", "loan underwritten", "loan approved", "removes"] },
    { id: 9, title: "Final Walkthrough", description: "Final property inspection before closing", agentSteps: ["walkthrough", "final walkthrough"] },
    { id: 10, title: "Closing", description: "Sign documents and get your keys!", agentSteps: ["closing disclosure", "buyer signs", "escrow closes", "receives keys", "close"] }
  ];

  const agentSteps = timeline.steps || [];

  // Calculate which buyer-friendly steps are complete based on agent's timeline
  const steps = buyerFriendlySteps.map(buyerStep => {
    // Check if any agent steps matching this buyer step are completed
    const matchingAgentSteps = agentSteps.filter((agentStep: TimelineStep) =>
      buyerStep.agentSteps.some(keyword =>
        agentStep.custom_step_name?.toLowerCase().includes(keyword.toLowerCase()) ||
        agentStep.template_name?.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    const isCompleted = matchingAgentSteps.length > 0 &&
                       matchingAgentSteps.some((s: TimelineStep) => s.is_completed);

    const completedDate = isCompleted
      ? matchingAgentSteps.find((s: TimelineStep) => s.completed_date)?.completed_date
      : null;

    // Determine status
    let status = 'upcoming';
    if (isCompleted) {
      status = 'completed';
    }

    return {
      ...buyerStep,
      status,
      date: completedDate ? format(new Date(completedDate), 'MMM dd, yyyy') : (isCompleted ? 'Completed' : 'Upcoming'),
      is_completed: isCompleted
    };
  });

  // Find first incomplete step for "in_progress" status
  const firstIncompleteIndex = steps.findIndex(s => s.status === 'upcoming');
  if (firstIncompleteIndex !== -1) {
    steps[firstIncompleteIndex].status = 'in_progress';
    steps[firstIncompleteIndex].date = 'In Progress';
  }

  // Calculate progress: count completed steps
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const currentStep = completedCount + 1; // Next step after completed ones
  const progressPercentage = (completedCount / steps.length) * 100;

  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return (
          <div className="w-3 h-3 bg-primary rounded-full flex items-center justify-center border-2 border-white relative z-10">
            <CheckCircle size={8} className="text-white" />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-3 h-3 bg-accent rounded-full flex items-center justify-center border-2 border-white relative z-10">
            <div className="w-1 h-1 bg-white rounded-full"></div>
          </div>
        );
      default:
        return (
          <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center border-2 border-muted relative z-10">
            <span className="text-[8px] font-medium text-muted-foreground">{index + 1}</span>
          </div>
        );
    }
  };

  if (!showDetailed) {
    return (
      <div className="card-modern">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between text-foreground">
            Your Progress
            <Badge className="bg-primary text-primary-foreground border-0 shadow-sm">
              {currentStep} of {steps.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium text-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress
              value={progressPercentage}
              className="w-full h-2 bg-muted rounded-full overflow-hidden"
            />
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock size={16} className="mr-2" />
              Currently: {steps.find(s => s.status === 'in_progress')?.title || 'Completed'}
            </div>
          </div>
        </CardContent>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Progress Line */}
      <div className="card-modern">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-300"
            >
              <span className="text-sm">Details</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </Button>
          </div>

          {/* Single Line Progress */}
          <div className="relative px-2">
            {/* Background Line */}
            <div className="absolute top-[6px] left-4 right-4 h-0.5 bg-muted rounded-full"></div>

            {/* Progress Line */}
            <div
              className="absolute top-[6px] left-4 h-0.5 bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ width: `calc(${progressPercentage}% * 0.9)` }}
            ></div>

            {/* Progress Steps - Single Line */}
            <div className="flex justify-between items-start">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  {getStepIcon(step.status, index)}
                  <span className={`text-[10px] mt-1 font-medium text-center max-w-[40px] leading-tight ${
                    step.status === 'completed' ? 'text-primary' :
                    step.status === 'in_progress' ? 'text-accent' :
                    'text-muted-foreground'
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
                <div className="text-lg font-bold text-foreground">{currentStep}</div>
                <div className="text-muted-foreground text-xs">Current</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{Math.round(progressPercentage)}%</div>
                <div className="text-muted-foreground text-xs">Complete</div>
              </div>
              <div className="w-px h-8 bg-border"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-foreground">{steps.length - currentStep + 1}</div>
                <div className="text-muted-foreground text-xs">Remaining</div>
              </div>
            </div>
          </div>
        </CardContent>
      </div>

      {/* Expandable Details */}
      {isExpanded && (
        <div className="space-y-3 animate-fade-in mt-6">
          {/* Detailed Timeline */}
          {steps.map((step, index) => (
            <div key={step.id} className="card-modern p-4 transition-all duration-200 hover:shadow-floating">
              <div className="flex items-start gap-4">
                {/* Step Icon */}
                <div className="mt-1">
                  {getStepIcon(step.status, index)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className={`font-semibold text-foreground mb-1 ${
                        step.status === 'completed' ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {step.description}
                      </p>

                      {/* Status and Date */}
                      <div className="flex items-center gap-3">
                        {step.status === 'in_progress' && (
                          <Badge variant="outline" className="text-xs bg-accent/10 text-accent border-accent/20">
                            IN PROGRESS
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Clock size={12} className="mr-1" />
                          {step.date}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgressTrackerLive;
