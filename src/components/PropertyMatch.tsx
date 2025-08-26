
import { useState } from 'react';
import { MapPin, DollarSign, Home, Calendar, Sliders, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useProperties } from '@/hooks/useProperties';
import { useAuth } from '@/hooks/useAuth';

const PropertyMatch = () => {
  const { user } = useAuth();
  const [priceRange, setPriceRange] = useState([300000, 600000]);
  const [bedrooms, setBedrooms] = useState(3);
  const [location, setLocation] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchExecuted, setSearchExecuted] = useState(false);

  // Get available properties based on current filters
  const { properties, loading } = useProperties(
    user?.id,
    {
      price_min: priceRange[0],
      price_max: priceRange[1],
      bedrooms_min: bedrooms
    },
    'browse'
  );

  // Calculate match scores based on user preferences (mock scoring for now)
  const matchedProperties = properties.map(property => {
    // Calculate a simple match score based on price range and bedrooms
    let score = 70; // Base score
    
    // Price match scoring
    if (property.listing_price >= priceRange[0] && property.listing_price <= priceRange[1]) {
      score += 20;
    } else if (Math.abs(property.listing_price - ((priceRange[0] + priceRange[1]) / 2)) < 50000) {
      score += 10;
    }
    
    // Bedroom match scoring
    if (property.bedrooms === bedrooms) {
      score += 15;
    } else if (Math.abs(property.bedrooms - bedrooms) <= 1) {
      score += 8;
    }
    
    // Ensure score doesn't exceed 100
    score = Math.min(score, 100);
    
    // Generate highlights based on property features
    const highlights = [];
    if (property.year_built && property.year_built > 2010) highlights.push('Recently Built');
    if (property.square_feet && property.square_feet > 2000) highlights.push('Spacious');
    if (property.property_type === 'Single Family') highlights.push('Single Family');
    if (property.neighborhood_info?.walkability_score > 70) highlights.push('Walkable');
    if (highlights.length === 0) highlights.push('Great Location', 'Well Maintained');
    
    const primaryPhoto = property.photos?.find(p => p.is_primary) || property.photos?.[0];
    
    return {
      id: property.id,
      address: `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`,
      price: property.listing_price,
      beds: property.bedrooms,
      baths: property.bathrooms,
      sqft: property.square_feet,
      fitScore: Math.round(score),
      image: primaryPhoto?.url || '/placeholder-property.jpg',
      highlights: highlights.slice(0, 3)
    };
  }).filter(property => searchExecuted).sort((a, b) => b.fitScore - a.fitScore);

  const handleSearch = () => {
    setSearchExecuted(true);
  };

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
            <Button 
              className="flex-1 bg-blue-600 hover:bg-blue-700" 
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : (
                <Home size={16} className="mr-2" />
              )}
              {loading ? 'Searching...' : 'Search Homes'}
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
      {searchExecuted && (
        <div className={`rounded-lg p-4 border ${
          matchedProperties.length > 0 
            ? 'bg-green-50 border-green-200' 
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            <Star className={matchedProperties.length > 0 ? 'text-green-600' : 'text-blue-600'} size={20} />
            <div>
              <p className={`font-medium ${
                matchedProperties.length > 0 ? 'text-green-800' : 'text-blue-800'
              }`}>
                {matchedProperties.length > 0 ? 'Great matches found!' : 'No exact matches'}
              </p>
              <p className={`text-sm ${
                matchedProperties.length > 0 ? 'text-green-700' : 'text-blue-700'
              }`}>
                {matchedProperties.length > 0 
                  ? `Found ${matchedProperties.length} properties that fit your criteria`
                  : 'Try adjusting your search criteria to find more properties'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Matched Properties */}
      {searchExecuted && matchedProperties.length > 0 && (
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
      )}
    </div>
  );
};

export default PropertyMatch;
