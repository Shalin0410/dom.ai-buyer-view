
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
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-8">
        <div className="relative flex-1">
          <Search size={24} className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search in properties" 
            className="pl-16 h-16 text-lg placeholder:text-gray-400 border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-xl"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-4 h-16 px-8 text-lg border-gray-200 hover:bg-gray-50 rounded-xl min-w-[160px] ${activeFiltersCount > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}
        >
          <Filter size={20} />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <Badge className="bg-blue-500 text-white text-sm px-3 py-1.5 ml-2">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </div>

      {showFilters && (
        <Card className="border border-gray-200 bg-white shadow-xl rounded-2xl">
          <CardContent className="p-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-semibold text-gray-900">Filter Properties</h3>
              <Button variant="ghost" size="lg" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-6 py-3">
                Save view
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-6 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <span className="font-semibold text-gray-900 text-lg">Stage in Buying Process</span>
                  <ChevronDown size={20} className="text-gray-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-5 mt-6 pl-4">
                  {stages.map((stage) => (
                    <div key={stage.id} className="flex items-center space-x-4">
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
                        className="h-5 w-5"
                      />
                      <label htmlFor={stage.id} className="text-base cursor-pointer text-gray-700 hover:text-gray-900 font-medium">
                        {stage.label}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-6 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <span className="font-semibold text-gray-900 text-lg">Upcoming Action Required</span>
                  <ChevronDown size={20} className="text-gray-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-5 mt-6 pl-4">
                  {actions.map((action) => (
                    <div key={action.id} className="flex items-center space-x-4">
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
                        className="h-5 w-5"
                      />
                      <label htmlFor={action.id} className="text-base cursor-pointer text-gray-700 hover:text-gray-900 font-medium">
                        {action.label}
                      </label>
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible>
                <CollapsibleTrigger className="flex items-center justify-between w-full p-6 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100">
                  <span className="font-semibold text-gray-900 text-lg">Last Activity Date</span>
                  <ChevronDown size={20} className="text-gray-500" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-5 mt-6 pl-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
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
                        className="h-5 w-5"
                      />
                      <label htmlFor={activity.id} className="text-base cursor-pointer text-gray-700 hover:text-gray-900 font-medium">
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
