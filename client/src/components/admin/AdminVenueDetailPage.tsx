import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
  Phone,
  Check,
  X,
  Info,
  ChevronLeft,
  MapPinned,
  Clock,
  UserCheck,
  Star,
  BedDouble,
  Bed,
  Bath
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageSlider from '@/components/ImageSlider';
import api from '@/utils/api-fetch';
import { toast } from '@/components/ui/sonner';
import VenueImageGallery from '@/components/venues/VenueImageGallery';
import BookingsList from '@/components/BookingsList';

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
  approvalStatus: string;
  createdAt: string;
  profileImage?: string;
}

interface RoomType {
  _id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: {
    amount: number;
    currency: string;
  };
  amenities: string[];
  images: Array<{
    url: string;
    public_id: string;
    caption?: string;
    isMain: boolean;
  }>;
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
  roomTypes: RoomType[];
}

const AdminVenueDetailPage: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

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

  const handleApprove = async () => {
    if (!venue) return;
    
    try {
      const response = await api.put(`/admin/venues/${venue._id}/approve`);
      
      if (response.success) {
        setVenue({ ...venue, approvalStatus: 'approved' });
        toast.success('Venue approved successfully');
      } else {
        toast.error(response.message || 'Failed to approve venue');
      }
    } catch (error) {
      console.error('Error approving venue:', error);
      toast.error('An error occurred while approving the venue');
    }
  };

  const handleReject = async (reason: string) => {
    if (!venue) return;
    
    try {
      const response = await api.put(`/admin/venues/${venue._id}/reject`, { reason });
      
      if (response.success) {
        setVenue({ ...venue, approvalStatus: 'rejected', rejectionReason: reason });
        toast.success('Venue rejected');
      } else {
        toast.error(response.message || 'Failed to reject venue');
      }
    } catch (error) {
      console.error('Error rejecting venue:', error);
      toast.error('An error occurred while rejecting the venue');
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
      
      <Tabs defaultValue="details" className="w-full" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid grid-cols-4 mb-6">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="host">Venue Host</TabsTrigger>
          <TabsTrigger value="rooms">Room Types</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Venue Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Venue Type</p>
                    <p className="font-medium flex items-center mt-1">
                      <Building className="h-4 w-4 mr-1 text-gray-500" />
                      {formattedVenueType}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Location</p>
                    <p className="font-medium flex items-center mt-1">
                      <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                      {venue.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="font-medium flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      {formattedCreatedAt}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Last Updated</p>
                    <p className="font-medium flex items-center mt-1">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      {formattedUpdatedAt}
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Address</p>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p>{venue.address.street}, {venue.address.city}, {venue.address.district}, {venue.address.postalCode}, {venue.address.country}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {venue.amenities.map((amenity, index) => (
                      <Badge key={index} variant="outline">
                        {amenity}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Venue Gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <VenueImageGallery images={venue.images} maxHeight="500px" />
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{venue.description}</p>
              </CardContent>
            </Card>
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
        
        <TabsContent value="host" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Host Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                  {venue.venueHost.profileImage ? (
                    <img 
                      src={venue.venueHost.profileImage} 
                      alt={venue.venueHost.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-full h-full p-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{venue.venueHost.name}</h3>
                  <div className="text-sm text-gray-500 flex items-center mt-1">
                    <UserCheck className="h-4 w-4 mr-1" />
                    <span>Host since {new Date(venue.venueHost.createdAt).toLocaleDateString()}</span>
                  </div>
                  <Badge 
                    className={`mt-2 ${
                      venue.venueHost.approvalStatus === 'approved' 
                        ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                        : venue.venueHost.approvalStatus === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' 
                        : 'bg-red-100 text-red-800 hover:bg-red-100'
                    }`}
                  >
                    {venue.venueHost.approvalStatus.charAt(0).toUpperCase() + venue.venueHost.approvalStatus.slice(1)}
                  </Badge>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="font-medium flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-1 text-gray-500" />
                    {venue.venueHost.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="font-medium flex items-center mt-1">
                    <Phone className="h-4 w-4 mr-1 text-gray-500" />
                    {venue.venueHost.phone}
                  </p>
                </div>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => navigate(`/admin-dashboard/venue-hosts/detail/${venue.venueHost._id}`)}
              >
                <FileEdit className="h-4 w-4 mr-1" />
                View Host Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="rooms" className="space-y-6">
          {venue.roomTypes && venue.roomTypes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {venue.roomTypes.map((roomType) => (
                <Card key={roomType._id} className="overflow-hidden">
                  <div className="h-48 bg-gray-100">
                    {roomType.images && roomType.images.length > 0 ? (
                      <img 
                        src={roomType.images[0].url} 
                        alt={roomType.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BedDouble className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{roomType.name}</CardTitle>
                    <CardDescription>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Bed className="h-4 w-4 mr-1" />
                          {roomType.capacity} {roomType.capacity > 1 ? 'Guests' : 'Guest'}
                        </div>
                        <div>
                          {roomType.pricePerNight.currency} {roomType.pricePerNight.amount}/night
                        </div>
                      </div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-4">{roomType.description}</p>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Amenities</p>
                      <div className="flex flex-wrap gap-1">
                        {roomType.amenities.map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Bed className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No Room Types Available</h3>
              <p className="text-gray-500 mt-1">This venue hasn't defined any room types yet.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Venue Bookings</CardTitle>
              <CardDescription>
                View and manage all bookings for this venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsList venueId={venue._id} isAdmin={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {venue.approvalStatus === 'rejected' && venue.rejectionReason && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Rejection Reason
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">{venue.rejectionReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminVenueDetailPage; 