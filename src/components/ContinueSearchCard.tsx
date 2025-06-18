
import { Plus, Heart } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ContinueSearchCardProps {
  onNavigateToSearch?: () => void;
}

const ContinueSearchCard = ({ onNavigateToSearch }: ContinueSearchCardProps) => {
  return (
    <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Heart className="w-5 h-5 text-pink-200" />
              <h3 className="text-xl font-semibold">New Matches Available</h3>
            </div>
            <p className="text-blue-100 mb-1">Kelsey found a place she thinks you'll love!</p>
            <p className="text-blue-100 text-sm">Plus 7 more matches based on your preferences</p>
          </div>
          <Button 
            size="lg" 
            className="bg-white text-blue-600 hover:bg-blue-50 font-medium"
            onClick={onNavigateToSearch}
          >
            <Plus size={16} className="mr-2" />
            View All
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContinueSearchCard;
