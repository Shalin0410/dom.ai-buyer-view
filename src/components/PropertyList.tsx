import React, { useState, useEffect } from 'react';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';
import { Property, PropertyFilter, PropertyStatus, BuyingStage, ActionRequired } from '@/services/api/types';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PropertySummary } from './PropertySummary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, Plus, Filter } from 'lucide-react';
import { dataService } from '@/services';

interface PropertyListProps {
  onPropertySelect?: (property: Property) => void;
  onAddProperty?: () => void;
  mode?: 'tracked' | 'browse'; // New prop to switch between modes
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
    mode === 'tracked' ? user?.id : undefined, // Filter by buyer only in tracked mode
    filter,
    mode === 'browse' ? 'available' : 'tracked'
  );

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
        // Refresh properties to show updated state
        refreshProperties();
        // You could also show a success message here
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

  // Fetch property metadata from the database
  const [propertyMetadata, setPropertyMetadata] = useState<{
    statuses: { value: PropertyStatus; label: string }[];
    buyingStages: { value: BuyingStage; label: string }[];
    actionRequired: { value: ActionRequired; label: string }[];
  } | null>(null);

  useEffect(() => {
    // In a real app, you would fetch these from your API
    // This is a placeholder that matches the database schema
    const fetchMetadata = async () => {
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
        { value: 'review_documents' as ActionRequired, label: 'Review Documents' },
        { value: 'inspection' as ActionRequired, label: 'Inspection' },
        { value: 'appraisal' as ActionRequired, label: 'Appraisal' },
        { value: 'final_walkthrough' as ActionRequired, label: 'Final Walkthrough' },
        { value: 'none' as ActionRequired, label: 'No Action Required' },
      ];

      setPropertyMetadata({
        statuses,
        buyingStages,
        actionRequired,
      });
    };

    fetchMetadata();
  }, []);

  const getStatusColor = (status: string) => {
    const statusMeta = propertyMetadata?.statuses.find(s => s.value === status);
    if (!statusMeta) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'researching': return 'bg-blue-100 text-blue-800';
      case 'viewing': return 'bg-yellow-100 text-yellow-800';
      case 'offer_submitted': return 'bg-orange-100 text-orange-800';
      case 'under_contract': return 'bg-purple-100 text-purple-800';
      case 'in_escrow': return 'bg-indigo-100 text-indigo-800';
      case 'closed': return 'bg-green-100 text-green-800';
      case 'withdrawn': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    const statusMeta = propertyMetadata?.statuses.find(s => s.value === status);
    return statusMeta?.label || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading properties...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={refreshProperties} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {mode === 'tracked' ? 'My Properties' : 'Browse Properties'}
          </h1>
          <p className="text-gray-600 mt-1">
            {mode === 'tracked' 
              ? 'Track and manage properties you\'re considering'
              : 'Discover available properties in your area'
            }
          </p>
        </div>
        <Button onClick={onAddProperty} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          {mode === 'tracked' ? 'Add Property' : 'Browse Properties'}
        </Button>
      </div>

      {/* Summary - Disabled until buyer-property relationship is established */}
      {/* {user?.id && <PropertySummary buyerId={user.id} />} */}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by address, city, or ZIP code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {Object.keys(filter).length > 0 && (
            <Badge variant="secondary" className="ml-1">
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
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No properties found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || Object.keys(filter).length > 0
                  ? "Try adjusting your search or filters"
                  : "Start tracking properties you're interested in"}
              </p>
              {!searchTerm && Object.keys(filter).length === 0 && (
                <Button onClick={onAddProperty}>
                  Add Your First Property
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => {
            // Create a new object with the original status and add statusText for display
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
      )}

      {/* Results Summary */}
      {filteredProperties.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          Showing {filteredProperties.length} of {properties.length} properties
        </div>
      )}
    </div>
  );
};
