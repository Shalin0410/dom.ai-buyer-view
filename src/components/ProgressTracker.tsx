
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
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <CheckCircle size={20} />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg">
            <CheckCircle size={20} />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-500 shadow-sm">
            <span className="text-sm font-semibold">{index + 1}</span>
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-700';
      case 'in_progress':
        return 'text-blue-700';
      default:
        return 'text-gray-600';
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
      {/* Progress Overview - Enhanced Visual Design */}
      <Card className="bg-gradient-to-br from-blue-50 via-white to-purple-50 border-0 shadow-xl">
        <CardContent className="p-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Steps Progress Indicator
            </h2>
            <p className="text-gray-600 text-lg">Track your home buying journey</p>
          </div>
          
          {/* Progress Line with Steps */}
          <div className="relative max-w-4xl mx-auto">
            {/* Background Line */}
            <div className="absolute top-5 left-5 right-5 h-1 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute top-5 left-5 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `calc(${progressPercentage}% - 20px)` }}
            ></div>
            
            {/* Steps */}
            <div className="relative flex justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center group">
                  <div className="transition-transform duration-200 group-hover:scale-110">
                    {getStepIcon(step.status, index)}
                  </div>
                  <div className="mt-6 text-center max-w-[140px]">
                    <p className={`text-base font-bold mb-2 ${getStatusColor(step.status)}`}>
                      {getStatusText(step.status)}
                    </p>
                    <p className="text-sm font-medium text-gray-900 mb-1 leading-tight">
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-600 leading-relaxed">
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
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-orange-800 mb-2 text-lg">Up Next</h4>
              <p className="text-orange-700 mb-4 leading-relaxed">
                You have 2 property viewings scheduled for this weekend. Make sure to prepare your questions and bring the necessary documents!
              </p>
              <div className="bg-orange-100 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center space-x-2 text-orange-700">
                  <span className="text-lg">💡</span>
                  <span className="font-medium text-sm">Pro Tip:</span>
                </div>
                <p className="text-xs text-orange-600 mt-1 ml-6">
                  Bring a notebook and take photos to help remember each property. Don't forget to check the neighborhood during different times of day!
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;
