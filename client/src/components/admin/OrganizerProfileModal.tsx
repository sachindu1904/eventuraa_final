import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  Building2, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Globe, 
  CalendarClock, 
  Check, 
  XCircle,
  UserX
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/components/ui/sonner';

interface OrganizerProfileProps {
  organizerId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

interface OrganizerDetails {
  _id: string;
  companyName: string;
  email: string;
  phone?: string;
  logo?: string;
  website?: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country?: string;
  };
  isActive: boolean;
  createdAt: string;
  verificationStatus?: string;
  events?: {
    count: number;
    recent: Array<{
      _id: string;
      title: string;
      description: string;
      date: string;
      location: {
        venue: string;
        city: string;
      };
      ticketsSold?: number;
      approvalStatus: string;
    }>;
  };
}

const OrganizerProfileModal: React.FC<OrganizerProfileProps> = ({ 
  organizerId, 
  isOpen, 
  onClose,
  onStatusChange
}) => {
  const [organizerDetails, setOrganizerDetails] = useState<OrganizerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchOrganizerDetails = async () => {
      if (!isOpen || !organizerId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get(`/admin/organizers/${organizerId}`);
        
        if (response.data?.success && response.data?.data?.organizer) {
          setOrganizerDetails(response.data.data.organizer);
        } else {
          throw new Error('Failed to fetch organizer details');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizerDetails();
  }, [organizerId, isOpen]);

  const toggleOrganizerStatus = async () => {
    if (!organizerDetails) return;
    
    try {
      setIsUpdating(true);
      
      const response = await api.patch(`/admin/organizers/${organizerId}/toggle-status`, {
        isActive: !organizerDetails.isActive
      });
      
      if (response.data?.success) {
        setOrganizerDetails(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        toast.success(`Organizer ${organizerDetails.isActive ? 'deactivated' : 'activated'} successfully`);
        if (onStatusChange) onStatusChange();
      } else {
        throw new Error('Failed to update organizer status');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-none">
          <Avatar className="h-20 w-20">
            <AvatarImage src={organizerDetails?.logo} />
            <AvatarFallback>{organizerDetails ? getInitials(organizerDetails.companyName) : 'NA'}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{organizerDetails?.companyName}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{organizerDetails?.email}</span>
          </div>
          {organizerDetails?.phone && (
            <div className="flex items-center gap-1 mt-1">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{organizerDetails.phone}</span>
            </div>
          )}
          {organizerDetails?.website && (
            <div className="flex items-center gap-1 mt-1">
              <Globe className="h-4 w-4 text-gray-500" />
              <a 
                href={organizerDetails.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {organizerDetails.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Joined on {formatDate(organizerDetails?.createdAt)}</span>
          </div>
          <div className="mt-2 flex gap-2">
            {organizerDetails?.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
            )}
            {organizerDetails?.verificationStatus && (
              <Badge className={
                organizerDetails.verificationStatus === 'verified' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }>
                {organizerDetails.verificationStatus === 'verified' ? 'Verified' : 'Unverified'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 pt-4 border-t">
        {organizerDetails?.description && (
          <div>
            <h4 className="font-medium text-gray-700">About</h4>
            <p className="mt-2 text-sm text-gray-600">{organizerDetails.description}</p>
          </div>
        )}
        
        {organizerDetails?.address && (
          <div>
            <h4 className="font-medium text-gray-700">Address</h4>
            <div className="mt-2 flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <div className="space-y-1">
                {organizerDetails.address.street && <p className="text-sm">{organizerDetails.address.street}</p>}
                <p className="text-sm">
                  {[
                    organizerDetails.address.city,
                    organizerDetails.address.district,
                    organizerDetails.address.postalCode
                  ].filter(Boolean).join(', ')}
                </p>
                <p className="text-sm">{organizerDetails.address.country || 'Sri Lanka'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Organized Events</h4>
        <Badge variant="outline" className="px-3">
          Total: {organizerDetails?.events?.count || 0}
        </Badge>
      </div>
      
      {organizerDetails?.events?.count ? (
        <div className="space-y-3">
          {organizerDetails.events.recent.map(event => (
            <Card key={event._id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">{event.title}</h5>
                    <Badge className={
                      event.approvalStatus === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : event.approvalStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                    }>
                      {event.approvalStatus.charAt(0).toUpperCase() + event.approvalStatus.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  
                  {event.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location.venue}, {event.location.city}</span>
                    </div>
                  )}
                  
                  {event.ticketsSold !== undefined && (
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <CalendarClock className="h-3 w-3" />
                      <span>{event.ticketsSold} tickets sold</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Building2 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No events created yet</p>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center p-6">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <DialogTitle className="text-lg font-medium text-gray-900">Error Loading Organizer Profile</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">{error}</DialogDescription>
          </div>
        ) : organizerDetails ? (
          <>
            <DialogHeader>
              <DialogTitle>Organizer Profile</DialogTitle>
              <DialogDescription>
                Detailed information about this event organizer
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                {renderBasicInfo()}
              </TabsContent>
              <TabsContent value="events" className="mt-4">
                {renderEvents()}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between items-center mt-6 gap-4">
              <Button
                variant="destructive"
                onClick={toggleOrganizerStatus}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : organizerDetails.isActive ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {organizerDetails.isActive ? 'Deactivate Account' : 'Activate Account'}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};

export default OrganizerProfileModal; 