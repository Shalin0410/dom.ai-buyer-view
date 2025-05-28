
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
          <div className="relative">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-sm border-4 border-white">
              <CheckCircle size={20} />
            </div>
          </div>
        );
      case 'in_progress':
        return (
          <div className="relative">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-sm border-4 border-white animate-pulse">
              <div className="w-3 h-3 bg-white rounded-full"></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="relative">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shadow-sm border-4 border-white">
              <span className="text-sm font-semibold">{index + 1}</span>
            </div>
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
    <div className="space-y-8">
      {/* Main Progress Timeline */}
      <Card className="bg-white border border-gray-100 shadow-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Home Buying Progress
            </h2>
            <p className="text-gray-600">Track your journey to homeownership</p>
          </div>
          
          {/* Progress Timeline */}
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute top-6 left-6 h-0.5 bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-1000 ease-out"
              style={{ width: `calc(${progressPercentage}% * 0.8)` }}
            ></div>
            
            {/* Steps */}
            <div className="relative flex justify-between items-start">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  {/* Icon */}
                  <div className="mb-4">
                    {getStepIcon(step.status, index)}
                  </div>
                  
                  {/* Content */}
                  <div className="text-center max-w-[120px]">
                    <h4 className={`text-sm font-semibold mb-1 ${
                      step.status === 'completed' ? 'text-green-700' :
                      step.status === 'in_progress' ? 'text-blue-700' : 
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {step.description}
                    </p>
                    {step.status === 'in_progress' && (
                      <Badge className="mt-2 bg-blue-50 text-blue-700 text-xs">
                        Current Step
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Progress Stats */}
          <div className="flex justify-center mt-8">
            <div className="bg-gray-50 rounded-lg px-6 py-3">
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{currentStep}</div>
                  <div className="text-gray-600">Current Step</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{Math.round(progressPercentage)}%</div>
                  <div className="text-gray-600">Complete</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">{steps.length - currentStep}</div>
                  <div className="text-gray-600">Remaining</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">What's Next?</h4>
              <p className="text-blue-800 mb-3">
                You have 2 property viewings scheduled for this weekend. Make sure to prepare your questions and bring the necessary documents.
              </p>
              <div className="bg-blue-100 rounded-lg p-3 border border-blue-200">
                <div className="flex items-start space-x-2">
                  <span className="text-lg">💡</span>
                  <div>
                    <span className="font-medium text-blue-900 text-sm">Pro Tip: </span>
                    <span className="text-blue-800 text-sm">
                      Take notes and photos during viewings to help you compare properties later.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;
