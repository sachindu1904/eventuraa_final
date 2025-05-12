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
  Calendar,
  ExternalLink,
  Eye,
  Edit,
  Star,
  AlertTriangle,
  XCircle,
  Clock,
  DollarSign,
  MapPin,
  Tag,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';
import { toast } from '@/components/ui/sonner';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: {
    name: string;
    address: string;
    city: string;
    district: string;
  };
  eventType: string;
  category: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  ticketPrice: number;
  ticketsAvailable: number;
  ticketsSold: number;
  organizer: {
    _id: string;
    name?: string;
    companyName?: string;
  };
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  coverImage?: string;
}

const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/admin/events');
        
        // Check if the response has the expected structure
        if (response.data?.success && response.data?.data?.events) {
          // Filter only approved events
          const approvedEvents = response.data.data.events.filter(
            (event: Event) => event.approvalStatus === 'approved'
          );
          setEvents(approvedEvents);
        } else {
          throw new Error('Invalid response format from API');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
        setError(errorMessage);
        toast.error(`Error loading events: ${errorMessage}`);
        console.error('Error fetching events:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.eventType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
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
        <h3 className="text-lg font-medium text-gray-900">Error Loading Events</h3>
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
        <h1 className="text-2xl font-bold">Approved Events</h1>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>Events ({events.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search events..."
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
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Ticket Price</TableHead>
                <TableHead>Tickets Sold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <TableRow key={event._id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{event.title}</span>
                        {getFeaturedBadge(event.featured)}
                      </div>
                    </TableCell>
                    <TableCell>{event.eventType}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        {formatDate(event.date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-gray-500" />
                        {event.location.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        LKR{event.ticketPrice}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.ticketsSold} / {event.ticketsAvailable}
                    </TableCell>
                    <TableCell>{getStatusBadge(event.isActive)}</TableCell>
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
                            <Link to={`/admin-dashboard/events/detail/${event._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit Event</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <a href={`/event/${event._id}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              <span>View on Site</span>
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <User className="mr-2 h-4 w-4" />
                            <span>View Organizer</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Star className="mr-2 h-4 w-4 text-amber-500" />
                            <span>{event.featured ? 'Remove from Featured' : 'Mark as Featured'}</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem className={event.isActive ? 'text-red-600' : 'text-green-600'}>
                            {event.isActive ? (
                              <>
                                <AlertTriangle className="mr-2 h-4 w-4" />
                                <span>Deactivate Event</span>
                              </>
                            ) : (
                              <>
                                <Clock className="mr-2 h-4 w-4" />
                                <span>Activate Event</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="h-10 w-10 mb-2" />
                      <h3 className="text-lg font-medium">No events found</h3>
                      <p className="text-sm">Try adjusting your search query</p>
                    </div>
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

export default AdminEventsPage; 