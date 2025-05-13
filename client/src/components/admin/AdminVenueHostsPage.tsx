import React, { useState, useEffect } from 'react';
import { 
  BadgeCheck, 
  User, 
  Building, 
  Search, 
  MoreHorizontal, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  Shield,
  XCircle,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface VenueHost {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  companyName?: string;
  address?: string;
  location?: string;
  isVerified: boolean;
  isActive: boolean;
  totalVenues: number;
  createdAt: string;
  updatedAt: string;
}

const AdminVenueHostsPage: React.FC = () => {
  const [venueHosts, setVenueHosts] = useState<VenueHost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchVenueHosts = async () => {
      try {
        setIsLoading(true);
        // @ts-ignore - Ignoring type checking for API response
        const response = await api.get('/admin/venue-hosts');
        
        // @ts-ignore - Ignoring type checking for response data
        if (response.data?.success && response.data?.data?.venueHosts) {
          // @ts-ignore - Ignoring type checking for venueHosts array
          setVenueHosts(response.data.data.venueHosts);
        } else {
          throw new Error('Invalid response format from API');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
        setError(errorMessage);
        toast.error(`Error loading venue hosts: ${errorMessage}`);
        console.error('Error fetching venue hosts:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVenueHosts();
  }, []);
  
  const filteredHosts = venueHosts.filter(host => {
    const searchLower = searchTerm.toLowerCase();
    return (
      host.name.toLowerCase().includes(searchLower) ||
      host.email.toLowerCase().includes(searchLower) ||
      (host.companyName && host.companyName.toLowerCase().includes(searchLower)) ||
      (host.phone && host.phone.includes(searchTerm))
    );
  });
  
  const toggleHostStatus = async (hostId: string, currentStatus: boolean) => {
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      const response = await api.put(`/admin/venue-hosts/${hostId}/${action}`);
      
      if (response.data?.success) {
        // Update the local state
        setVenueHosts(prevHosts => 
          prevHosts.map(host => 
            host._id === hostId ? { ...host, isActive: !currentStatus } : host
          )
        );
        
        toast.success(`Venue host ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      } else {
        throw new Error(response.data?.message || 'Failed to update venue host status');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
      toast.error(`Error: ${errorMessage}`);
      console.error('Error updating venue host status:', err);
    }
  };
  
  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified 
      ? <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
      : <Badge variant="outline" className="bg-gray-100 text-gray-600">Unverified</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Error Loading Venue Hosts</h3>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Venue Hosts</h1>
          <p className="text-gray-500 mt-1">Manage venue hosts and their properties</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>All Venue Hosts ({venueHosts.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search venue hosts..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Host</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Venues</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredHosts.length > 0 ? (
                filteredHosts.map((host) => (
                  <TableRow key={host._id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <div className="font-medium">{host.name}</div>
                        <div className="text-sm text-gray-500">{host.companyName}</div>
                        {getVerificationBadge(host.isVerified)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        <div className="flex items-center text-sm">
                          <Mail className="h-3.5 w-3.5 mr-1 text-gray-500" />
                          <span>{host.email}</span>
                        </div>
                        {host.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3.5 w-3.5 mr-1 text-gray-500" />
                            <span>{host.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{host.totalVenues || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {host.location ? (
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                          <span>{host.location}</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(host.isActive)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        <span>{formatDate(host.createdAt)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate(`/admin-dashboard/venue-hosts/detail/${host._id}`)}>
                            <User className="mr-2 h-4 w-4" />
                            <span>View Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Building className="mr-2 h-4 w-4" />
                            <span>View Venues</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            <span>View Analytics</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {host.isActive ? (
                            <DropdownMenuItem onClick={() => toggleHostStatus(host._id, true)}>
                              <AlertTriangle className="mr-2 h-4 w-4 text-red-500" />
                              <span className="text-red-500">Deactivate</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => toggleHostStatus(host._id, false)}>
                              <BadgeCheck className="mr-2 h-4 w-4 text-green-500" />
                              <span className="text-green-500">Activate</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-gray-500">
                    No venue hosts found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminVenueHostsPage; 