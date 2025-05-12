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
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

interface Venue {
  _id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  imageUrl?: string;
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
    navigate(`/venue-host/edit-venue/${venueId}`);
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
            <h2 className="text-xl font-bold text-gray-800">Venue Host Portal</h2>
            <p className="text-sm text-gray-500 mt-1 truncate">
              {venueHost?.venueName || 'My Venue'}
            </p>
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
          <h2 className="text-xl font-bold text-gray-800">Venue Host Portal</h2>
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
                  
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
                    <Calendar className="h-6 w-6" />
                    <span>Manage Bookings</span>
                  </Button>
                  
                  <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2">
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
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-800">My Venues</h1>
                <Button onClick={handleAddNewVenue}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Venue
                </Button>
              </div>
              
              {venues.length === 0 ? (
                <Card className="bg-gray-50 border border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Home className="h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700">No Venues Yet</h3>
                    <p className="text-gray-500 mb-4 text-center max-w-md">
                      You haven't added any venues yet. Click the button below to create your first venue listing.
                    </p>
                    <Button onClick={handleAddNewVenue}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Venue
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {venues.map((venue) => (
                    <Card key={venue._id} className="overflow-hidden">
                      <div className="h-40 bg-gray-200 relative">
                        {venue.imageUrl ? (
                          <img 
                            src={venue.imageUrl} 
                            alt={venue.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Image className="h-10 w-10 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="bg-white h-8 w-8 rounded-full"
                            onClick={() => handleEditVenue(venue._id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="bg-white h-8 w-8 rounded-full text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteVenue(venue._id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg truncate">{venue.name}</h3>
                        <div className="flex items-center text-gray-500 text-sm space-x-2 mt-1">
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                            {venue.type}
                          </span>
                          <span>•</span>
                          <span>{venue.location}</span>
                        </div>
                        <p className="text-gray-600 mt-2 text-sm line-clamp-2">
                          {venue.description || 'No description provided.'}
                        </p>
                        <div className="mt-4 flex justify-end">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/venues/${venue._id}`)}>
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
              <Card>
                <CardContent className="py-10 flex flex-col items-center justify-center">
                  <Calendar className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No Bookings Yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    You have no bookings yet. They will appear here once customers start booking your venues.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-800">Account Settings</h1>
              <Card>
                <CardHeader>
                  <CardTitle>Venue Information</CardTitle>
                  <CardDescription>Update your venue's details and contact information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-md font-medium">Business Details</h3>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                        <div>
                          <p className="text-sm text-gray-500">Venue Name</p>
                          <p className="text-sm font-medium">{venueHost?.venueName || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Venue Type</p>
                          <p className="text-sm font-medium">{venueHost?.venueType || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="text-sm font-medium">{venueHost?.venueLocation || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contact Email</p>
                          <p className="text-sm font-medium">{venueHost?.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="text-sm font-medium">{venueHost?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button>Edit Profile</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {(activeTab === 'customers' || activeTab === 'payments') && (
            <div className="space-y-6">
              <h1 className="text-2xl font-bold text-gray-800">
                {activeTab === 'customers' ? 'Customers' : 'Payments'}
              </h1>
              <Card>
                <CardContent className="py-10 flex flex-col items-center justify-center">
                  {activeTab === 'customers' ? (
                    <Users className="h-12 w-12 text-gray-400 mb-4" />
                  ) : (
                    <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                  )}
                  <h3 className="text-lg font-medium text-gray-700">No Data Yet</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    {activeTab === 'customers' 
                      ? 'You have no customers yet. They will appear here once you receive bookings.'
                      : 'You have no payment records yet. They will appear here once you receive bookings.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenueHostPortal; 