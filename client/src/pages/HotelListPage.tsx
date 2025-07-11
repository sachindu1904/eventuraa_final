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
  Hotel,
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

const HotelListPage: React.FC = () => {
  const navigate = useNavigate();
  const [hotels, setHotels] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setIsLoading(true);
        // Get all public venues
        const response = await api.get('/venues');
        
        if (response.success) {
          // Filter only hotel type venues
          const hotelVenues = response.data.venues.filter(
            (venue: Venue) => venue.type === 'hotel' || venue.type === 'resort'
          );
          setHotels(hotelVenues || []);
        } else {
          toast.error('Failed to load hotels');
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        toast.error('An error occurred while loading hotels');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotels();
  }, []);

  const filteredHotels = hotels.filter(hotel => {
    const matchesSearch = searchTerm === '' || 
      hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = location === 'all' || location === '' || 
      hotel.location.toLowerCase().includes(location.toLowerCase());
    
    return matchesSearch && matchesLocation;
  });

  const handleViewDetails = (venueId: string) => {
    navigate(`/venues/${venueId}`);
  };

  const uniqueLocations = [...new Set(hotels.map(hotel => hotel.location))];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Explore Hotels</h1>
          <p className="text-gray-600">
            Discover the perfect hotels and resorts for your stay
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search hotels by name or description"
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
        ) : filteredHotels.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Hotel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Hotels Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || location
                ? "No hotels match your search criteria. Try adjusting your filters."
                : "There are no hotels available at the moment. Please check back later."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <Card key={hotel._id} className="overflow-hidden h-full flex flex-col">
                <div className="h-48 bg-gray-200 relative">
                  {hotel.imageUrl ? (
                    <img 
                      src={hotel.imageUrl} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Hotel className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-800">{hotel.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm space-x-2 mt-1 mb-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                      {hotel.type === 'hotel' ? 'Hotel' : 'Resort'}
                    </span>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{hotel.location}</span>
                    </div>
                  </div>
                  {hotel.priceRange?.min && hotel.priceRange?.max && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Price range: </span>
                      {hotel.priceRange.currency || 'LKR'} {hotel.priceRange.min} - {hotel.priceRange.max}
                    </div>
                  )}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                    {hotel.description || 'No description provided.'}
                  </p>
                  <div className="mt-auto">
                    <Button 
                      className="w-full" 
                      onClick={() => handleViewDetails(hotel._id)}
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

export default HotelListPage;

