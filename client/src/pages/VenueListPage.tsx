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
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

interface VenueImage {
  _id: string;
  url: string;
  public_id: string;
  caption?: string;
  isMain: boolean;
}

interface Venue {
  _id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  images?: VenueImage[];
  imageUrl?: string; // Legacy support
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  approvalStatus: string;
}

const VenueListPage: React.FC = () => {
  const navigate = useNavigate();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [venueType, setVenueType] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setIsLoading(true);
        // Get all public venues
        const response = await api.get('/venues');
        
        if (response.success) {
          // Filter only approved venues
          const approvedVenues = response.data.venues.filter((venue: Venue) => 
            venue.approvalStatus === 'approved'
          );
          setVenues(approvedVenues || []);
        } else {
          toast.error('Failed to load venues');
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        toast.error('An error occurred while loading venues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenues();
  }, []);

  // Helper function to get the main image or first image from a venue
  const getVenueMainImage = (venue: Venue) => {
    if (venue.images && venue.images.length > 0) {
      // Try to find the main image first
      const mainImage = venue.images.find(img => img.isMain);
      // If main image exists, use it, otherwise use the first image
      return mainImage ? mainImage.url : venue.images[0].url;
    }
    // Fall back to legacy imageUrl if no images array
    return venue.imageUrl || '';
  };

  // Helper function to check if venue has multiple images
  const hasMultipleImages = (venue: Venue) => {
    return venue.images && venue.images.length > 1;
  };

  const filteredVenues = venues.filter(venue => {
    const matchesSearch = searchTerm === '' || 
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = venueType === 'all' || venueType === '' || venue.type === venueType;
    
    const matchesLocation = location === 'all' || location === '' || 
      venue.location.toLowerCase().includes(location.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const handleViewDetails = (venueId: string) => {
    navigate(`/venues/${venueId}`);
  };

  const uniqueLocations = [...new Set(venues.map(venue => venue.location))];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Explore Venues</h1>
          <p className="text-gray-600">
            Discover the perfect restaurants, hotels and event spaces
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                  placeholder="Search venues by name or description"
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Select 
                value={venueType} 
                onValueChange={setVenueType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Venue Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="restaurant">Restaurants</SelectItem>
                  <SelectItem value="hotel">Hotels</SelectItem>
                  <SelectItem value="resort">Resorts</SelectItem>
                  <SelectItem value="banquet_hall">Banquet Halls</SelectItem>
                  <SelectItem value="conference_center">Conference Centers</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
        ) : filteredVenues.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">No Venues Found</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {searchTerm || venueType || location
                ? "No venues match your search criteria. Try adjusting your filters."
                : "There are no venues available at the moment. Please check back later."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue) => (
              <Card key={venue._id} className="overflow-hidden h-full flex flex-col">
                <div className="h-48 bg-gray-200 relative">
                  {getVenueMainImage(venue) ? (
                    <>
                      <img 
                        src={getVenueMainImage(venue)} 
                        alt={venue.name} 
                        className="w-full h-full object-cover"
                      />
                      {hasMultipleImages(venue) && (
                        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs z-10">
                          {venue.images!.length} Photos
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <CardContent className="p-5 flex-1 flex flex-col">
                  <h3 className="font-bold text-lg text-gray-800">{venue.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm space-x-2 mt-1 mb-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full capitalize">
                      {venue.type.replace('_', ' ')}
                    </span>
                    <span>•</span>
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span>{venue.location}</span>
                    </div>
                  </div>
                  {venue.priceRange?.min && venue.priceRange?.max && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Price range: </span>
                      {venue.priceRange.currency || 'LKR'} {venue.priceRange.min} - {venue.priceRange.max}
                    </div>
                  )}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-1">
                    {venue.description || 'No description provided.'}
                  </p>
                  <div className="mt-auto">
                    <Button 
                      className="w-full" 
                      onClick={() => handleViewDetails(venue._id)}
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

export default VenueListPage; 