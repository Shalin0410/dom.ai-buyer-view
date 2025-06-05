
import { useState } from 'react';
import { Search, MapPin, Home, DollarSign, Bed, Bath, Calendar, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [propertyType, setPropertyType] = useState('');

  const activeFilters = [
    { label: 'San Francisco', type: 'location' },
    { label: '$800K - $1.5M', type: 'price' },
    { label: '2+ beds', type: 'beds' }
  ];

  return (
    <div className="w-full space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <div className="flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="flex-1 flex items-center px-4 py-3">
            <Search className="text-gray-600 mr-3" size={20} />
            <Input
              placeholder="Search by neighborhood, address, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 bg-transparent placeholder:text-gray-500 text-gray-800 focus:ring-0 focus-visible:ring-0 text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-gray-600 hover:text-gray-800 hover:bg-white/20 rounded-xl"
            >
              <SlidersHorizontal size={16} className="mr-1" />
              Filters
            </Button>
            
            <Button size="sm" className="bg-brand-coral hover:bg-brand-coral/90 text-white rounded-xl px-6 shadow-md">
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-xs text-gray-600 font-medium">Active filters:</span>
          {activeFilters.map((filter, index) => (
            <Badge 
              key={index} 
              className="bg-white/20 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-white/30 transition-colors text-xs px-3 py-1 rounded-full"
            >
              {filter.label}
              <button className="ml-2 text-gray-500 hover:text-gray-700">×</button>
            </Badge>
          ))}
        </div>
      )}

      {/* Expanded Filters */}
      {showFilters && (
        <Card className="p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Price Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 flex items-center">
                <DollarSign size={14} className="mr-1" />
                Price Range
              </label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-800 rounded-xl text-sm">
                  <SelectValue placeholder="Any price" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/60">
                  <SelectItem value="0-500k">$0 - $500K</SelectItem>
                  <SelectItem value="500k-1m">$500K - $1M</SelectItem>
                  <SelectItem value="1m-2m">$1M - $2M</SelectItem>
                  <SelectItem value="2m+">$2M+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bedrooms */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 flex items-center">
                <Bed size={14} className="mr-1" />
                Bedrooms
              </label>
              <Select value={bedrooms} onValueChange={setBedrooms}>
                <SelectTrigger className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-800 rounded-xl text-sm">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/60">
                  <SelectItem value="1+">1+</SelectItem>
                  <SelectItem value="2+">2+</SelectItem>
                  <SelectItem value="3+">3+</SelectItem>
                  <SelectItem value="4+">4+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 flex items-center">
                <Home size={14} className="mr-1" />
                Property Type
              </label>
              <Select value={propertyType} onValueChange={setPropertyType}>
                <SelectTrigger className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-800 rounded-xl text-sm">
                  <SelectValue placeholder="Any type" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/60">
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 flex items-center">
                <MapPin size={14} className="mr-1" />
                Location
              </label>
              <Select>
                <SelectTrigger className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-800 rounded-xl text-sm">
                  <SelectValue placeholder="Neighborhood" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/60">
                  <SelectItem value="mission">Mission District</SelectItem>
                  <SelectItem value="noe-valley">Noe Valley</SelectItem>
                  <SelectItem value="soma">SOMA</SelectItem>
                  <SelectItem value="castro">Castro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Available */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-700 flex items-center">
                <Calendar size={14} className="mr-1" />
                Move-in Date
              </label>
              <Select>
                <SelectTrigger className="bg-white/30 backdrop-blur-sm border-white/40 text-gray-800 rounded-xl text-sm">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 backdrop-blur-md border border-white/60">
                  <SelectItem value="immediately">Immediately</SelectItem>
                  <SelectItem value="30-days">Within 30 days</SelectItem>
                  <SelectItem value="60-days">Within 60 days</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/20">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-600 hover:text-gray-800 hover:bg-white/20 rounded-xl"
            >
              Clear all filters
            </Button>
            <Button 
              size="sm"
              className="bg-brand-coral hover:bg-brand-coral/90 text-white rounded-xl px-6"
            >
              Apply Filters
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SearchAndFilters;
