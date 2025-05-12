import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Calendar, Plus, Search, MoreVertical, Edit, Trash, BarChart, Eye, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

// Define Event interface
interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  location: {
    name: string;
    city: string;
  };
  approvalStatus: 'pending' | 'approved' | 'rejected';
  ticketsSold?: number;
  ticketsAvailable?: number;
  isActive: boolean;
  createdAt: string;
}

const EventsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch events from the server
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await api.get('/organizer/events');
        if (response.success) {
          setEvents(response.data.events);
        } else {
          setError('Failed to fetch events: ' + response.message);
          toast.error('Failed to fetch events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('An error occurred while fetching events');
        toast.error('Failed to load events. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);
  
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.location?.name?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false) ||
    (event.location?.city?.toLowerCase()?.includes(searchTerm.toLowerCase()) || false)
  );
  
  const getStatusBadge = (event: Event) => {
    // First check approval status
    switch(event.approvalStatus) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending Approval</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
    }
    
    // If approved, check the event status based on date
    if (!event.isActive) {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    
    const eventDate = new Date(event.date);
    const now = new Date();
    
    if (eventDate > now) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Upcoming</Badge>;
    } else if (eventDate.toDateString() === now.toDateString()) {
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Today</Badge>;
    } else {
      return <Badge variant="outline" className="bg-gray-100 text-gray-800">Past</Badge>;
    }
  };
  
  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (confirm(`Are you sure you want to delete "${eventTitle}"?`)) {
      try {
        // In a real app, you'd implement the delete API endpoint
        const response = await api.delete(`/organizer/events/${eventId}`);
        if (response.success) {
          toast.success(`Event "${eventTitle}" has been deleted`);
          // Remove from local state
          setEvents(events.filter(event => event._id !== eventId));
        } else {
          toast.error(`Failed to delete event: ${response.message}`);
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        toast.error('An error occurred while deleting the event');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading events...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Events</h1>
          <p className="text-gray-600">Manage your events and ticket sales</p>
        </div>
        <Link to="/organizer-portal/events/new">
          <Button className="bg-[#7E69AB] hover:bg-[#6E59A5]">
            <Plus size={16} className="mr-2" />
            Create Event
          </Button>
        </Link>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input 
            placeholder="Search events..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar size={16} className="mr-2" />
            Filter by Date
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ticket Sales</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  {error ? (
                    <div>
                      <p className="text-red-500 mb-2">{error}</p>
                      <Button variant="outline" onClick={() => window.location.reload()}>Refresh</Button>
                    </div>
                  ) : (
                    'No events found. Create your first event!'
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => (
                <TableRow key={event._id}>
                  <TableCell className="font-medium">{event.title}</TableCell>
                  <TableCell>{new Date(event.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {event.location?.name || ''}{event.location?.city ? `, ${event.location.city}` : ''}
                  </TableCell>
                  <TableCell>{getStatusBadge(event)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {event.ticketsAvailable ? (
                        <>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-[#7E69AB] h-2 rounded-full" 
                              style={{ 
                                width: `${Math.round(((event.ticketsSold || 0) / event.ticketsAvailable) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {event.ticketsSold || 0}/{event.ticketsAvailable}
                          </span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">No tickets</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {event.approvalStatus === 'approved' ? (
                          <>
                            <DropdownMenuItem asChild>
                              <Link to={`/organizer-portal/events/${event._id}/edit`} className="cursor-pointer flex items-center">
                                <Edit size={16} className="mr-2" /> Edit Event
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/events/${event._id}`} className="cursor-pointer flex items-center">
                                <Eye size={16} className="mr-2" /> Preview
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/organizer-portal/analytics?event=${event._id}`} className="cursor-pointer flex items-center">
                                <BarChart size={16} className="mr-2" /> View Sales
                              </Link>
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem disabled className="text-gray-400">
                            <Edit size={16} className="mr-2" /> Awaiting Approval
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600 cursor-pointer flex items-center"
                          onClick={() => handleDelete(event._id, event.title)}
                        >
                          <Trash size={16} className="mr-2" /> Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default EventsList;
