
import { useState } from 'react';
import { Filter, Search, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SearchAndFiltersProps {
  selectedStages: string[];
  selectedActions: string[];
  selectedActivities: string[];
  onStagesChange: (stages: string[]) => void;
  onActionsChange: (actions: string[]) => void;
  onActivitiesChange: (activities: string[]) => void;
}

const SearchAndFilters = ({
  selectedStages,
  selectedActions,
  selectedActivities,
  onStagesChange,
  onActionsChange,
  onActivitiesChange
}: SearchAndFiltersProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const stages = [
    { id: 'tour_scheduled', label: 'Tour' },
    { id: 'disclosure_review', label: 'Disclosure Review' },
    { id: 'offer_submitted', label: 'Offer Submitted' },
    { id: 'negotiating', label: 'Negotiation' },
    { id: 'escrow', label: 'Escrow' },
    { id: 'inspection', label: 'Inspection' },
    { id: 'appraisal', label: 'Appraisal' },
    { id: 'contingencies', label: 'Contingencies Removed' },
    { id: 'walkthrough', label: 'Walkthrough' },
    { id: 'closing', label: 'Closing' }
  ];

  const actions = [
    { id: 'tour_scheduled', label: 'Needs Tour Scheduled' },
    { id: 'disclosure_review', label: 'Awaiting Disclosure Review' },
    { id: 'offer_deadline', label: 'Offer Deadline Approaching' },
    { id: 'inspection_needed', label: 'Inspection Needed' },
    { id: 'appraisal_pending', label: 'Appraisal Pending' }
  ];

  const activities = [
    { id: 'recently_updated', label: 'Recently Updated' },
    { id: 'last_contacted', label: 'Last Contacted' },
    { id: 'needs_follow_up', label: 'Needs Follow Up' }
  ];

  const activeFiltersCount = selectedStages.length + selectedActions.length + selectedActivities.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search in properties" 
            className="pl-10 h-12 placeholder:text-gray-400"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center space-x-2 h-12 flex-shrink-0 ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200' : ''}`}
        >
          <Filter size={16} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge className="bg-blue-500 text-white text-xs px-2 py-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
              <Button variant="ghost" size="sm" className="text-blue-600">
                Save view
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded">
                  <span className="font-medium">Stage in Buying Process</span>
                  <ChevronDown size={16} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  {stages.map((stage) => (
                    <div key={stage.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={stage.id}
                        checked={selectedStages.includes(stage.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onStagesChange([...selectedStages, stage.id]);
                          } else {
                            onStagesChange(selectedStages.filter(s => s !== stage.id));
                          }
                        }}
                      />
                      <label htmlFor={stage.id} className="text-sm cursor-pointer">
                        {stage.label}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded">
                  <span className="font-medium">Upcoming Action Required</span>
                  <ChevronDown size={16} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={action.id}
                        checked={selectedActions.includes(action.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onActionsChange([...selectedActions, action.id]);
                          } else {
                            onActionsChange(selectedActions.filter(a => a !== action.id));
                          }
                        }}
                      />
                      <label htmlFor={action.id} className="text-sm cursor-pointer">
                        {action.label}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-3 hover:bg-gray-50 rounded">
                  <span className="font-medium">Last Activity Date</span>
                  <ChevronDown size={16} />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 mt-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={activity.id}
                        checked={selectedActivities.includes(activity.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            onActivitiesChange([...selectedActivities, activity.id]);
                          } else {
                            onActivitiesChange(selectedActivities.filter(a => a !== activity.id));
                          }
                        }}
                      />
                      <label htmlFor={activity.id} className="text-sm cursor-pointer">
                        {activity.label}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SearchAndFilters;
