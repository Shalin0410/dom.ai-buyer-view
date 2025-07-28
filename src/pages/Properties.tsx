import React, { useState } from 'react';
import { Property } from '@/services/api/types';
import { PropertyList } from '@/components/PropertyList';
import { PropertyDetail } from '@/components/PropertyDetail';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const Properties: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState('tracked');

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };

  const handleBack = () => {
    setSelectedProperty(null);
  };

  const handleAddProperty = () => {
    // Switch to browse tab when adding properties
    setActiveTab('browse');
  };

  if (selectedProperty) {
    return (
      <PropertyDetail 
        propertyId={selectedProperty.id} 
        onBack={handleBack}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="tracked">My Properties</TabsTrigger>
          <TabsTrigger value="browse">Browse Available</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tracked" className="space-y-6">
          <PropertyList 
            mode="tracked"
            onPropertySelect={handlePropertySelect}
            onAddProperty={handleAddProperty}
          />
        </TabsContent>
        
        <TabsContent value="browse" className="space-y-6">
          <PropertyList 
            mode="browse"
            onPropertySelect={handlePropertySelect}
            onAddProperty={handleAddProperty}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
