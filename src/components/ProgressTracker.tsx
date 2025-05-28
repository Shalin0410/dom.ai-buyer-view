
import { CheckCircle, Circle, Clock, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ProgressTracker = ({ showDetailed = false }) => {
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
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white relative z-10">
            <CheckCircle size={24} />
          </div>
        );
      case 'in_progress':
        return (
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white relative z-10">
            <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
          </div>
        );
      default:
        return (
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 shadow-lg border-4 border-white relative z-10">
            <span className="text-sm font-semibold">{index + 1}</span>
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
    <div className="space-y-6">
      {/* Main Progress Timeline */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Home Buying Progress
            </h2>
            <p className="text-gray-600">Your journey to homeownership</p>
          </div>
          
          {/* Horizontal Timeline */}
          <div className="relative">
            {/* Background Line */}
            <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full"></div>
            
            {/* Progress Line */}
            <div 
              className="absolute top-6 left-6 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-blue-400 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `calc(${progressPercentage}% * 0.92)` }}
            ></div>
            
            {/* Steps Grid */}
            <div className="grid grid-cols-5 gap-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center">
                  {/* Icon */}
                  <div className="mb-4">
                    {getStepIcon(step.status, index)}
                  </div>
                  
                  {/* Content */}
                  <div className="text-center">
                    <h4 className={`text-xs font-semibold mb-1 ${
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
                      <Badge className="mt-2 bg-blue-50 text-blue-700 text-xs px-2 py-1">
                        Current
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Progress Stats */}
          <div className="flex justify-center mt-8">
            <div className="bg-gray-50 rounded-xl px-8 py-4">
              <div className="flex items-center space-x-8 text-sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{currentStep}</div>
                  <div className="text-gray-600">Current Step</div>
                </div>
                <div className="w-px h-10 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</div>
                  <div className="text-gray-600">Complete</div>
                </div>
                <div className="w-px h-10 bg-gray-300"></div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{steps.length - currentStep}</div>
                  <div className="text-gray-600">Remaining</div>
                </div>
              </div>
            </div>
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
  );
};

export default ProgressTracker;
