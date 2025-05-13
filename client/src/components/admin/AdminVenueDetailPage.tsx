import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  MapPin, 
  Users, 
  ArrowLeft, 
  Loader2, 
  Home,
  DollarSign,
  User,
  Calendar,
  CheckCircle,
  XCircle,
  Building,
  Wifi,
  Flag,
  Mail,
  Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageSlider from '@/components/ImageSlider';
import api from '@/utils/api-fetch';
import { toast } from '@/components/ui/sonner';

interface Address {
  street: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
}

interface PriceRange {
  currency: string;
  min: number;
  max: number;
}

interface Capacity {
  min: number;
  max: number;
}

interface VenueImage {
  url: string;
  public_id: string;
  caption: string;
  isMain: boolean;
}

interface VenueHost {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
}

interface Venue {
  _id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  address: Address;
  facilities: string[];
  amenities: string[];
  capacity: Capacity;
  priceRange: PriceRange;
  images: VenueImage[];
  venueHost: VenueHost;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminVenueDetailPage: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const fetchVenueDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/admin/venues/${venueId}`);
        
        if (response.success) {
          setVenue(response.data.venue);
        } else {
          setError(response.message || 'Failed to load venue details');
          toast.error('Failed to load venue details');
        }
      } catch (error) {
        console.error('Error fetching venue details:', error);
        setError('An error occurred while loading the venue');
        toast.error('Failed to load venue. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchVenueDetails();
    }
  }, [venueId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleActive = async () => {
    if (!venue) return;
    
    setProcessingAction(true);
    try {
      const response = await api.put(`/admin/venue-hosts/${venue.venueHost._id}/${venue.isActive ? 'deactivate' : 'activate'}`);
      
      if (response.success) {
        setVenue({
          ...venue,
          isActive: !venue.isActive
        });
        toast.success(`Venue ${venue.isActive ? 'deactivated' : 'activated'} successfully`);
      } else {
        throw new Error(response.message || 'Failed to update venue status');
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Loading venue details...</p>
        </div>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">Venue Not Found</h2>
        <p className="text-gray-600 mb-6">
          {error || "The venue you're looking for doesn't exist or has been removed."}
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const formattedCreatedAt = format(new Date(venue.createdAt), 'MMMM d, yyyy');
  const formattedUpdatedAt = format(new Date(venue.updatedAt), 'MMMM d, yyyy');
  
  // Extract venue images for slider
  const venueImages = venue.images.map(img => img.url);

  // Format venue type for display
  const formattedVenueType = venue.type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Venues
          </Button>
          
          <h1 className="text-2xl font-bold">{venue.name}</h1>
          
          <Badge className={
            venue.approvalStatus === 'approved' ? "bg-green-100 text-green-800" : 
            venue.approvalStatus === 'pending' ? "bg-yellow-100 text-yellow-800" : 
            "bg-red-100 text-red-800"
          }>
            {venue.approvalStatus.charAt(0).toUpperCase() + venue.approvalStatus.slice(1)}
          </Badge>
          
          <Badge className={venue.isActive 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
          }>
            {venue.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant={venue.isActive ? "destructive" : "outline"} 
            onClick={handleToggleActive}
            disabled={processingAction}
          >
            {venue.isActive ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            {venue.isActive ? 'Deactivate Venue' : 'Activate Venue'}
          </Button>
          
          <Button asChild>
            <a href={`/venues/${venue._id}`} target="_blank" rel="noreferrer">
              View on Site
            </a>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Images</CardTitle>
            </CardHeader>
            <CardContent>
              {venueImages.length > 0 ? (
                <ImageSlider images={venueImages} />
              ) : (
                <div className="h-64 flex items-center justify-center bg-gray-100 rounded-md">
                  <p className="text-gray-500">No images available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Venue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="details">
                <TabsList className="mb-4">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="host">Venue Host</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Description</h3>
                    <p className="text-gray-700 whitespace-pre-line">{venue.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <Home className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Venue Type</div>
                        <div className="text-gray-600">{formattedVenueType}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Location</div>
                        <div className="text-gray-600">{venue.location}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <DollarSign className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Price Range</div>
                        <div className="text-gray-600">
                          {venue.priceRange.currency} {venue.priceRange.min} - {venue.priceRange.max}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Users className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Capacity</div>
                        <div className="text-gray-600">
                          {venue.capacity.min} - {venue.capacity.max} people
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Address</div>
                        <div className="text-gray-600">
                          {venue.address.street}, {venue.address.city}, {venue.address.district}, {venue.address.postalCode}, {venue.address.country}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Created</div>
                        <div className="text-gray-600">{formattedCreatedAt}</div>
                      </div>
                    </div>
                    
                    {venue.approvalStatus === 'rejected' && venue.rejectionReason && (
                      <div className="md:col-span-2 flex items-start gap-2">
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                        <div>
                          <div className="font-medium">Rejection Reason</div>
                          <div className="text-gray-600">{venue.rejectionReason}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="features" className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Facilities</h3>
                    <div className="flex flex-wrap gap-2">
                      {venue.facilities.length > 0 ? (
                        venue.facilities.map((facility, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50">
                            {facility}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500">No facilities listed</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Amenities</h3>
                    <div className="flex flex-wrap gap-2">
                      {venue.amenities.length > 0 ? (
                        venue.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50">
                            {amenity}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-gray-500">No amenities listed</p>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="host" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-2">
                      <User className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Host Name</div>
                        <div className="text-gray-600">{venue.venueHost.name}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Company Name</div>
                        <div className="text-gray-600">{venue.venueHost.companyName || 'Not specified'}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Email</div>
                        <div className="text-gray-600">{venue.venueHost.email}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                      <div>
                        <div className="font-medium">Phone</div>
                        <div className="text-gray-600">{venue.venueHost.phone || 'Not specified'}</div>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/admin-dashboard/venue-hosts/detail/${venue.venueHost._id}`)}
                      className="md:col-span-2"
                    >
                      View Host Profile
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle>Status Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-2">
                  <Flag className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Approval Status</div>
                    <div className={
                      venue.approvalStatus === 'approved' ? "text-green-600" : 
                      venue.approvalStatus === 'pending' ? "text-yellow-600" : 
                      "text-red-600"
                    }>
                      {venue.approvalStatus.charAt(0).toUpperCase() + venue.approvalStatus.slice(1)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Wifi className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Active Status</div>
                    <div className={venue.isActive ? "text-green-600" : "text-red-600"}>
                      {venue.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Last Updated</div>
                    <div className="text-gray-600">{formattedUpdatedAt}</div>
                  </div>
                </div>
              </div>
              
              {venue.approvalStatus === 'pending' && (
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    className="w-full" 
                    onClick={() => navigate(`/admin-dashboard/venues/pending/${venueId}`)}
                  >
                    Review Venue
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminVenueDetailPage; 