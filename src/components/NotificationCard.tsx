
import { Bell, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface NotificationCardProps {
  onNavigateToSearch: () => void;
}

const NotificationCard = ({ onNavigateToSearch }: NotificationCardProps) => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  New Recommendation
                </h3>
                <p className="text-sm text-gray-700">
                  Kelsey found a place she thinks you'll love!
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={onNavigateToSearch}
                className="ml-4 bg-blue-600 hover:bg-blue-700"
              >
                View
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationCard;
