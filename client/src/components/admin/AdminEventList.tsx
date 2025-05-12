import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin, Tag } from 'lucide-react';
import { format } from 'date-fns';
import api from '@/utils/api-fetch';
import { toast } from '@/components/ui/sonner';
import ImageSlider from '@/components/ImageSlider';
import EventPreview from './EventPreview';

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
  ticketPrice: number;
  ticketsAvailable: number;
  images: string[];
  coverImage: string;
  organizer: {
    _id: string;
    companyName: string;
  };
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

const AdminEventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/events');
        if (response.success) {
          setEvents(response.data.events);
        } else {
          setError(response.message);
          toast.error(response.message);
        }
      } catch (error: any) {
        console.error('Failed to fetch events:', error);
        setError(error.message || 'Failed to fetch events');
        toast.error(error.message || 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Filter events by status
  const approvedEvents = events.filter(event => event.approvalStatus === 'approved');
  const rejectedEvents = events.filter(event => event.approvalStatus === 'rejected');
  const pendingEvents = events.filter(event => event.approvalStatus === 'pending');

  // Format date
  const formatEventDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'PPP');
    } catch (error) {
      return dateString;
    }
  };

  // Dummy functions for event preview (replace with actual implementations)
  const handleApprove = async (eventId: string) => {
    try {
      const response = await api.put(`/admin/events/${eventId}/approve`);
      if (response.success) {
        toast.success('Event approved successfully');
        // Update the local state to reflect the change
        setEvents(events.map(event => 
          event._id === eventId 
            ? { ...event, approvalStatus: 'approved' } 
            : event
        ));
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Failed to approve event:', error);
      toast.error(error.message || 'Failed to approve event');
    }
  };

  const handleReject = async (eventId: string, reason: string) => {
    try {
      const response = await api.put(`/admin/events/${eventId}/reject`, { rejectionReason: reason });
      if (response.success) {
        toast.success('Event rejected successfully');
        // Update the local state to reflect the change
        setEvents(events.map(event => 
          event._id === eventId 
            ? { ...event, approvalStatus: 'rejected', rejectionReason: reason } 
            : event
        ));
      } else {
        toast.error(response.message);
      }
    } catch (error: any) {
      console.error('Failed to reject event:', error);
      toast.error(error.message || 'Failed to reject event');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading events...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">Error: {error}</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">All Events ({events.length})</h2>
        <div className="flex space-x-2 mb-4">
          <Badge className="bg-green-500">{approvedEvents.length} Approved</Badge>
          <Badge className="bg-red-500">{rejectedEvents.length} Rejected</Badge>
          <Badge variant="outline">{pendingEvents.length} Pending</Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map(event => (
            <Card key={event._id} className="overflow-hidden">
              <div className="h-48 overflow-hidden">
                {event.coverImage || (event.images && event.images.length > 0) ? (
                  <ImageSlider 
                    images={[
                      ...(event.coverImage ? [event.coverImage] : []),
                      ...(event.images || [])
                    ].filter(Boolean)}
                    aspectRatio="16:9"
                    showThumbnails={false}
                  />
                ) : (
                  <div className="h-full bg-gray-200 flex items-center justify-center">
                    <p className="text-gray-500">No image available</p>
                  </div>
                )}
              </div>
              
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg line-clamp-1">{event.title}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {event.organizer.companyName}
                    </CardDescription>
                  </div>
                  <Badge 
                    className={
                      event.approvalStatus === 'approved' ? 'bg-green-500' :
                      event.approvalStatus === 'rejected' ? 'bg-red-500' : 
                      'bg-gray-500'
                    }
                  >
                    {event.approvalStatus}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0 pb-2 space-y-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>{formatEventDate(event.date)}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="line-clamp-1">{event.location.name}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-500">
                  <Tag className="h-4 w-4 mr-1" />
                  <span>{event.category}</span>
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-2 flex justify-end">
                <EventPreview 
                  event={event} 
                  onApprove={handleApprove} 
                  onReject={handleReject} 
                />
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {events.length === 0 && (
          <div className="text-center p-8 border rounded-md">
            <p className="text-gray-500">No events found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEventList; 