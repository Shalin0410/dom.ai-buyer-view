
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ContinueSearchCard = () => {
  return (
    <Card className="border-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Continue Your Search</h3>
            <p className="text-blue-100">8 new matches found based on your preferences</p>
          </div>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-medium">
            <Plus size={16} className="mr-2" />
            View Matches
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContinueSearchCard;
