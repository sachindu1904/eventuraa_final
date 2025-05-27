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
  Calendar,
  CheckCircle,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import api from '@/utils/api';
import { toast } from '@/components/ui/sonner';
import OrganizerProfileModal from './OrganizerProfileModal';

interface Organizer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  createdAt: string;
  isActive: boolean;
  events: string[];
  verificationStatus: {
    isVerified: boolean;
    documents: string[];
    verificationDate?: string;
  };
  logo?: string;
}

const AdminOrganizersPage: React.FC = () => {
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrganizerId, setSelectedOrganizerId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const fetchOrganizers = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/admin/organizers');
      
      // Check if the response has the expected structure
      if (response.data?.success && response.data?.data?.organizers) {
        setOrganizers(response.data.data.organizers);
      } else {
        throw new Error('Invalid response format from API');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Error loading organizers: ${errorMessage}`);
      console.error('Error fetching organizers:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrganizers();
  }, []);

  const filteredOrganizers = organizers.filter(organizer =>
    organizer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    organizer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    organizer.phone.includes(searchQuery) ||
    organizer.companyName.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleOrganizerStatusChange = () => {
    fetchOrganizers(); // Refresh the organizers list
  };

  const handleVerifyOrganizer = async (organizerId: string, isVerified: boolean) => {
    try {
      const endpoint = isVerified ? 'unverify' : 'verify';
      const action = isVerified ? 'revoked' : 'verified';
      
      await api.put(`/admin/organizers/${organizerId}/${endpoint}`);
      
      toast.success(`Organizer verification ${action} successfully`);
      fetchOrganizers(); // Refresh the organizers list
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An unknown error occurred';
      toast.error(`Error updating verification: ${errorMessage}`);
      console.error('Error updating organizer verification:', err);
    }
  };

  const openOrganizerProfile = (organizerId: string) => {
    setSelectedOrganizerId(organizerId);
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
        <h3 className="text-lg font-medium text-gray-900">Error Loading Organizers</h3>
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
        <h1 className="text-2xl font-bold">Organizer Management</h1>
        <Button>Add New Organizer</Button>
      </div>
      
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Organizers ({organizers.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search organizers..."
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
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verification</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizers.length > 0 ? (
                filteredOrganizers.map((organizer) => (
                  <TableRow 
                    key={organizer._id} 
                    className="cursor-pointer hover:bg-slate-50" 
                    onClick={() => openOrganizerProfile(organizer._id)}
                  >
                    <TableCell className="font-medium">{organizer.name}</TableCell>
                    <TableCell>{organizer.companyName}</TableCell>
                    <TableCell>{organizer.email}</TableCell>
                    <TableCell>{organizer.phone}</TableCell>
                    <TableCell>{getStatusBadge(organizer.isActive)}</TableCell>
                    <TableCell>{getVerificationBadge(organizer.verificationStatus)}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1 text-gray-500" />
                        {organizer.events?.length || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(organizer.createdAt), 'MMM d, yyyy')}
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
                          <DropdownMenuItem onClick={() => openOrganizerProfile(organizer._id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            <span>View Profile</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Edit Organizer</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Send Email</span>
                          </DropdownMenuItem>
                          {!organizer.verificationStatus.isVerified ? (
                            <DropdownMenuItem onClick={() => handleVerifyOrganizer(organizer._id, false)}>
                              <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                              <span className="text-green-600">Verify Organizer</span>
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleVerifyOrganizer(organizer._id, true)}>
                              <XCircle className="mr-2 h-4 w-4 text-red-600" />
                              <span className="text-red-600">Revoke Verification</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <UserX className="mr-2 h-4 w-4" />
                            <span>{organizer.isActive ? 'Deactivate Organizer' : 'Activate Organizer'}</span>
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
                      <h3 className="text-lg font-medium">No organizers found</h3>
                      <p className="text-sm">Try adjusting your search query</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedOrganizerId && (
        <OrganizerProfileModal
          organizerId={selectedOrganizerId}
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          onStatusChange={handleOrganizerStatusChange}
        />
      )}
    </div>
  );
};

export default AdminOrganizersPage; 