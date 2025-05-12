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
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Stethoscope, 
  Activity, 
  Clock, 
  Check, 
  XCircle,
  UserX
} from 'lucide-react';
import api from '@/utils/api';
import { toast } from '@/components/ui/sonner';

interface DoctorProfileProps {
  doctorId: string;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: () => void;
}

interface DoctorDetails {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  specialization?: string;
  experience?: number;
  hospital?: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country?: string;
  };
  bio?: string;
  isActive: boolean;
  createdAt: string;
  appointments?: {
    count: number;
    recent: Array<{
      _id: string;
      patientName: string;
      appointmentDate: string;
      status: string;
      reason: string;
      userId?: {
        name: string;
        email: string;
      };
    }>;
  };
}

const DoctorProfileModal: React.FC<DoctorProfileProps> = ({ 
  doctorId, 
  isOpen, 
  onClose,
  onStatusChange
}) => {
  const [doctorDetails, setDoctorDetails] = useState<DoctorDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (!isOpen || !doctorId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await api.get(`/admin/doctors/${doctorId}`);
        
        if (response.data?.success && response.data?.data?.doctor) {
          setDoctorDetails(response.data.data.doctor);
        } else {
          throw new Error('Failed to fetch doctor details');
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
        setError(errorMessage);
        toast.error(`Error: ${errorMessage}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId, isOpen]);

  const toggleDoctorStatus = async () => {
    if (!doctorDetails) return;
    
    try {
      setIsUpdating(true);
      
      const response = await api.patch(`/admin/doctors/${doctorId}/toggle-status`, {
        isActive: !doctorDetails.isActive
      });
      
      if (response.data?.success) {
        setDoctorDetails(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
        toast.success(`Doctor ${doctorDetails.isActive ? 'deactivated' : 'activated'} successfully`);
        if (onStatusChange) onStatusChange();
      } else {
        throw new Error('Failed to update doctor status');
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

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
      return 'Invalid date';
    }
  };

  const renderBasicInfo = () => (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-none">
          <Avatar className="h-20 w-20">
            <AvatarImage src={doctorDetails?.profileImage} />
            <AvatarFallback>{doctorDetails ? getInitials(doctorDetails.name) : 'NA'}</AvatarFallback>
          </Avatar>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold">{doctorDetails?.name}</h3>
          {doctorDetails?.specialization && (
            <p className="text-sm text-indigo-600">{doctorDetails.specialization}</p>
          )}
          <div className="flex items-center gap-1 mt-1">
            <Mail className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{doctorDetails?.email}</span>
          </div>
          {doctorDetails?.phone && (
            <div className="flex items-center gap-1 mt-1">
              <Phone className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">{doctorDetails.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Joined on {formatDate(doctorDetails?.createdAt)}</span>
          </div>
          <div className="mt-2">
            {doctorDetails?.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <h4 className="font-medium text-gray-700">Professional Info</h4>
          <div className="mt-2 space-y-2">
            {doctorDetails?.hospital && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Hospital</span>
                <span className="text-sm">{doctorDetails.hospital}</span>
              </div>
            )}
            {doctorDetails?.experience !== undefined && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Experience</span>
                <span className="text-sm">{doctorDetails.experience} years</span>
              </div>
            )}
          </div>
        </div>
        
        {doctorDetails?.address && (
          <div>
            <h4 className="font-medium text-gray-700">Address</h4>
            <div className="mt-2 flex items-start gap-2">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <div className="space-y-1">
                {doctorDetails.address.street && <p className="text-sm">{doctorDetails.address.street}</p>}
                <p className="text-sm">
                  {[
                    doctorDetails.address.city,
                    doctorDetails.address.district,
                    doctorDetails.address.postalCode
                  ].filter(Boolean).join(', ')}
                </p>
                <p className="text-sm">{doctorDetails.address.country || 'Sri Lanka'}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {doctorDetails?.bio && (
        <div className="pt-4 border-t">
          <h4 className="font-medium text-gray-700">About</h4>
          <p className="mt-2 text-sm text-gray-600">{doctorDetails.bio}</p>
        </div>
      )}
    </div>
  );

  const renderAppointments = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Recent Appointments</h4>
        <Badge variant="outline" className="px-3">
          Total: {doctorDetails?.appointments?.count || 0}
        </Badge>
      </div>
      
      {doctorDetails?.appointments?.count ? (
        <div className="space-y-3">
          {doctorDetails.appointments.recent.map(appointment => (
            <Card key={appointment._id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-medium">{appointment.patientName}</h5>
                      {appointment.userId && (
                        <p className="text-xs text-gray-500">{appointment.userId.email}</p>
                      )}
                    </div>
                    <Badge className={
                      appointment.status === 'completed' 
                        ? 'bg-blue-100 text-blue-800' 
                        : appointment.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                    }>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{formatDateTime(appointment.appointmentDate)}</span>
                  </div>
                  
                  {appointment.reason && (
                    <div className="flex items-start gap-1 text-xs text-gray-500">
                      <Activity className="h-3 w-3 mt-0.5" />
                      <span>{appointment.reason}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-lg">
          <Stethoscope className="h-10 w-10 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No appointments found</p>
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
            <DialogTitle className="text-lg font-medium text-gray-900">Error Loading Doctor Profile</DialogTitle>
            <DialogDescription className="text-gray-500 mt-2">{error}</DialogDescription>
          </div>
        ) : doctorDetails ? (
          <>
            <DialogHeader>
              <DialogTitle>Doctor Profile</DialogTitle>
              <DialogDescription>
                Detailed information about this doctor
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
              </TabsList>
              <TabsContent value="basic" className="mt-4">
                {renderBasicInfo()}
              </TabsContent>
              <TabsContent value="appointments" className="mt-4">
                {renderAppointments()}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between items-center mt-6 gap-4">
              <Button
                variant="destructive"
                onClick={toggleDoctorStatus}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                ) : doctorDetails.isActive ? (
                  <UserX className="h-4 w-4 mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                {doctorDetails.isActive ? 'Deactivate Account' : 'Activate Account'}
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

export default DoctorProfileModal; 