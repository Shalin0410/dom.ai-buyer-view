
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ProgressTracker = ({ showDetailed = false }) => {
  const steps = [
    {
      id: 1,
      title: "Pre-qualification",
      description: "Get pre-approved for a mortgage",
      status: "completed",
      date: "2024-01-15"
    },
    {
      id: 2,
      title: "Define Preferences",
      description: "Set your must-haves and nice-to-haves",
      status: "completed",
      date: "2024-01-18"
    },
    {
      id: 3,
      title: "Property Search",
      description: "Find and view potential homes",
      status: "in_progress",
      date: "In Progress"
    },
    {
      id: 4,
      title: "Make Offer",
      description: "Submit competitive offers",
      status: "upcoming",
      date: "Upcoming"
    },
    {
      id: 5,
      title: "Closing",
      description: "Finalize the purchase",
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
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white">
            <CheckCircle size={20} />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white">
            <CheckCircle size={20} />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
            <span className="text-sm font-medium">{index + 1}</span>
          </div>
        );
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Finished';
      case 'in_progress':
        return 'In Progress';
      default:
        return 'Waiting';
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
    <div className="space-y-6">
      {/* Progress Overview - Visual Design */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-0">
        <CardContent className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Steps Progress Indicator</h2>
          
          {/* Progress Line with Steps */}
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-gray-300"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute top-4 left-4 h-0.5 bg-blue-500 transition-all duration-500"
              style={{ width: `calc(${progressPercentage}% - 16px)` }}
            ></div>
            
            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  {getStepIcon(step.status, index)}
                  <div className="mt-4 text-center max-w-[120px]">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      {getStatusText(step.status)}
                    </p>
                    <p className="text-xs text-gray-600 leading-tight">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-orange-50 border-orange-200">
        <CardContent className="p-4">
          <h4 className="font-semibold text-orange-800 mb-2">Up Next</h4>
          <p className="text-sm text-orange-700 mb-3">
            You have 2 property viewings scheduled for this weekend. Make sure to prepare your questions!
          </p>
          <div className="text-xs text-orange-600">
            💡 Tip: Bring a notebook and take photos to help remember each property
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;
