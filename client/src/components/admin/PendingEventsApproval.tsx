import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Check, X, AlertTriangle, Calendar, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location?: {
    name: string;
    address: string;
    city: string;
    district: string;
  };
  category: string;
  eventType: string;
  ticketPrice: number;
  organizer?: {
    _id: string;
    companyName: string;
    email: string;
  };
  createdAt: string;
}

const PendingEventsApproval: React.FC = () => {
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPendingEvents = async () => {
      setLoading(true);
      try {
        const response = await api.get('/admin/events/pending');
        if (response.success) {
          setPendingEvents(response.data.events);
        } else {
          setError('Failed to fetch pending events');
        }
      } catch (error) {
        console.error('Error fetching pending events:', error);
        setError('An error occurred while fetching pending events');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingEvents();
  }, [refreshKey]);

  const handleApproveEvent = async (eventId: string) => {
    try {
      setProcessingEventId(eventId);
      const response = await api.put(`/admin/events/${eventId}/approve`);
      if (response.success) {
        toast.success('Event approved successfully');
        setPendingEvents(events => events.filter(event => event._id !== eventId));
      } else {
        toast.error('Failed to approve event');
      }
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('An error occurred while approving the event');
    } finally {
      setProcessingEventId(null);
    }
  };

  const openRejectDialog = (event: Event) => {
    setSelectedEvent(event);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectEvent = async () => {
    if (!selectedEvent) return;
    
    try {
      setProcessingEventId(selectedEvent._id);
      const response = await api.put(`/admin/events/${selectedEvent._id}/reject`, {
        rejectionReason
      });
      
      if (response.success) {
        toast.success('Event rejected successfully');
        setRejectDialogOpen(false);
        setPendingEvents(events => events.filter(event => event._id !== selectedEvent._id));
      } else {
        toast.error('Failed to reject event');
      }
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('An error occurred while rejecting the event');
    } finally {
      setProcessingEventId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading pending events...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pending Events</h2>
          <p className="text-gray-500">Review and approve events created by organizers</p>
        </div>
        <Button onClick={() => setRefreshKey(prevKey => prevKey + 1)} variant="outline">Refresh</Button>
      </div>

      {pendingEvents.length === 0 ? (
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-2 text-lg font-semibold">No pending events</h3>
          <p className="mt-1 text-gray-500">All events have been reviewed!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingEvents.map(event => (
            <Card key={event._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending Approval
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {event.createdAt ? new Date(event.createdAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                <CardTitle className="mt-2 text-xl truncate">{event.title}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  By {event.organizer?.companyName || 'Unknown Organizer'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {event.date ? new Date(event.date).toLocaleDateString() : 'Unknown date'} {event.time ? `at ${event.time}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span className="truncate">
                      {event.location?.name || 'Unknown location'}{event.location?.city ? `, ${event.location.city}` : ''}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">{event.category}</Badge>
                    <Badge variant="outline">{event.eventType}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {event.description}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => openRejectDialog(event)}
                  disabled={!!processingEventId}
                >
                  {processingEventId === event._id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2 text-red-500" />
                  )}
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApproveEvent(event._id)}
                  disabled={!!processingEventId}
                >
                  {processingEventId === event._id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Event</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this event. This will be sent to the organizer.
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="py-2">
              <h4 className="font-medium">{selectedEvent.title}</h4>
              <p className="text-sm text-gray-500">by {selectedEvent.organizer?.companyName || 'Unknown Organizer'}</p>
            </div>
          )}
          
          <div className="py-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this event is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
            />
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setRejectDialogOpen(false)}
              disabled={!!processingEventId}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectEvent}
              disabled={!rejectionReason.trim() || !!processingEventId}
            >
              {processingEventId ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Reject Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingEventsApproval; 