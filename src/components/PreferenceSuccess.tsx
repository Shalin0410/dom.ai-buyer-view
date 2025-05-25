
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface PreferenceSuccessProps {
  onComplete: () => void;
}

const PreferenceSuccess = ({ onComplete }: PreferenceSuccessProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6">
        <Card className="shadow-xl border-0 backdrop-blur-sm bg-white/90">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <CheckCircle size={64} className="text-green-600" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-gray-900">
                Profile Created!
              </h2>
              <p className="text-gray-600 leading-relaxed">
                We've created your profile. You can access it at any time and make changes. 
                But let's start finding your dream home!
              </p>
            </div>

            <div className="pt-4">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">
                Loading your personalized matches...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PreferenceSuccess;
