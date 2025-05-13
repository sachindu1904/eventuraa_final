import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MoreHorizontal, 
  Building,
  ExternalLink,
  Eye,
  Edit,
  Star,
  MapPin,
  DollarSign,
  Tag,
  User,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';
import { toast } from '@/components/ui/sonner';

interface Venue {
  _id: string;
  name: string;
  description: string;
  type: string;
  location: string;
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  owner: {
    _id: string;
    name?: string;
    companyName?: string;
  };
}

const AdminVenuesPage: React.FC = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setIsLoading(true);
        // @ts-ignore - Ignoring type checking for API response
        const response = await api.get('/admin/venues');
        
        // @ts-ignore - Ignoring type checking for response data
        if (response.data?.success && response.data?.data?.venues) {
          // @ts-ignore - Ignoring type checking for venues array
          const approvedVenues = response.data.data.venues.filter(
            (venue: Venue) => venue.isActive
          );
          setVenues(approvedVenues);
        } else {
          throw new Error('Invalid response format from API');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
        setError(errorMessage);
        toast.error(`Error loading venues: ${errorMessage}`);
        console.error('Error fetching venues:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchVenues();
  }, []);

  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const getFeaturedBadge = (featured: boolean) => {
    return featured 
      ? <Badge className="bg-purple-100 text-purple-800">Featured</Badge>
      : null;
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Error Loading Venues</h3>
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Approved Venues</h1>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Venues ({venues.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search venues..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price Range</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVenues.length > 0 ? (
                filteredVenues.map((venue) => (
                  <TableRow key={venue._id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{venue.name}</span>
                        {getFeaturedBadge(venue.featured)}
                      </div>
                    </TableCell>
                    <TableCell>{venue.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                        {venue.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      {venue.priceRange ? (
                        <div className="flex items-center">
                          LKR {venue.priceRange.min} - {venue.priceRange.max}
                        </div>
                      ) : (
                        <span className="text-gray-500">Not specified</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1 text-gray-500" />
                        {venue.owner?.name || venue.owner?.companyName || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(venue.isActive)}</TableCell>
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
                          <DropdownMenuItem asChild>
                            <Link to={`/admin-dashboard/venues/detail/${venue._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Venue</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/venues/${venue._id}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <span>View on Site</span>
                            </a>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-gray-500">No venues found</p>
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

export default AdminVenuesPage; 