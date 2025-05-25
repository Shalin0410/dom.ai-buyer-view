
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

  const getStepIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'in_progress':
        return <Clock className="text-blue-600" size={20} />;
      default:
        return <Circle className="text-gray-400" size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Upcoming</Badge>;
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
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-600 to-teal-600 text-white border-0">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">Your Home Buying Journey</h2>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Progress value={progressPercentage} className="bg-blue-400" />
            </div>
            <span className="text-lg font-bold">{Math.round(progressPercentage)}%</span>
          </div>
          <p className="text-blue-100 mt-2">
            Step {currentStep} of {steps.length} • Keep up the great work!
          </p>
        </CardContent>
      </Card>

      {/* Detailed Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Steps to Your New Home</h3>
        {steps.map((step, index) => (
          <Card key={step.id} className={`${
            step.status === 'in_progress' ? 'border-blue-300 bg-blue-50' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <div className="mt-1">
                  {getStepIcon(step.status)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold text-gray-900">{step.title}</h4>
                    {getStatusBadge(step.status)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                  <p className="text-xs text-gray-500">{step.date}</p>
                </div>
                {index < steps.length - 1 && step.status === 'completed' && (
                  <ArrowRight className="text-gray-400 mt-1" size={16} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
