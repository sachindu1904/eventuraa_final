import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, Phone, Mail, MapPin, Stethoscope } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

interface Appointment {
  _id: string;
  doctorId: {
    name: string;
    specialty: string;
    email: string;
  };
  patientName: string;
  patientContact: {
    email?: string;
    phone?: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  type: string;
  reason: string;
  location?: {
    name: string;
    address: string;
  };
  fee: {
    amount: number;
    currency: string;
    isPaid: boolean;
  };
}

const UserAppointments: React.FC = () => {
  const { toast } = useToast();
  const { userData } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserAppointments = async () => {
    if (!userData?._id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your appointments",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`http://localhost:5001/api/users/appointments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAppointments(data.data.appointments || []);
        } else {
          throw new Error(data.message || 'Failed to fetch appointments');
        }
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load your appointments. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserAppointments();
  }, [userData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '📹';
      case 'phone':
        return '📞';
      case 'in-person':
        return '🏥';
      default:
        return '📋';
    }
  };

  if (!userData) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Please Log In</h3>
          <p className="text-gray-600">You need to be logged in to view your appointments.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Appointments</CardTitle>
          <Button 
            onClick={fetchUserAppointments}
            size="sm"
            variant="outline"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your appointments...</p>
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No appointments found</h3>
            <p className="text-gray-600">You haven't booked any appointments yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Dr. {appointment.doctorId.name}</span>
                      </div>
                      <span className="text-2xl">{getTypeIcon(appointment.type)}</span>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Specialty:</span> {appointment.doctorId.specialty}
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-sm text-gray-600">
                          <Clock className="h-4 w-4 inline mr-1" />
                          {format(new Date(appointment.appointmentDate), 'MMM dd, yyyy')} at {appointment.appointmentTime}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Type:</span> {appointment.type}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600">
                          <Mail className="h-4 w-4 inline mr-1" />
                          {appointment.doctorId.email}
                        </p>
                        {appointment.patientContact.phone && (
                          <p className="text-sm text-gray-600">
                            <Phone className="h-4 w-4 inline mr-1" />
                            {appointment.patientContact.phone}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {appointment.location && (
                      <p className="text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 inline mr-1" />
                        {appointment.location.name}
                      </p>
                    )}
                    
                    <p className="text-sm text-gray-700 mb-3">
                      <span className="font-medium">Reason:</span> {appointment.reason}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Fee:</span> {appointment.fee.currency} {appointment.fee.amount}
                        <span className={`ml-2 px-2 py-1 rounded text-xs ${
                          appointment.fee.isPaid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {appointment.fee.isPaid ? 'Paid' : 'Pending'}
                        </span>
                      </div>
                      
                      {appointment.status === 'scheduled' && (
                        <div className="text-xs text-gray-500">
                          Appointment confirmed
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAppointments; 