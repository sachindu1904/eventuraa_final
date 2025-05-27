import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, MessageSquare, Clock, Phone, Mail, MapPin, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
  regNumber: string;
  experience: number;
  profileImage?: string;
  consultationFee?: { amount: number; currency: string; };
  languages?: string[];
  bio?: string;
  isActive: boolean;
  verificationStatus?: { isVerified: boolean; verificationDate?: string; };
  appointmentsToday?: number;
  urgentAppointments?: number;
  unreadMessages?: number;
  locations?: Array<{
    _id: string;
    name: string;
    address: string;
    city: string;
    phone?: string;
    isActive: boolean;
  }>;
}

interface Appointment {
  _id: string;
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
  userId?: {
    name: string;
    email: string;
  };
}

interface DoctorDashboardProps {
  doctor: Doctor;
}

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ doctor }) => {
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const stats = [
    {
      title: "Today's Appointments",
      value: doctor.appointmentsToday || 0,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Urgent Appointments",
      value: doctor.urgentAppointments || 0,
      icon: Clock,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Unread Messages",
      value: doctor.unreadMessages || 0,
      icon: MessageSquare,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Experience",
      value: `${doctor.experience} years`,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ];

  const fetchAppointments = async (date?: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      let url = 'http://localhost:5001/api/doctors/appointments?limit=50';
      if (date && date !== '') {
        url += `&date=${date}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAppointments(data.data.appointments || []);
        }
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch all appointments by default
    fetchAppointments(selectedDate);
  }, [selectedDate]);

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/doctors/appointments/${appointmentId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Appointment status updated",
        });
        // Refresh appointments
        fetchAppointments(selectedDate);
      } else {
        throw new Error('Failed to update appointment status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Your Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">
                {doctor.name.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="text-xl font-semibold">Dr. {doctor.name}</h3>
              <p className="text-gray-600">{doctor.specialty}</p>
              <p className="text-sm text-gray-500">Registration: {doctor.regNumber}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                  doctor.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {doctor.isActive ? 'Active' : 'Inactive'}
                </span>
                {doctor.verificationStatus?.isVerified && (
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Appointments Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Appointments</CardTitle>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1 border rounded text-sm"
                placeholder="Filter by date (optional)"
              />
              <Button 
                onClick={() => setSelectedDate('')}
                size="sm"
                variant="outline"
              >
                Show All
              </Button>
              <Button 
                onClick={() => fetchAppointments(selectedDate)}
                size="sm"
                variant="outline"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No appointments</h3>
              <p className="text-gray-600">
                {selectedDate ? `No appointments found for ${format(new Date(selectedDate), 'MMM dd, yyyy')}` : 'No appointments found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium">{appointment.patientName}</span>
                        </div>
                        <span className="text-2xl">{getTypeIcon(appointment.type)}</span>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                      
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
                          {appointment.patientContact.phone && (
                            <p className="text-sm text-gray-600">
                              <Phone className="h-4 w-4 inline mr-1" />
                              {appointment.patientContact.phone}
                            </p>
                          )}
                          {appointment.patientContact.email && (
                            <p className="text-sm text-gray-600">
                              <Mail className="h-4 w-4 inline mr-1" />
                              {appointment.patientContact.email}
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
                      
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {appointment.reason}
                      </p>
                      
                      <div className="flex items-center justify-between mt-3">
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
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 ml-4">
                      {appointment.status === 'scheduled' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateAppointmentStatus(appointment._id, 'completed')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Complete
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Consultation Fee */}
      {doctor.consultationFee && (
        <Card>
          <CardHeader>
            <CardTitle>Consultation Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Current Consultation Fee</p>
                <p className="text-xl font-semibold">
                  {doctor.consultationFee.currency} {doctor.consultationFee.amount}
                </p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Update Fee
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DoctorDashboard; 