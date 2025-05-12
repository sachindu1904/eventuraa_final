import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MoreHorizontal, 
  UserCog, 
  UserX, 
  Mail,
  XCircle,
  CheckCircle,
  Eye,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';
import { toast } from '@/components/ui/sonner';
import DoctorProfileModal from './DoctorProfileModal';

interface Doctor {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialty: string;
  regNumber: string;
  createdAt: string;
  isActive: boolean;
  appointments: string[];
  verificationStatus: {
    isVerified: boolean;
    documents: string[];
    verificationDate?: string;
  };
  profileImage?: string;
}

const AdminDoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/doctors');
      
      // Check if the response has the expected structure
      if (response.data?.success && response.data?.data?.doctors) {
        setDoctors(response.data.data.doctors);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Error loading doctors: ${errorMessage}`);
      console.error('Error fetching doctors:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doctor =>
    doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doctor.regNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
  };

  const getVerificationBadge = (verificationStatus: { isVerified: boolean }) => {
    return verificationStatus.isVerified
      ? <Badge className="bg-blue-100 text-blue-800">Verified</Badge>
      : <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
  };

  const handleDoctorStatusChange = () => {
    fetchDoctors(); // Refresh the doctors list
  };

  const openDoctorProfile = (doctorId: string) => {
    setSelectedDoctorId(doctorId);
    setIsProfileModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <XCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Error Loading Doctors</h3>
        <p className="text-sm text-gray-500 mt-2">{error}</p>
        <Button 
          variant="outline" 
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Doctor Management</h1>
        <Button>Add New Doctor</Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Doctors ({doctors.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search doctors..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Registration No.</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.length > 0 ? (
                filteredDoctors.map((doctor) => (
                  <TableRow 
                    key={doctor._id} 
                    className="cursor-pointer hover:bg-slate-50" 
                    onClick={() => openDoctorProfile(doctor._id)}
                  >
                    <TableCell className="font-medium">{doctor.name}</TableCell>
                    <TableCell>{doctor.specialty}</TableCell>
                    <TableCell>{doctor.regNumber}</TableCell>
                    <TableCell>{doctor.email}</TableCell>
                    <TableCell>{getStatusBadge(doctor.isActive)}</TableCell>
                    <TableCell>{getVerificationBadge(doctor.verificationStatus)}</TableCell>
                    <TableCell>{doctor.appointments?.length || 0}</TableCell>
                    <TableCell>
                      {format(new Date(doctor.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openDoctorProfile(doctor._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Edit Doctor</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileText className="mr-2 h-4 w-4" />
                            <span>View Credentials</span>
                          </DropdownMenuItem>
                          {!doctor.verificationStatus.isVerified && (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              <span className="text-green-600">Verify Doctor</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="mr-2 h-4 w-4" />
                            <span>{doctor.isActive ? 'Deactivate Doctor' : 'Activate Doctor'}</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center text-gray-500">
                      <Search className="h-10 w-10 mb-2" />
                      <h3 className="text-lg font-medium">No doctors found</h3>
                      <p className="text-sm">Try adjusting your search query</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedDoctorId && (
        <DoctorProfileModal
          doctorId={selectedDoctorId}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onStatusChange={handleDoctorStatusChange}
        />
      )}
    </div>
  );
};

export default AdminDoctorsPage; 