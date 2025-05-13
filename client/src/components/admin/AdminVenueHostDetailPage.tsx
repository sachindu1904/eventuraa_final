import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { 
  ArrowLeft, 
  Loader2, 
  User,
  Mail,
  Phone,
  Building,
  Calendar,
  CheckCircle,
  XCircle,
  MapPin,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import api from '@/utils/api-fetch';
import { toast } from '@/components/ui/sonner';

interface VenueHost {
  _id: string;
  name: string;
  email: string;
  companyName: string;
  phone: string;
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  venues: {
    count: number;
    items: VenueItem[];
  };
}

interface VenueItem {
  _id: string;
  name: string;
  type: string;
  location: string;
  priceRange: {
    currency: string;
    min: number;
    max: number;
  };
  images: {
    url: string;
    isMain: boolean;
  }[];
  approvalStatus: string;
  isActive: boolean;
  createdAt: string;
}

const AdminVenueHostDetailPage: React.FC = () => {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const [venueHost, setVenueHost] = useState<VenueHost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const fetchVenueHostDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/admin/venue-hosts/${hostId}`);
        
        if (response.success) {
          setVenueHost(response.data.venueHost);
        } else {
          setError(response.message || 'Failed to load venue host details');
          toast.error('Failed to load venue host details');
        }
      } catch (error) {
        console.error('Error fetching venue host details:', error);
        setError('An error occurred while loading the venue host');
        toast.error('Failed to load venue host. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (hostId) {
      fetchVenueHostDetails();
    }
  }, [hostId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleActive = async () => {
    if (!venueHost) return;
    
    setProcessingAction(true);
    try {
      const response = await api.put(`/admin/venue-hosts/${venueHost._id}/${venueHost.isActive ? 'deactivate' : 'activate'}`);
      
      if (response.success) {
        setVenueHost({
          ...venueHost,
          isActive: !venueHost.isActive
        });
        toast.success(`Venue host ${venueHost.isActive ? 'deactivated' : 'activated'} successfully`);
      } else {
        throw new Error(response.message || 'Failed to update venue host status');
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
          <p className="text-gray-600">Loading venue host details...</p>
        </div>
      </div>
    );
  }

  if (error || !venueHost) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">Venue Host Not Found</h2>
        <p className="text-gray-600 mb-6">
          {error || "The venue host you're looking for doesn't exist or has been removed."}
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  // Ensure venues.items is always an array to prevent mapping errors
  if (!venueHost.venues.items) {
    venueHost.venues.items = [];
  }

  const formattedCreatedAt = format(new Date(venueHost.createdAt), 'MMMM d, yyyy');
  const formatVenueType = (type: string) => {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Venue Hosts
          </Button>
          
          <h1 className="text-2xl font-bold">{venueHost.name}</h1>
          
          <Badge className={venueHost.isActive 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
          }>
            {venueHost.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant={venueHost.isActive ? "destructive" : "outline"} 
            onClick={handleToggleActive}
            disabled={processingAction}
          >
            {venueHost.isActive ? <XCircle className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            {venueHost.isActive ? 'Deactivate Host' : 'Activate Host'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Host Details */}
          <Card>
            <CardHeader>
              <CardTitle>Host Information</CardTitle>
              <CardDescription>
                Contact details and general information about this venue host
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <User className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Name</div>
                    <div className="text-gray-600">{venueHost.name}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Building className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Company Name</div>
                    <div className="text-gray-600">{venueHost.companyName || 'Not specified'}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Mail className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Email</div>
                    <div className="text-gray-600">{venueHost.email}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Phone className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Phone</div>
                    <div className="text-gray-600">{venueHost.phone || 'Not specified'}</div>
                  </div>
                </div>
                
                {venueHost.address && (
                  <div className="md:col-span-2 flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Address</div>
                      <div className="text-gray-600">
                        {venueHost.address.street}, {venueHost.address.city}, 
                        {venueHost.address.district && ` ${venueHost.address.district},`} 
                        {venueHost.address.postalCode && ` ${venueHost.address.postalCode},`} 
                        {venueHost.address.country}
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-start gap-2">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Registered On</div>
                    <div className="text-gray-600">{formattedCreatedAt}</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <Home className="h-5 w-5 text-gray-500 mt-0.5" />
                  <div>
                    <div className="font-medium">Total Venues</div>
                    <div className="text-gray-600">{venueHost.venues.count}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Venues Table */}
          <Card>
            <CardHeader>
              <CardTitle>Managed Venues</CardTitle>
              <CardDescription>
                Venues managed by this host
              </CardDescription>
            </CardHeader>
            <CardContent>
              {venueHost.venues.count > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price Range</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {venueHost.venues.items.map((venue) => (
                      <TableRow key={venue._id}>
                        <TableCell className="font-medium">{venue.name}</TableCell>
                        <TableCell>{venue.type ? formatVenueType(venue.type) : 'Unknown'}</TableCell>
                        <TableCell>{venue.location || 'Unknown'}</TableCell>
                        <TableCell>
                          <Badge className={
                            venue.approvalStatus === 'approved' ? "bg-green-100 text-green-800" : 
                            venue.approvalStatus === 'pending' ? "bg-yellow-100 text-yellow-800" : 
                            venue.approvalStatus === 'rejected' ? "bg-red-100 text-red-800" :
                            "bg-gray-100 text-gray-800"
                          }>
                            {venue.approvalStatus ? 
                              venue.approvalStatus.charAt(0).toUpperCase() + venue.approvalStatus.slice(1) : 
                              'Unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {venue.priceRange ? `${venue.priceRange.currency || 'LKR'} ${venue.priceRange.min || 0} - ${venue.priceRange.max || 0}` : 'Not specified'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/admin-dashboard/venues/detail/${venue._id}`)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500">This host doesn't have any venues yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          {/* Status Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <div className={`h-3 w-3 rounded-full mt-1.5 ${venueHost.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="font-medium">Account Status</div>
                  <div className={venueHost.isActive ? "text-green-600" : "text-red-600"}>
                    {venueHost.isActive ? 'Active' : 'Inactive'}
                  </div>
                  <p className="text-sm text-gray-500">
                    {venueHost.isActive 
                      ? 'This account is currently active and can submit venues.'
                      : 'This account is currently inactive and cannot submit venues.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle>Host Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Total Venues</div>
                  <div className="text-3xl font-bold">{venueHost.venues.count || 0}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500">Pending Approval</div>
                  <div className="text-3xl font-bold">
                    {venueHost.venues.items.filter(v => v.approvalStatus === 'pending').length}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500">Approved Venues</div>
                  <div className="text-3xl font-bold">
                    {venueHost.venues.items.filter(v => v.approvalStatus === 'approved').length}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-gray-500">Rejected Venues</div>
                  <div className="text-3xl font-bold">
                    {venueHost.venues.items.filter(v => v.approvalStatus === 'rejected').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminVenueHostDetailPage; 