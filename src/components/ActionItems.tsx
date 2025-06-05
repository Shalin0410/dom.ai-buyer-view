
import { useState } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Circle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

const ActionItems = () => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const actionItems = [
    {
      id: 'inspection-schedule',
      title: 'Schedule Home Inspection',
      description: '123 Maple Street',
      type: 'inspection',
      priority: 'high',
      dueDate: '2024-03-15',
      status: 'Inspection Ready'
    },
    {
      id: 'contingency-deadline',
      title: 'Remove Loan Contingency',
      description: '456 Oak Avenue',
      type: 'contingency',
      priority: 'high',
      dueDate: '2024-03-18',
      status: 'Documents Available'
    },
    {
      id: 'offer-deadline',
      title: 'Respond to Counter Offer',
      description: '789 Pine Road',
      type: 'offer',
      priority: 'urgent',
      dueDate: '2024-03-12',
      status: 'Counter Offer Ready'
    },
    {
      id: 'appraisal-schedule',
      title: 'Schedule Appraisal',
      description: '123 Maple Street',
      type: 'appraisal',
      priority: 'medium',
      dueDate: '2024-03-20',
      status: 'Appraisal Available'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'HIGH PRIORITY';
      case 'high':
        return 'HIGH PRIORITY';
      case 'medium':
        return 'MEDIUM PRIORITY';
      default:
        return 'LOW PRIORITY';
    }
  };

  const handleCheckChange = (itemId: string, checked: boolean) => {
    if (checked) {
      setCheckedItems([...checkedItems, itemId]);
    } else {
      setCheckedItems(checkedItems.filter(id => id !== itemId));
    }
  };

  const pendingItems = actionItems.filter(item => !checkedItems.includes(item.id));
  const completedItems = actionItems.filter(item => checkedItems.includes(item.id));

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            To Do
          </CardTitle>
          <Badge variant="secondary" className="text-sm bg-gray-100 text-gray-600">
            {pendingItems.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Pending Items */}
        {pendingItems.map((item, index) => (
          <div
            key={item.id}
            className="bg-gray-50 rounded-lg p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <Checkbox
                  id={item.id}
                  checked={checkedItems.includes(item.id)}
                  onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-500">
                      INT-{index + 1}
                    </span>
                    <Badge className={getPriorityColor(item.priority)} variant="default">
                      {getPriorityText(item.priority)}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-gray-900">{item.title}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Circle size={12} className="text-blue-500" />
                    <span>{item.status}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar size={12} />
                    <span>{new Date(item.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric',
                      minute: '2-digit'
                    })}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" variant="ghost" className="p-2">
                  <AlertTriangle size={16} className="text-yellow-500" />
                </Button>
                <Button size="sm" variant="ghost" className="p-2">
                  <Circle size={16} className="text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-gray-200">
            {completedItems.map((item, index) => (
              <div key={item.id} className="bg-green-50 rounded-lg p-4 opacity-60">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id={item.id}
                    checked={true}
                    onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 line-through">
                        INT-{index + 1}
                      </span>
                      <Badge className="bg-green-500 text-white" variant="default">
                        COMPLETED
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-gray-900 line-through">{item.title}</h4>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add new task button */}
        <Button variant="ghost" className="w-full mt-4 text-teal-600 hover:text-teal-700 hover:bg-teal-50">
          <Plus size={16} className="mr-2" />
          Add a new task
        </Button>

        {pendingItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium text-gray-900">All caught up!</p>
            <p className="text-sm">No pending action items at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionItems;
