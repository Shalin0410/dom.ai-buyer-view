
import { useState } from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle2, Circle, Plus, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useActionItems } from '@/hooks/useActionItems';
import { useBuyer } from '@/hooks/useBuyer';
import { useAuth } from '@/contexts/AuthContext';
import AddTaskDialog from './AddTaskDialog';
import { dataService } from '@/services';

const ActionItems = () => {
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [updatingItems, setUpdatingItems] = useState<string[]>([]);
  const { user } = useAuth();
  const { data: buyer } = useBuyer(user?.email || '');
  const { actionItems, loading, error, refreshActionItems } = useActionItems(buyer?.id);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'Urgent';
      case 'high':
        return 'High';
      case 'medium':
        return 'Medium';
      default:
        return 'Low';
    }
  };

  const handleCheckChange = async (itemId: string, checked: boolean) => {
    // Optimistically update UI
    if (checked) {
      setCheckedItems([...checkedItems, itemId]);
    } else {
      setCheckedItems(checkedItems.filter(id => id !== itemId));
    }

    // Update in database
    setUpdatingItems([...updatingItems, itemId]);
    try {
      const response = await dataService.updateActionItem(itemId, {
        is_completed: checked,
        completed_date: checked ? new Date().toISOString().split('T')[0] : '',
        status: checked ? 'completed' : 'pending'
      });

      if (response.success) {
        // Refresh the action items to get the latest data
        refreshActionItems();
      } else {
        // Revert optimistic update if failed
        if (checked) {
          setCheckedItems(checkedItems.filter(id => id !== itemId));
        } else {
          setCheckedItems([...checkedItems, itemId]);
        }
        console.error('Error updating action item:', response.error);
      }
    } catch (error) {
      // Revert optimistic update if failed
      if (checked) {
        setCheckedItems(checkedItems.filter(id => id !== itemId));
      } else {
        setCheckedItems([...checkedItems, itemId]);
      }
      console.error('Error updating action item:', error);
    } finally {
      setUpdatingItems(updatingItems.filter(id => id !== itemId));
    }
  };

  if (loading) {
    return (
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Loading action items...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-0 bg-white shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingItems = actionItems.filter(item => !checkedItems.includes(item.id));
  const completedItems = actionItems.filter(item => checkedItems.includes(item.id));

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Action Items
          </CardTitle>
          <Badge variant="secondary" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
            {pendingItems.length} pending
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Pending Items */}
        {pendingItems.map((item, index) => (
          <div
            key={item.id}
            className="border border-gray-100 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex items-start gap-3">
              <Checkbox
                id={item.id}
                checked={checkedItems.includes(item.id)}
                onCheckedChange={(checked) => handleCheckChange(item.id, checked as boolean)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    #{index + 1}
                  </span>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-0.5 ${getPriorityColor(item.priority)}`}
                  >
                    {getPriorityText(item.priority)}
                  </Badge>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-1 leading-tight">
                  {item.title}
                </h4>
                
                <p className="text-sm text-gray-600 mb-3">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Circle size={8} className="text-green-500 fill-current" />
                    <span className="capitalize">{item.status.replace('_', ' ')}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar size={12} />
                    <span>
                      {new Date(item.due_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <>
            <div className="border-t pt-4 mt-6">
              <h5 className="text-sm font-medium text-gray-500 mb-3">Completed</h5>
              <div className="space-y-3">
                {completedItems.map((item, index) => (
                  <div key={item.id} className="border border-green-100 bg-green-50/50 rounded-lg p-4 opacity-75">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        <div className="w-4 h-4 bg-green-500 rounded-sm flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-700 mb-1 leading-tight line-through">
                          {item.title}
                        </h4>
                        <p className="text-sm text-gray-500 line-through">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Add new task button */}
        <div className="pt-6 border-t border-gray-100">
          <AddTaskDialog onTaskAdded={refreshActionItems} />
        </div>

        {pendingItems.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
            <p className="text-sm text-gray-500">No pending action items at the moment.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActionItems;
