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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Ticket, 
  Hotel, 
  ShieldAlert, 
  Check, 
  XCircle,
  UserX
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/components/ui/sonner';

interface UserProfileProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

interface UserDetails {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country?: string;
  };
  isActive: boolean;
  createdAt: string;
  bookings?: {
    count: number;
    recent: Array<{
      _id: string;
      eventTitle: string;
      ticketType: string;
      purchaseDate: string;
      status: string;
    }>;
  };
  reservations?: {
    count: number;
    recent: Array<{
      _id: string;
      hotelName: string;
      checkInDate: string;
      checkOutDate: string;
      status: string;
    }>;
  };
}

const UserProfileModal: React.FC<UserProfileProps> = ({ 
  userId, 
  isOpen, 
  onClose,
  onStatusChange
}) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!isOpen || !userId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get(`/admin/users/${userId}`);
        
        if (response.data?.success && response.data?.data?.user) {
          setUserDetails(response.data.data.user);
        } else {
          throw new Error('Failed to fetch user details');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, isOpen]);

  const toggleUserStatus = async () => {
    if (!userDetails) return;
    
    try {
      setIsUpdating(true);
      
      const response = await api.patch(`/admin/users/${userId}/toggle-status`, {
        isActive: !userDetails.isActive
      });
      
      if (response.data?.success) {
        setUserDetails(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        toast.success(`User ${userDetails.isActive ? 'deactivated' : 'activated'} successfully`);
        if (onStatusChange) onStatusChange();
      } else {
        throw new Error('Failed to update user status');
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
            <AvatarImage src={userDetails?.profileImage} />
            <AvatarFallback>{userDetails ? getInitials(userDetails.name) : 'NA'}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{userDetails?.name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{userDetails?.email}</span>
          </div>
          {userDetails?.phone && (
            <div className="flex items-center gap-1 mt-1">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{userDetails.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Joined on {formatDate(userDetails?.createdAt)}</span>
          </div>
          <div className="mt-2">
            {userDetails?.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <h4 className="font-medium text-gray-700">Personal Info</h4>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Gender</span>
              <span className="text-sm">{userDetails?.gender || 'Not specified'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date of Birth</span>
              <span className="text-sm">{formatDate(userDetails?.dateOfBirth)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-gray-700">Address</h4>
          <div className="mt-2">
            {userDetails?.address ? (
              <div className="space-y-1">
                {userDetails.address.street && <p className="text-sm">{userDetails.address.street}</p>}
                <p className="text-sm">
                  {[
                    userDetails.address.city,
                    userDetails.address.district,
                    userDetails.address.postalCode
                  ].filter(Boolean).join(', ')}
                </p>
                <p className="text-sm">{userDetails.address.country || 'Sri Lanka'}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No address provided</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderTickets = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Event Tickets</h4>
        <Badge variant="outline" className="px-3">
          Total: {userDetails?.bookings?.count || 0}
        </Badge>
      </div>
      
      {userDetails?.bookings?.count ? (
        <div className="space-y-3">
          {userDetails.bookings.recent.map(booking => (
            <Card key={booking._id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">{booking.eventTitle}</h5>
                    <p className="text-sm text-gray-500">{booking.ticketType}</p>
                    <p className="text-xs text-gray-400">Purchased: {formatDate(booking.purchaseDate)}</p>
                  </div>
                  <Badge className={booking.status === 'used' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                    {booking.status === 'used' ? 'Used' : 'Active'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Ticket className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No tickets purchased yet</p>
        </div>
      )}
    </div>
  );

  const renderReservations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Hotel Reservations</h4>
        <Badge variant="outline" className="px-3">
          Total: {userDetails?.reservations?.count || 0}
        </Badge>
      </div>
      
      {userDetails?.reservations?.count ? (
        <div className="space-y-3">
          {userDetails.reservations.recent.map(reservation => (
            <Card key={reservation._id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="font-medium">{reservation.hotelName}</h5>
                    <p className="text-sm text-gray-500">
                      {formatDate(reservation.checkInDate)} - {formatDate(reservation.checkOutDate)}
                    </p>
                  </div>
                  <Badge className={reservation.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'}>
                    {reservation.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Hotel className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No hotel reservations found</p>
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
            <DialogTitle className="text-lg font-medium text-gray-900">Error Loading User Profile</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">{error}</DialogDescription>
          </div>
        ) : userDetails ? (
          <>
            <DialogHeader>
              <DialogTitle>User Profile</DialogTitle>
              <DialogDescription>
                Detailed information about this user
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="reservations">Reservations</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                {renderBasicInfo()}
              </TabsContent>
              <TabsContent value="tickets" className="mt-4">
                {renderTickets()}
              </TabsContent>
              <TabsContent value="reservations" className="mt-4">
                {renderReservations()}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between items-center mt-6 gap-4">
              <Button
                variant="destructive"
                onClick={toggleUserStatus}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : userDetails.isActive ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {userDetails.isActive ? 'Deactivate Account' : 'Activate Account'}
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

export default UserProfileModal; 