
import { useState } from 'react';
import { MapPin, DollarSign, Home, Calendar, Sliders, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

const PropertyMatch = () => {
  const [priceRange, setPriceRange] = useState([300000, 600000]);
  const [bedrooms, setBedrooms] = useState(3);
  const [location, setLocation] = useState('Austin, TX');
  const [showFilters, setShowFilters] = useState(false);

  const matchedProperties = [
    {
      id: 1,
      address: "789 Cedar Lane, Austin, TX 78745",
      price: 465000,
      beds: 3,
      baths: 2,
      sqft: 1920,
      fitScore: 95,
      image: "/placeholder.svg",
      highlights: ["Great Schools", "Low Crime", "Commute Friendly"]
    },
    {
      id: 2,
      address: "321 Pine Street, Austin, TX 78704",
      price: 510000,
      beds: 4,
      baths: 2.5,
      sqft: 2050,
      fitScore: 88,
      image: "/placeholder.svg",
      highlights: ["Modern Kitchen", "Large Yard", "Recently Updated"]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Find Your Perfect Home</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <MapPin size={20} className="text-gray-500" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location..."
              className="flex-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Price Range
              </label>
              <div className="px-3">
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  min={200000}
                  max={800000}
                  step={10000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>${priceRange[0].toLocaleString()}</span>
                  <span>${priceRange[1].toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Bedrooms
              </label>
              <div className="flex space-x-2">
                {[2, 3, 4, 5].map((num) => (
                  <Button
                    key={num}
                    variant={bedrooms === num ? "default" : "outline"}
                    size="sm"
                    className="w-10 h-10 p-0"
                    onClick={() => setBedrooms(num)}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
              <Home size={16} className="mr-2" />
              Search Homes
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Sliders size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
        <div className="flex items-center space-x-2">
          <Star className="text-green-600" size={20} />
          <div>
            <p className="font-medium text-green-800">Great match!</p>
            <p className="text-sm text-green-700">
              Found {matchedProperties.length} properties that fit your criteria perfectly
            </p>
          </div>
        </div>
      </div>

      {/* Matched Properties */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Top Matches</h3>
        {matchedProperties.map((property) => (
          <Card key={property.id} className="overflow-hidden">
            <div className="aspect-[16/9] bg-gray-200 relative">
              <img 
                src={property.image} 
                alt={property.address}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <Badge className="bg-green-600 hover:bg-green-600">
                  {property.fitScore}% Match
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">
                  {property.address}
                </h4>
                <p className="text-lg font-bold text-gray-900">
                  ${property.price.toLocaleString()}
                </p>
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                <span>{property.beds} beds</span>
                <span>{property.baths} baths</span>
                <span>{property.sqft.toLocaleString()} sqft</span>
              </div>

              <div className="flex flex-wrap gap-1 mb-3">
                {property.highlights.map((highlight, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {highlight}
                  </Badge>
                ))}
              </div>

              <div className="flex space-x-2">
                <Button size="sm" className="flex-1">
                  <Calendar size={14} className="mr-1" />
                  Schedule Tour
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  View Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PropertyMatch;
