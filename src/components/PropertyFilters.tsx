import React, { useEffect, useState } from 'react';
import { PropertyFilter, PropertyStatus, BuyingStage, ActionRequired } from '@/services/api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Filter } from 'lucide-react';
import { dataService } from '@/services';

interface PropertyFiltersProps {
  filter: Partial<PropertyFilter>;
  onFilterChange: (filter: Partial<PropertyFilter>) => void;
  onClose: () => void;
}

export const PropertyFilters: React.FC<PropertyFiltersProps> = ({
  filter = {},
  onFilterChange,
  onClose
}) => {
  const [filterOptions, setFilterOptions] = useState<{
    statuses: { value: PropertyStatus; label: string }[];
    buyingStages: { value: BuyingStage; label: string }[];
    actionRequired: { value: ActionRequired; label: string }[];
    propertyTypes: { value: string; label: string }[];
  }>({
    statuses: [],
    buyingStages: [],
    actionRequired: [],
    propertyTypes: []
  });

  useEffect(() => {
    // In a real app, you would fetch these from your API
    // This is a placeholder that matches the database schema
    const fetchFilterOptions = async () => {
      // These would normally come from an API endpoint
      const statuses = [
        { value: 'researching' as PropertyStatus, label: 'Researching' },
        { value: 'viewing' as PropertyStatus, label: 'Viewing' },
        { value: 'offer_submitted' as PropertyStatus, label: 'Offer Submitted' },
        { value: 'under_contract' as PropertyStatus, label: 'Under Contract' },
        { value: 'in_escrow' as PropertyStatus, label: 'In Escrow' },
        { value: 'closed' as PropertyStatus, label: 'Closed' },
        { value: 'withdrawn' as PropertyStatus, label: 'Withdrawn' },
      ];

      const buyingStages = [
        { value: 'initial_research' as BuyingStage, label: 'Initial Research' },
        { value: 'active_search' as BuyingStage, label: 'Active Search' },
        { value: 'offer_negotiation' as BuyingStage, label: 'Offer Negotiation' },
        { value: 'under_contract' as BuyingStage, label: 'Under Contract' },
        { value: 'closing' as BuyingStage, label: 'Closing' },
      ];

      const actionRequired = [
        { value: 'schedule_viewing' as ActionRequired, label: 'Schedule Viewing' },
        { value: 'submit_offer' as ActionRequired, label: 'Submit Offer' },
        { value: 'review_disclosures_reports' as ActionRequired, label: 'Review Disclosures & Reports' },
        { value: 'inspection' as ActionRequired, label: 'Inspection' },
        { value: 'appraisal' as ActionRequired, label: 'Appraisal' },
        { value: 'final_walkthrough' as ActionRequired, label: 'Final Walkthrough' },
        { value: 'none' as ActionRequired, label: 'No Action Required' },
      ];

      const propertyTypes = [
        { value: 'single_family', label: 'Single Family' },
        { value: 'condo', label: 'Condo' },
        { value: 'townhouse', label: 'Townhouse' },
        { value: 'multi_family', label: 'Multi Family' },
        { value: 'other', label: 'Other' },
      ];

      setFilterOptions({
        statuses,
        buyingStages,
        actionRequired,
        propertyTypes,
      });
    };

    fetchFilterOptions();
  }, []);

  const toggleArrayFilter = <T extends string>(
    key: keyof PropertyFilter,
    value: T,
    currentArray: T[] | undefined = []
  ) => {
    const safeCurrentArray = Array.isArray(currentArray) ? currentArray : [];
    const newArray = safeCurrentArray.includes(value)
      ? safeCurrentArray.filter(item => item !== value)
      : [...safeCurrentArray, value];
    
    onFilterChange({
      ...filter,
      [key]: newArray.length > 0 ? newArray : undefined
    });
  };

  const updateFilter = (key: keyof PropertyFilter, value: any) => {
    onFilterChange({
      ...filter,
      [key]: value || undefined
    });
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const activeFilterCount = Object.entries(filter).filter(([key, value]) => {
    if (value === undefined || value === null) {
      return false;
    }
    
    // Handle string values
    if (typeof value === 'string') {
      return value !== '';
    }
    
    // Handle number values
    if (typeof value === 'number') {
      return value !== 0;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    
    // For any other type, consider it a valid filter
    return true;
  }).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Status Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Status</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.statuses.map(option => (
              <Badge
                key={option.value}
                variant={filter.status?.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('status', option.value, filter.status)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Buying Stage Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Buying Stage</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.buyingStages.map(option => (
              <Badge
                key={option.value}
                variant={filter.buying_stage?.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('buying_stage', option.value, filter.buying_stage)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Action Required Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Action Required</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.actionRequired.map(option => (
              <Badge
                key={option.value}
                variant={filter.action_required?.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('action_required', option.value, filter.action_required)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Property Type Filter */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Property Type</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.propertyTypes.map(option => (
              <Badge
                key={option.value}
                variant={filter.property_type?.includes(option.value) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => toggleArrayFilter('property_type', option.value, filter.property_type)}
              >
                {option.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Price Range</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_min" className="text-xs text-gray-600">Min Price</Label>
              <Input
                id="price_min"
                type="number"
                placeholder="Min"
                value={filter.price_min || ''}
                onChange={(e) => updateFilter('price_min', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="price_max" className="text-xs text-gray-600">Max Price</Label>
              <Input
                id="price_max"
                type="number"
                placeholder="Max"
                value={filter.price_max || ''}
                onChange={(e) => updateFilter('price_max', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>

        {/* Bedrooms & Bathrooms */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Minimum Bedrooms & Bathrooms</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bedrooms_min" className="text-xs text-gray-600">Min Bedrooms</Label>
              <Input
                id="bedrooms_min"
                type="number"
                placeholder="Bedrooms"
                value={filter.bedrooms_min || ''}
                onChange={(e) => updateFilter('bedrooms_min', e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
            <div>
              <Label htmlFor="bathrooms_min" className="text-xs text-gray-600">Min Bathrooms</Label>
              <Input
                id="bathrooms_min"
                type="number"
                step="0.5"
                placeholder="Bathrooms"
                value={filter.bathrooms_min || ''}
                onChange={(e) => updateFilter('bathrooms_min', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>

        {/* Last Activity */}
        <div>
          <Label className="text-sm font-medium mb-3 block">Last Activity</Label>
          <div className="flex flex-wrap gap-2">
            {[7, 14, 30, 60].map(days => (
              <Badge
                key={days}
                variant={filter.last_activity_days === days ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => updateFilter('last_activity_days', filter.last_activity_days === days ? undefined : days)}
              >
                Last {days} days
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
