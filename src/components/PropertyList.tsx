import React, { useState, useEffect } from 'react';
import { useProperties, usePropertySummary } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { Property, PropertyFilter, PropertyStatus, BuyingStage, ActionRequired } from '@/services/api/types';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Plus, Filter, Home, Clock, AlertCircle, TrendingUp } from 'lucide-react';
import { dataService } from '@/services';

interface PropertyListProps {
  onPropertySelect?: (property: Property) => void;
  onAddProperty?: () => void;
  mode?: 'tracked' | 'browse';
}

export const PropertyList: React.FC<PropertyListProps> = ({
  onPropertySelect,
  onAddProperty,
  mode = 'tracked'
}) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filter, setFilter] = useState<PropertyFilter>({});
  
  const { properties, loading, error, updateFilter, refreshProperties } = useProperties(
    mode === 'tracked' ? user?.id : undefined,
    filter,
    mode === 'browse' ? 'available' : 'tracked'
  );

  const { summary, loading: summaryLoading } = usePropertySummary(user?.id || '');

  const handleFilterChange = (newFilter: PropertyFilter) => {
    setFilter(newFilter);
    updateFilter(newFilter);
  };

  const handleAddToInterested = async (propertyId: string) => {
    if (!user?.id) {
      console.error('User not authenticated');
      return;
    }

    try {
      const response = await dataService.addPropertyToBuyer(user.id, propertyId);
      if (response.success) {
        refreshProperties();
        console.log('Property added to interested list');
      } else {
        console.error('Failed to add property:', response.error);
      }
    } catch (error) {
      console.error('Error adding property to interested:', error);
    }
  };

  const filteredProperties = properties.filter(property => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.state.toLowerCase().includes(searchLower) ||
      property.zip_code.includes(searchTerm)
    );
  });

  const getStatusText = (status: string) => {
    const statusLabels = {
      'researching': 'Researching',
      'viewing': 'Viewing',
      'offer_submitted': 'Offer Submitted',
      'under_contract': 'Under Contract',
      'in_escrow': 'In Escrow',
      'closed': 'Closed',
      'withdrawn': 'Withdrawn'
    };
    return statusLabels[status as keyof typeof statusLabels] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading properties...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">Something went wrong</h3>
            <p className="text-red-700 mb-4">{error}</p>
            <Button onClick={refreshProperties} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {mode === 'tracked' ? 'My Properties' : 'Browse Properties'}
          </h1>
          <p className="text-gray-600">
            {mode === 'tracked' 
              ? 'Track and manage properties you\'re considering'
              : 'Discover available properties in your area'
            }
          </p>
        </div>
        <Button onClick={onAddProperty} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {mode === 'tracked' ? 'Add Property' : 'Browse Properties'}
        </Button>
      </div>

      {/* Summary Cards for Tracked Mode */}
      {mode === 'tracked' && user?.id && summary && !summaryLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Properties</p>
                  <p className="text-3xl font-bold text-blue-900">{summary.total_properties}</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Home className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700">Active Search</p>
                  <p className="text-3xl font-bold text-amber-900">
                    {summary.by_stage.active_search + summary.by_stage.initial_research}
                  </p>
                </div>
                <div className="p-3 bg-amber-200 rounded-full">
                  <Search className="h-6 w-6 text-amber-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Under Contract</p>
                  <p className="text-3xl font-bold text-green-900">
                    {summary.by_status.under_contract + summary.by_status.in_escrow}
                  </p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Action Required</p>
                  <p className="text-3xl font-bold text-red-900">{summary.requiring_action}</p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <AlertCircle className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by address, city, or ZIP code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 ${Object.keys(filter).length > 0 ? 'border-blue-500 text-blue-700 bg-blue-50' : ''}`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {Object.keys(filter).length > 0 && (
            <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-700">
              {Object.keys(filter).length}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <PropertyFilters
          filter={filter}
          onFilterChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Home className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || Object.keys(filter).length > 0
                  ? "Try adjusting your search or filters"
                  : mode === 'tracked' 
                    ? "Start tracking properties you're interested in"
                    : "No properties available at the moment"
                }
              </p>
              {!searchTerm && Object.keys(filter).length === 0 && mode === 'tracked' && (
                <Button onClick={onAddProperty} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Property
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map((property) => {
              const propertyWithStatus = {
                ...property,
                statusText: getStatusText(property.status),
                action_required: property.action_required || 'none',
                buying_stage: property.buying_stage || 'initial_research',
              };
              
              return (
                <PropertyCard 
                  key={property.id} 
                  property={propertyWithStatus}
                  onClick={() => onPropertySelect?.(property)}
                  mode={mode}
                  onAddToInterested={mode === 'browse' ? handleAddToInterested : undefined}
                />
              );
            })}
          </div>

          {/* Results Summary */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600">
              <span>Showing {filteredProperties.length} of {properties.length} properties</span>
              {Object.keys(filter).length > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Filtered
                </Badge>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
