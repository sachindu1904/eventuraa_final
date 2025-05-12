import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Tag, 
  ArrowLeft, 
  Loader2, 
  Star, 
  AlertTriangle,
  DollarSign,
  User,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ImageSlider from '@/components/ImageSlider';
import api from '@/utils/api-fetch';
import { toast } from '@/components/ui/sonner';

interface TicketType {
  name: string;
  price: number;
  quantity: number;
  available: number;
}

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
  category: string;
  eventType: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  ticketTypes: TicketType[];
  organizer: {
    _id: string;
    name?: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  featured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  coverImage?: string;
  images?: string[];
  ticketsAvailable?: number;
  ticketsSold?: number;
}

const AdminEventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        // Use the regular event endpoint instead of admin-specific
        const response = await api.get(`/events/${eventId}`);
        
        if (response.success) {
          setEvent(response.data.event);
        } else {
          setError(response.message || 'Failed to load event details');
          toast.error('Failed to load event details');
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('An error occurred while loading the event');
        toast.error('Failed to load event. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleFeatured = async () => {
    if (!event) return;
    
    setProcessingAction(true);
    try {
      const response = await api.patch(`/admin/events/${event._id}/featured`, {
        featured: !event.featured
      });
      
      if (response.success) {
        setEvent({
          ...event,
          featured: !event.featured
        });
        toast.success(`Event ${event.featured ? 'removed from' : 'marked as'} featured`);
      } else {
        throw new Error(response.message || 'Failed to update featured status');
      }
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred'}`);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleToggleActive = async () => {
    if (!event) return;
    
    setProcessingAction(true);
    try {
      const response = await api.patch(`/admin/events/${event._id}/status`, {
        isActive: !event.isActive
      });
      
      if (response.success) {
        setEvent({
          ...event,
          isActive: !event.isActive
        });
        toast.success(`Event ${event.isActive ? 'deactivated' : 'activated'} successfully`);
      } else {
        throw new Error(response.message || 'Failed to update event status');
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
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-16">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
        <p className="text-gray-600 mb-6">
          {error || "The event you're looking for doesn't exist or has been removed."}
        </p>
        <Button onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  const eventDate = new Date(event.date);
  const formattedDate = format(eventDate, 'MMMM d, yyyy');
  const formattedCreatedAt = format(new Date(event.createdAt), 'MMMM d, yyyy');
  const formattedUpdatedAt = format(new Date(event.updatedAt), 'MMMM d, yyyy');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
          
          <h1 className="text-2xl font-bold">{event.title}</h1>
          
          {event.featured && (
            <Badge className="bg-purple-100 text-purple-800">Featured</Badge>
          )}
          
          <Badge className={event.isActive 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
          }>
            {event.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            className={event.featured ? "text-amber-500 border-amber-500" : ""}
            onClick={handleToggleFeatured}
            disabled={processingAction}
          >
            <Star className="mr-2 h-4 w-4" />
            {event.featured ? 'Remove from Featured' : 'Mark as Featured'}
          </Button>
          
          <Button 
            variant={event.isActive ? "destructive" : "outline"} 
            onClick={handleToggleActive}
            disabled={processingAction}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            {event.isActive ? 'Deactivate Event' : 'Activate Event'}
          </Button>
          
          <Button asChild>
            <a href={`/event/${event._id}`} target="_blank" rel="noreferrer">
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
              <CardTitle>Event Images</CardTitle>
            </CardHeader>
            <CardContent>
              {event.images && event.images.length > 0 ? (
                <ImageSlider 
                  images={event.coverImage ? [event.coverImage, ...event.images] : event.images}
                  aspectRatio="16:9"
                  className="h-80"
                />
              ) : event.coverImage ? (
                <ImageSlider 
                  images={[event.coverImage]}
                  aspectRatio="16:9"
                  className="h-80"
                />
              ) : (
                <div className="w-full h-80 flex items-center justify-center bg-gray-200 rounded-lg">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Event Information */}
          <Tabs defaultValue="details">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tickets">Tickets</TabsTrigger>
              <TabsTrigger value="organizer">Organizer</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-4 pt-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Event Type</h3>
                        <p>{event.eventType}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Category</h3>
                        <p>{event.category}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                      <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-700">
                        <Calendar className="mr-2 h-5 w-5 text-gray-500" />
                        <span>Date: {formattedDate}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <Clock className="mr-2 h-5 w-5 text-gray-500" />
                        <span>Time: {event.time}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-700">
                        <MapPin className="mr-2 h-5 w-5 text-gray-500" />
                        <span>
                          Location: {event.location.name}, {event.location.address}, {event.location.city}, {event.location.district}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="tickets" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {event.ticketTypes && event.ticketTypes.length > 0 ? (
                    <div className="space-y-4">
                      {event.ticketTypes.map((ticket, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium">{ticket.name}</h3>
                              <p className="text-sm text-gray-500">
                                {ticket.available} of {ticket.quantity} tickets available
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">LKR {ticket.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Tickets:</span>
                          <span>
                            {event.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium">Tickets Available:</span>
                          <span>
                            {event.ticketTypes.reduce((sum, ticket) => sum + ticket.available, 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="font-medium">Tickets Sold:</span>
                          <span>
                            {event.ticketTypes.reduce((sum, ticket) => sum + (ticket.quantity - ticket.available), 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 py-4">No tickets available for this event.</p>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Sales Analytics</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <Button asChild className="w-full">
                    <a href={`/admin-dashboard/analytics?event=${event._id}`}>
                      <BarChart className="mr-2 h-4 w-4" />
                      View Detailed Sales Analytics
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="organizer" className="space-y-4 pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Organizer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center text-gray-700">
                      <User className="mr-2 h-5 w-5 text-gray-500" />
                      <span>Organizer: {event.organizer?.companyName || 'Unknown'}</span>
                    </div>
                    
                    {event.organizer?.email && (
                      <div className="flex items-center text-gray-700">
                        <span className="mr-2">📧</span>
                        <span>Email: {event.organizer.email}</span>
                      </div>
                    )}
                    
                    {event.organizer?.phone && (
                      <div className="flex items-center text-gray-700">
                        <span className="mr-2">📞</span>
                        <span>Phone: {event.organizer.phone}</span>
                      </div>
                    )}
                    
                    <Button asChild variant="outline" className="mt-4">
                      <a href={`/admin-dashboard/organizers/${event.organizer?._id}`}>
                        View Organizer Details
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Event Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className={event.isActive 
                    ? "bg-green-100 text-green-800" 
                    : "bg-gray-100 text-gray-800"
                  }>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Featured:</span>
                  <Badge className={event.featured 
                    ? "bg-purple-100 text-purple-800" 
                    : "bg-gray-100 text-gray-800"
                  }>
                    {event.featured ? 'Featured' : 'Not Featured'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Approval Status:</span>
                  <Badge className={
                    event.approvalStatus === 'approved' ? "bg-green-100 text-green-800" :
                    event.approvalStatus === 'pending' ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }>
                    {event.approvalStatus.charAt(0).toUpperCase() + event.approvalStatus.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Event Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h3 className="font-medium text-gray-500">Event ID:</h3>
                  <p className="font-mono">{event._id}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Created At:</h3>
                  <p>{formattedCreatedAt}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-500">Last Updated:</h3>
                  <p>{formattedUpdatedAt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant={event.featured ? "destructive" : "default"}
                className="w-full"
                onClick={handleToggleFeatured}
                disabled={processingAction}
              >
                <Star className="mr-2 h-4 w-4" />
                {event.featured ? 'Remove from Featured' : 'Mark as Featured'}
              </Button>
              
              <Button 
                variant={event.isActive ? "destructive" : "outline"} 
                className="w-full"
                onClick={handleToggleActive}
                disabled={processingAction}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {event.isActive ? 'Deactivate Event' : 'Activate Event'}
              </Button>
              
              <Button asChild className="w-full">
                <a href={`/event/${event._id}`} target="_blank" rel="noreferrer">
                  View on Site
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminEventDetailPage; 