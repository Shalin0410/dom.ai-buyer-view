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
  const { timeline, summary, isLoading, error, toggleStepCompletion } = useTimelineOperations(personId);

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

  const steps = timeline.steps || [];
  const currentStepIndex = steps.findIndex((step: TimelineStep) => !step.is_completed);
  const progressPercentage = summary.progress_percentage;

  const getStepStatus = (step: TimelineStep) => {
    if (step.is_completed) return 'completed';
    if (currentStepIndex >= 0 && step.id === steps[currentStepIndex].id) return 'in_progress';
    return 'upcoming';
  };

  const getStepIcon = (step: TimelineStep, index: number) => {
    const status = getStepStatus(step);

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const currentStep = summary.next_step;

  if (!showDetailed) {
    return (
      <div className="border border-gray-200 shadow-lg bg-white/80 backdrop-blur-sm rounded-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between text-gray-900">
            Your Progress
            <Badge className="bg-blue-500 text-white border-0 shadow-sm">
              {summary.completed_steps} of {summary.total_steps}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium text-gray-900">{progressPercentage}%</span>
            </div>
            <Progress
              value={progressPercentage}
              className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
            />
            {currentStep && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock size={16} className="mr-2 text-blue-500" />
                Currently: {currentStep.template_name || currentStep.custom_step_name}
              </div>
            )}
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
              Phase: {summary.current_phase_name}
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
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {timeline.timeline_name || 'Home Buying Progress'}
              </h2>
              <p className="text-sm text-gray-600">{summary.current_phase_name}</p>
            </div>
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
              {steps.slice(0, 10).map((step: TimelineStep, index: number) => (
                <div key={step.id} className="flex flex-col items-center">
                  {getStepIcon(step, index)}
                  <span className={`text-[10px] mt-1 font-medium text-center max-w-[40px] leading-tight ${
                    step.is_completed ? 'text-green-600' :
                    getStepStatus(step) === 'in_progress' ? 'text-blue-600' :
                    'text-gray-500'
                  }`}>
                    {(step.template_name || step.custom_step_name || '').slice(0, 15)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compact Stats */}
          <div className="flex justify-center mt-6">
            <div className="flex items-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{currentStepIndex + 1}</div>
                <div className="text-gray-600 text-xs">Current</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">{progressPercentage}%</div>
                <div className="text-gray-600 text-xs">Complete</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {summary.total_steps - summary.completed_steps}
                </div>
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
                {steps.map((step: TimelineStep, index: number) => {
                  const status = getStepStatus(step);
                  return (
                    <div
                      key={step.id}
                      className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-all duration-300 group"
                    >
                      {getStepIcon(step, index)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className={`font-medium ${
                            step.is_completed ? 'text-green-600' :
                            status === 'in_progress' ? 'text-blue-600' :
                            'text-gray-900'
                          }`}>
                            {step.template_name || step.custom_step_name}
                          </h4>
                          <span className="text-sm text-gray-600">
                            {step.is_completed ? formatDate(step.completed_date) : formatDate(step.due_date)}
                          </span>
                        </div>
                        {step.template_description && (
                          <p className="text-sm text-gray-600 mt-1">{step.template_description}</p>
                        )}
                        {step.notes && (
                          <p className="text-sm text-gray-500 mt-2 italic">Note: {step.notes}</p>
                        )}
                        {status === 'in_progress' && (
                          <Badge className="mt-3 bg-blue-500 text-white text-xs border-0 shadow-sm">
                            Current Step
                          </Badge>
                        )}
                        {step.is_completed && step.completion_notes && (
                          <p className="text-sm text-green-600 mt-2">✓ {step.completion_notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </div>

          {/* Up Next Card */}
          {currentStep && (
            <div className="border border-gray-200 shadow-lg bg-white/90 backdrop-blur-sm rounded-lg">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                    <Clock size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-3">Up Next</h4>
                    <p className="text-gray-700 mb-4 leading-relaxed">
                      You're currently working on: <strong>{currentStep.template_name || currentStep.custom_step_name}</strong>
                    </p>
                    {currentStep.template_description && (
                      <p className="text-gray-600 text-sm mb-4">{currentStep.template_description}</p>
                    )}
                    {currentStep.due_date && (
                      <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">📅</span>
                          <div>
                            <span className="font-medium text-gray-900 text-sm">Due Date: </span>
                            <span className="text-gray-700 text-sm">
                              {formatDate(currentStep.due_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </div>
          )}

          {/* Recent Completions */}
          {summary.recent_completions.length > 0 && (
            <div className="border border-gray-200 shadow-lg bg-white/90 backdrop-blur-sm rounded-lg">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Recently Completed</h4>
                <div className="space-y-3">
                  {summary.recent_completions.map((step: TimelineStep) => (
                    <div key={step.id} className="flex items-center space-x-3 text-sm">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      <span className="text-gray-700 flex-1">
                        {step.template_name || step.custom_step_name}
                      </span>
                      <span className="text-gray-500">{formatDate(step.completed_date)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProgressTrackerLive;
