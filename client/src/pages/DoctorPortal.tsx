import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MapPin, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import new minimal components
import DoctorDashboard from '@/components/doctor/DoctorDashboard';
import DoctorProfile from '@/components/doctor/DoctorProfile';
import DoctorLocations from '@/components/doctor/DoctorLocations';

interface Location {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
}

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
  locations?: Location[];
}

interface ApiResponse {
  success: boolean;
  data?: {
    doctor: Doctor;
  };
  message?: string;
}

const DoctorPortal = () => {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const { toast } = useToast();
  const navigate = useNavigate();
  const [doctorData, setDoctorData] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'doctor') {
      toast({
        title: "Authentication Required",
        description: "Please log in to access the doctor portal.",
        variant: "destructive",
      });
      navigate('/doctor-login');
      return;
    }
    
    // If authenticated, proceed to fetch profile
    fetchDoctorProfile();
  }, [navigate, toast]);
  
  const fetchDoctorProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const response = await fetch('http://localhost:5001/api/doctors/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired
          localStorage.removeItem('token');
          localStorage.removeItem('userType');
          localStorage.removeItem('doctorData');
          toast({
            title: "Session Expired",
            description: "Please log in again.",
            variant: "destructive",
          });
          navigate('/doctor-login');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data?.doctor) {
        setDoctorData(data.data.doctor);
      } else {
        throw new Error(data.message || 'Failed to fetch doctor profile');
      }
    } catch (err) {
      console.error('Error fetching doctor profile:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load your profile. Please try again later.';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedDoctor: Doctor) => {
    setDoctorData(updatedDoctor);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('doctorData');
    toast({
      title: "Logged out successfully",
      description: "You have been logged out of the doctor portal.",
    });
    navigate('/doctor-login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !doctorData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'Unable to load doctor data'}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Doctor Portal</h1>
              <p className="text-gray-600">Welcome back, Dr. {doctorData.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{doctorData.name}</p>
                <p className="text-sm text-gray-500">{doctorData.specialty}</p>
              </div>
              <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium">
                  {doctorData.name.charAt(0)}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Locations
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <DoctorDashboard doctor={doctorData} />
          </TabsContent>
          
          <TabsContent value="profile">
            <DoctorProfile 
              doctor={doctorData} 
              onUpdate={handleProfileUpdate}
            />
          </TabsContent>
          
          <TabsContent value="locations">
            <DoctorLocations doctor={doctorData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DoctorPortal; 