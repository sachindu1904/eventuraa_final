import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Search,
  MapPin,
  Building,
  Image,
  Utensils,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

interface Venue {
  _id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  imageUrl?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
}

const RestaurantListPage: React.FC = () => {
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setIsLoading(true);
        // Get all public venues
        const response = await api.get('/venues');
        
        if (response.success) {
          // Filter only restaurant type venues
          const restaurantVenues = response.data.venues.filter(
            (venue: Venue) => venue.type === 'restaurant'
          );
          setRestaurants(restaurantVenues || []);
        } else {
          toast.error('Failed to load restaurants');
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        toast.error('An error occurred while loading restaurants');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = searchTerm === '' || 
      restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = location === 'all' || location === '' || 
      restaurant.location.toLowerCase().includes(location.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  const handleViewDetails = (venueId: string) => {
    navigate(`/venues/${venueId}`);
  };

  const uniqueLocations = [...new Set(restaurants.map(restaurant => restaurant.location))];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Explore Restaurants</h1>
          <p className="text-gray-600">
            Discover the perfect dining experience for your visit
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search restaurants by name or description"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Select 
                value={location} 
                onValueChange={setLocation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {uniqueLocations.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Utensils className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Restaurants Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || location
                ? "No restaurants match your search criteria. Try adjusting your filters."
                : "There are no restaurants available at the moment. Please check back later."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((restaurant) => (
              <Card key={restaurant._id} className="overflow-hidden h-full flex flex-col">
                <div className="h-48 bg-gray-200 relative">
                  {restaurant.imageUrl ? (
                    <img 
                      src={restaurant.imageUrl} 
                      alt={restaurant.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Utensils className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-800">{restaurant.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm space-x-2 mt-1 mb-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                      Restaurant
                    </span>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{restaurant.location}</span>
                    </div>
                  </div>
                  {restaurant.priceRange?.min && restaurant.priceRange?.max && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Price range: </span>
                      {restaurant.priceRange.currency || 'LKR'} {restaurant.priceRange.min} - {restaurant.priceRange.max}
                    </div>
                  )}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                    {restaurant.description || 'No description provided.'}
                  </p>
                  <div className="mt-auto">
                    <Button 
                      className="w-full" 
                      onClick={() => handleViewDetails(restaurant._id)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantListPage; 