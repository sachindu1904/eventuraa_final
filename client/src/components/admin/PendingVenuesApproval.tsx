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
import { Loader2, Check, X, AlertTriangle, Building, MapPin, User } from 'lucide-react';

interface Venue {
  _id: string;
  name: string;
  description: string;
  type: string;
  location: string;
  address?: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  capacity?: {
    min: number;
    max: number;
  };
  owner?: {
    _id: string;
    name: string;
    email: string;
  };
  facilities?: string[];
  amenities?: string[];
  createdAt: string;
}

const PendingVenuesApproval: React.FC = () => {
  const [pendingVenues, setPendingVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingVenueId, setProcessingVenueId] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchPendingVenues = async () => {
      setLoading(true);
      try {
        // @ts-ignore - Ignoring type checking for API response
        const response = await api.get('/admin/venues/pending');
        // @ts-ignore - Ignoring type checking for response data
        if (response.success && response.data && response.data.venues) {
          // @ts-ignore - Ignoring type checking for venues array
          setPendingVenues(response.data.venues);
        } else {
          setError('Failed to fetch pending venues');
        }
      } catch (error) {
        console.error('Error fetching pending venues:', error);
        setError('An error occurred while fetching pending venues');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingVenues();
  }, [refreshKey]);

  const handleApproveVenue = async (venueId: string) => {
    try {
      setProcessingVenueId(venueId);
      const response = await api.put(`/admin/venues/${venueId}/approve`);
      if (response.success) {
        toast.success('Venue approved successfully');
        setPendingVenues(venues => venues.filter(venue => venue._id !== venueId));
      } else {
        toast.error('Failed to approve venue');
      }
    } catch (error) {
      console.error('Error approving venue:', error);
      toast.error('An error occurred while approving the venue');
    } finally {
      setProcessingVenueId(null);
    }
  };

  const openRejectDialog = (venue: Venue) => {
    setSelectedVenue(venue);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectVenue = async () => {
    if (!selectedVenue) return;
    
    try {
      setProcessingVenueId(selectedVenue._id);
      const response = await api.put(`/admin/venues/${selectedVenue._id}/reject`, {
        rejectionReason
      });
      
      if (response.success) {
        toast.success('Venue rejected successfully');
        setRejectDialogOpen(false);
        setPendingVenues(venues => venues.filter(venue => venue._id !== selectedVenue._id));
      } else {
        toast.error('Failed to reject venue');
      }
    } catch (error) {
      console.error('Error rejecting venue:', error);
      toast.error('An error occurred while rejecting the venue');
    } finally {
      setProcessingVenueId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading pending venues...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pending Venues</h2>
          <p className="text-gray-500">Review and approve venues submitted by venue hosts</p>
        </div>
        <Button onClick={() => setRefreshKey(prevKey => prevKey + 1)} variant="outline">Refresh</Button>
      </div>

      {pendingVenues.length === 0 ? (
        <div className="bg-gray-50 border rounded-lg p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-2 text-lg font-semibold">No pending venues</h3>
          <p className="mt-1 text-gray-500">All venues have been reviewed!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pendingVenues.map(venue => (
            <Card key={venue._id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending Approval
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {venue.createdAt ? new Date(venue.createdAt).toLocaleDateString() : 'Unknown date'}
                  </span>
                </div>
                <CardTitle className="mt-2 text-xl truncate">{venue.name}</CardTitle>
                <CardDescription className="flex items-center mt-1">
                  <Building className="h-4 w-4 mr-1" /> {venue.type}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {venue.address?.city}, {venue.address?.district || venue.location}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <User className="h-4 w-4 mr-2 text-gray-500" />
                    <span>
                      {venue.owner?.name || 'Unknown owner'}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {venue.facilities && venue.facilities.slice(0, 3).map((facility, index) => (
                      <Badge key={index} variant="secondary">{facility}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                    {venue.description}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-2 flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => openRejectDialog(venue)}
                  disabled={!!processingVenueId}
                >
                  {processingVenueId === venue._id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <X className="h-4 w-4 mr-2 text-red-500" />
                  )}
                  Reject
                </Button>
                <Button 
                  onClick={() => handleApproveVenue(venue._id)}
                  disabled={!!processingVenueId}
                >
                  {processingVenueId === venue._id ? (
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
            <DialogTitle>Reject Venue</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this venue. This will be sent to the venue host.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVenue && (
            <div className="py-2">
              <h4 className="font-medium">{selectedVenue.name}</h4>
              <p className="text-sm text-gray-500">by {selectedVenue.owner?.name || 'Unknown Host'}</p>
            </div>
          )}
          
          <div className="py-2">
            <Label htmlFor="reason">Rejection Reason</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this venue is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={handleRejectVenue}
              disabled={!rejectionReason.trim() || !!processingVenueId}
            >
              {processingVenueId === selectedVenue?._id ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Reject Venue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingVenuesApproval; 