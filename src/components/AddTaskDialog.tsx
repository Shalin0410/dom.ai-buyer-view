import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dataService } from '@/services';
import { useAuth } from '@/contexts/AuthContext';
import { useBuyer } from '@/hooks/useBuyer';
import { useProperties } from '@/hooks/useProperties';

interface AddTaskDialogProps {
  onTaskAdded?: () => void;
}

const AddTaskDialog = ({ onTaskAdded }: AddTaskDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    property_id: 'none',
    due_date: undefined as Date | undefined
  });

  const { user } = useAuth();
  const { data: buyer } = useBuyer(user?.email || '');
  const { properties, loading: propertiesLoading, error: propertiesError } = useProperties(buyer?.id);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyer?.id || !formData.title.trim()) return;

    setLoading(true);
    try {
      const actionItem = {
        buyer_id: buyer.id,
        property_id: formData.property_id === 'none' ? '' : formData.property_id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        action_required: 'review_disclosures_reports', // Default action type for custom tasks
        status: 'pending' as const,
        buying_stage: 'initial_research' as const,
        priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
        due_date: formData.due_date ? formData.due_date.toISOString().split('T')[0] : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default to 1 week from now
        property_address: ''
      };

      const response = await dataService.createActionItem(actionItem);
      if (response.success) {
        setFormData({
          title: '',
          description: '',
          priority: 'medium',
          property_id: 'none',
          due_date: undefined
        });
        setOpen(false);
        onTaskAdded?.();
      } else {
        console.error('Error creating task:', response.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-12 rounded-lg border-2 border-dashed border-blue-200 hover:border-blue-300 transition-all duration-200 font-medium"
        >
          <Plus size={18} className="mr-2" />
          Add new task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] bg-white border-0 shadow-xl overflow-hidden flex flex-col">
        <DialogHeader className="space-y-2 pb-4 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">Add New Task</DialogTitle>
          <DialogDescription className="text-gray-600 leading-relaxed text-sm">
            Create a custom action item to track something specific to your home buying journey.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-1">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-gray-700">
              Task Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter task title..."
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-11 text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add more details about this task..."
              rows={3}
              className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 resize-none text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">
                Priority
              </Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                  <SelectValue className="text-gray-900" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200 shadow-lg">
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-semibold text-gray-700">
                Due Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500",
                      !formData.due_date ? "text-gray-500" : "text-gray-900"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-gray-400" />
                    {formData.due_date ? format(formData.due_date, "MMM dd, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-white border-gray-200 shadow-lg" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.due_date}
                    onSelect={(date) => setFormData({ ...formData, due_date: date })}
                    initialFocus
                    className="rounded-md"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="property" className="text-sm font-semibold text-gray-700">
              Related Property
            </Label>
            <Select value={formData.property_id} onValueChange={(value) => setFormData({ ...formData, property_id: value })}>
              <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500 text-gray-900">
                <SelectValue placeholder="Select a property..." className="text-gray-900 placeholder:text-gray-500" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200 shadow-lg">
                <SelectItem value="none">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    No specific property
                  </div>
                </SelectItem>
                {properties?.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="truncate">{property.address}, {property.city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </form>

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 flex-shrink-0 mt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setOpen(false)}
            className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus size={16} />
                Create Task
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;