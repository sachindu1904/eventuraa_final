import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ArrowLeft,
  Building,
  Wifi,
  Coffee,
  Image
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

interface VenueParams {
  venueId: string;
}

const VenueDetailPage: React.FC = () => {
  const { venueId } = useParams<VenueParams>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/venues/${venueId}`);
        
        if (response.success) {
          setVenue(response.data.venue);
        } else {
          toast.error('Failed to load venue details');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching venue details:', error);
        toast.error('Error loading venue details');
      } finally {
        setIsLoading(false);
      }
    };

    if (venueId) {
      fetchVenueDetails();
    }
  }, [venueId, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Venue Not Found</h1>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Venue Image Header */}
          <div className="h-64 bg-gray-200 relative">
            {venue.imageUrl ? (
              <img 
                src={venue.imageUrl} 
                alt={venue.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Image className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Venue Details */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{venue.name}</h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <Building className="h-4 w-4 mr-2" />
                  <span className="capitalize mr-3">{venue.type.replace('_', ' ')}</span>
                  <span className="mx-2">•</span>
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{venue.location}</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                {venue.priceRange?.min && venue.priceRange?.max ? (
                  <div className="bg-gray-100 px-4 py-2 rounded-md">
                    <div className="text-sm font-medium text-gray-500">Price Range</div>
                    <div className="text-lg font-bold text-gray-800">
                      {venue.priceRange.currency || 'LKR'} {venue.priceRange.min} - {venue.priceRange.max}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Description */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>About This Venue</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  {venue.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Location */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {venue.address ? (
                    <div className="space-y-1">
                      {venue.address.street && <p>{venue.address.street}</p>}
                      {venue.address.city && (
                        <p>
                          {venue.address.city}
                          {venue.address.district && `, ${venue.address.district}`}
                          {venue.address.postalCode && ` ${venue.address.postalCode}`}
                        </p>
                      )}
                      <p>{venue.address.country || 'Sri Lanka'}</p>
                    </div>
                  ) : (
                    <p>{venue.location}</p>
                  )}
                </CardContent>
              </Card>

              {/* Capacity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Capacity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {venue.capacity?.min && venue.capacity?.max ? (
                    <p>
                      {venue.capacity.min} - {venue.capacity.max} people
                    </p>
                  ) : (
                    <p>Capacity information not provided</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Amenities & Facilities */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Facilities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wifi className="h-5 w-5 mr-2" />
                    Facilities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {venue.facilities && venue.facilities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {venue.facilities.map((facility: string, index: number) => (
                        <span 
                          key={index} 
                          className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                        >
                          {facility}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No facilities information provided</p>
                  )}
                </CardContent>
              </Card>

              {/* Amenities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Coffee className="h-5 w-5 mr-2" />
                    Amenities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {venue.amenities && venue.amenities.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {venue.amenities.map((amenity: string, index: number) => (
                        <span 
                          key={index} 
                          className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p>No amenities information provided</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Contact & Booking */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Book This Venue</CardTitle>
                <CardDescription>
                  Interested in booking this venue? Use the contact information below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div>
                    <p className="text-gray-600">
                      Please contact the venue directly to inquire about availability and booking.
                    </p>
                  </div>
                  <Button>
                    <Calendar className="mr-2 h-4 w-4" />
                    Request Booking
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenueDetailPage; 