import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Home,
  Calendar,
  Settings,
  CreditCard,
  Users,
  LogOut,
  Plus,
  Edit,
  Trash,
  Image,
  AlertTriangle,
  User,
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';
import VenueHostSettings from '@/components/venuehost/VenueHostSettings';
import BookingsList from '@/components/BookingsList';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  approvalStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
}

const VenueHostPortal: React.FC = () => {
  const navigate = useNavigate();
  const [venueHost, setVenueHost] = useState<any>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          toast.error('Please login to access your portal');
          navigate('/signin');
          return;
        }

        // Check if user type is venue-host
        const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
        if (userType !== 'venue-host') {
          toast.error('Unauthorized access');
          navigate('/');
          return;
        }

        // Fetch venue host data
        const response = await api.get('/venue-host/profile');
        
        if (response.success) {
          setVenueHost(response.data.venueHost);
          
          // Fetch venues owned by this venue host
          const venuesResponse = await api.get('/venues/my-venues');
          if (venuesResponse.success) {
            setVenues(venuesResponse.data.venues || []);
          }
        } else {
          toast.error('Failed to load profile data');
          navigate('/signin');
        }
      } catch (error) {
        console.error('Error fetching venue host data:', error);
        toast.error('Session expired. Please login again');
        navigate('/signin');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('user');
    
    toast.success('Logged out successfully');
    navigate('/signin');
  };

  const handleAddNewVenue = () => {
    navigate('/venue-host/add-venue');
  };

  const handleEditVenue = (venueId: string) => {
    navigate(`/venues/${venueId}?edit=true`);
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (window.confirm('Are you sure you want to delete this venue?')) {
      try {
        const response = await api.delete(`/venues/${venueId}`);
        if (response.success) {
          setVenues(venues.filter(venue => venue._id !== venueId));
          toast.success('Venue deleted successfully');
        } else {
          toast.error(response.message || 'Failed to delete venue');
        }
      } catch (error) {
        console.error('Error deleting venue:', error);
        toast.error('An error occurred while deleting the venue');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {venueHost?.profileImage ? (
                  <img 
                    src={venueHost.profileImage} 
                    alt={venueHost?.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="overflow-hidden">
                <h2 className="text-xl font-bold text-gray-800 truncate">Venue Host Portal</h2>
                <p className="text-sm text-gray-500 truncate">
                  {venueHost?.venueName || 'My Venue'}
                </p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            <Button 
              variant={activeTab === 'dashboard' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            
            <Button 
              variant={activeTab === 'venues' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('venues')}
            >
              <Home className="mr-2 h-4 w-4" />
              My Venues
              {venues.filter(venue => venue.approvalStatus === 'pending').length > 0 && (
                <span className="ml-auto bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                  {venues.filter(venue => venue.approvalStatus === 'pending').length}
                </span>
              )}
            </Button>
            
            <Button 
              variant={activeTab === 'bookings' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('bookings')}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Bookings
            </Button>
            
            <Button 
              variant={activeTab === 'customers' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('customers')}
            >
              <Users className="mr-2 h-4 w-4" />
              Customers
            </Button>
            
            <Button 
              variant={activeTab === 'payments' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('payments')}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Payments
            </Button>
            
            <Button 
              variant={activeTab === 'settings' ? 'default' : 'ghost'} 
              className="w-full justify-start" 
              onClick={() => setActiveTab('settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </nav>
          
          <div className="p-4 border-t">
            <Button 
              variant="outline" 
              className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="md:hidden bg-white p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {venueHost?.profileImage ? (
                <img 
                  src={venueHost.profileImage} 
                  alt={venueHost?.name || 'Profile'} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800">Venue Host Portal</h2>
          </div>
          <Button variant="outline" size="icon" onClick={() => handleLogout()}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content based on active tab */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {venueHost?.name}</h1>
              
              <div className="grid gap-6 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Venues</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{venues.length}</div>
                    <p className="text-xs text-gray-500 mt-1">Active properties</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Bookings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">0</div>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rs 0</div>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Manage your venues and bookings</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2" onClick={handleAddNewVenue}>
                    <Plus className="h-6 w-6" />
                    <span>Add New Venue</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => setActiveTab('bookings')}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>Manage Bookings</span>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center justify-center gap-2"
                    onClick={() => setActiveTab('settings')}
                  >
                    <Settings className="h-6 w-6" />
                    <span>Update Profile</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <CreditCard className="h-6 w-6" />
                    <span>Payment Settings</span>
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'venues' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">My Venues</h2>
                <Button onClick={handleAddNewVenue}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Venue
                </Button>
              </div>

              {venues.filter(venue => venue.approvalStatus === 'pending').length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6">
                  <h3 className="text-amber-800 font-medium flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Pending Approval
                  </h3>
                  <p className="text-amber-700 mt-1">
                    You have {venues.filter(venue => venue.approvalStatus === 'pending').length} venue(s) waiting for admin approval. 
                    Once approved, they will be visible to all users.
                  </p>
                </div>
              )}

              {venues.filter(venue => venue.approvalStatus === 'rejected').length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <h3 className="text-red-800 font-medium flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Rejected Venues
                  </h3>
                  <p className="text-red-700 mt-1">
                    Some of your venues were rejected. Please review the feedback and make necessary changes.
                  </p>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {venues.length > 0 ? (
                  venues.map((venue) => (
                    <Card key={venue._id} className="overflow-hidden">
                      <div className="h-40 bg-gray-200 relative">
                        {venue.images && venue.images.length > 0 ? (
                          <img 
                            src={venue.images[0].url} 
                            alt={venue.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : venue.imageUrl ? (
                          <img 
                            src={venue.imageUrl} 
                            alt={venue.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full bg-gray-100">
                            <Image className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className={`absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-medium 
                          ${venue.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' : 
                            venue.approvalStatus === 'pending' ? 'bg-amber-100 text-amber-800' : 
                            'bg-red-100 text-red-800'}`}
                        >
                          {venue.approvalStatus === 'approved' ? 'Approved' : 
                            venue.approvalStatus === 'pending' ? 'Pending Approval' : 
                            'Rejected'}
                        </div>
                      </div>
                      
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg mb-1 truncate">{venue.name}</h3>
                        <p className="text-gray-500 text-sm mb-3">{venue.type} in {venue.location}</p>
                        
                        {venue.approvalStatus === 'rejected' && venue.rejectionReason && (
                          <div className="bg-red-50 p-2 rounded mb-3 text-sm text-red-800">
                            <p className="font-semibold">Reason for rejection:</p>
                            <p>{venue.rejectionReason}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleEditVenue(venue._id)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleDeleteVenue(venue._id)}
                          >
                            <Trash className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12 bg-white rounded-lg shadow-sm">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Venues Found</h3>
                    <p className="mt-1 text-gray-500">You haven't added any venues yet.</p>
                    <Button className="mt-4" onClick={handleAddNewVenue}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Your First Venue
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Bookings</h2>
                <div className="flex gap-2">
                  <Select defaultValue="all" onValueChange={(value) => console.log('Selected venue:', value)}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="All Venues" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Venues</SelectItem>
                      {venues.map(venue => (
                        <SelectItem key={venue._id} value={venue._id}>{venue.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <BookingsList />
            </div>
          )}
          
          {activeTab === 'customers' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
              <p className="text-gray-600 mt-2">Manage your customers and their information.</p>
              {/* Customer management UI would go here */}
            </div>
          )}
          
          {activeTab === 'payments' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800">Payments</h2>
              <p className="text-gray-600 mt-2">View payment history and manage your payment settings.</p>
              {/* Payment management UI would go here */}
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
              <VenueHostSettings venueHost={venueHost} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueHostPortal; 