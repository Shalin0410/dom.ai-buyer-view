import { useState } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

const ActionItems = () => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);

  const actionItems = [
    {
      id: 'inspection-schedule',
      title: 'Schedule Home Inspection',
      description: '123 Maple Street - Due by March 15, 2024',
      type: 'inspection',
      priority: 'high',
      dueDate: '2024-03-15',
      daysLeft: 3,
      property: '123 Maple Street'
    },
    {
      id: 'contingency-deadline',
      title: 'Remove Loan Contingency',
      description: '456 Oak Avenue - Due by March 18, 2024',
      type: 'contingency',
      priority: 'high',
      dueDate: '2024-03-18',
      daysLeft: 6,
      property: '456 Oak Avenue'
    },
    {
      id: 'offer-deadline',
      title: 'Respond to Counter Offer',
      description: '789 Pine Road - Due by March 12, 2024',
      type: 'offer',
      priority: 'urgent',
      dueDate: '2024-03-12',
      daysLeft: 1,
      property: '789 Pine Road'
    },
    {
      id: 'appraisal-schedule',
      title: 'Schedule Appraisal',
      description: '123 Maple Street - Due by March 20, 2024',
      type: 'appraisal',
      priority: 'medium',
      dueDate: '2024-03-20',
      daysLeft: 8,
      property: '123 Maple Street'
    },
    {
      id: 'disclosure-review',
      title: 'Review Property Disclosures',
      description: '456 Oak Avenue - Due by March 14, 2024',
      type: 'disclosure',
      priority: 'medium',
      dueDate: '2024-03-14',
      daysLeft: 2,
      property: '456 Oak Avenue'
    },
    {
      id: 'walkthrough-schedule',
      title: 'Schedule Final Walkthrough',
      description: '789 Pine Road - Due by March 25, 2024',
      type: 'walkthrough',
      priority: 'low',
      dueDate: '2024-03-25',
      daysLeft: 13,
      property: '789 Pine Road'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-[#2E2E2E] border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <AlertTriangle size={16} className="text-orange-600" />;
      case 'contingency':
        return <Clock size={16} className="text-blue-600" />;
      case 'offer':
        return <Calendar size={16} className="text-purple-600" />;
      case 'appraisal':
        return <CheckCircle2 size={16} className="text-green-600" />;
      case 'disclosure':
        return <Circle size={16} className="text-gray-600" />;
      case 'walkthrough':
        return <Calendar size={16} className="text-teal-600" />;
      default:
        return <Circle size={16} className="text-gray-600" />;
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
    <div className="space-y-6">
      <Card className="glass-card shadow-modern">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-[#2E2E2E]">
            <span>Action Items</span>
            <Badge variant="outline" className="text-sm border-brand-coral text-brand-coral">
              {pendingItems.length} pending
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Pending Items */}
          {pendingItems.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-[#2E2E2E]">Pending Tasks</h4>
              {pendingItems
                .sort((a, b) => {
                  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
                  return priorityOrder[a.priority] - priorityOrder[b.priority];
                })
                .map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      item.priority === 'urgent' ? 'border-red-200 bg-red-50' :
                      item.priority === 'high' ? 'border-orange-200 bg-orange-50' :
                      'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id={item.id}
                        checked={checkedItems.includes(item.id)}
                        onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getTypeIcon(item.type)}
                            <h5 className="font-medium text-[#2E2E2E]">{item.title}</h5>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(item.priority)} variant="outline">
                              {item.priority}
                            </Badge>
                            <Badge variant="secondary" className="text-xs bg-brand-gray text-[#2E2E2E]">
                              {item.daysLeft} days left
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-[#2E2E2E]/70 mt-1">{item.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-[#2E2E2E]/60">
                          <div className="flex items-center space-x-1">
                            <Calendar size={12} />
                            <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>
                          </div>
                          <span>•</span>
                          <span>{item.property}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Completed Items */}
          {completedItems.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-[#2E2E2E] flex items-center space-x-2">
                <CheckCircle2 size={16} className="text-green-600" />
                <span>Completed ({completedItems.length})</span>
              </h4>
              {completedItems.map((item) => (
                <div key={item.id} className="p-4 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id={item.id}
                      checked={true}
                      onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(item.type)}
                        <h5 className="font-medium text-[#2E2E2E] line-through">{item.title}</h5>
                        <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
                          completed
                        </Badge>
                      </div>
                      <p className="text-sm text-[#2E2E2E]/70 mt-1 line-through">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pendingItems.length === 0 && (
            <div className="text-center py-8 text-[#2E2E2E]/60">
              <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
              <p className="text-lg font-medium text-[#2E2E2E]">All caught up!</p>
              <p className="text-sm">No pending action items at the moment.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionItems;
