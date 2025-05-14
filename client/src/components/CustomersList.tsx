import React, { useState, useEffect } from 'react';
import { User, Search, Mail, Phone, Calendar, ArrowUpDown } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

interface Customer {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  } | null;
  bookingsCount: number;
  lastBooking: string;
}

const CustomersList: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/bookings/host-customers');
        
        if (response.success && response.data && response.data.customers) {
          setCustomers(response.data.customers);
          setFilteredCustomers(response.data.customers);
        } else {
          toast.error('Failed to load customers');
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
        toast.error('An error occurred while loading customers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  // Filter and sort customers
  useEffect(() => {
    let result = [...customers];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(customer => 
        customer.firstName.toLowerCase().includes(term) ||
        customer.lastName.toLowerCase().includes(term) ||
        customer.email.toLowerCase().includes(term) ||
        customer.phone.includes(term)
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.lastBooking).getTime() - new Date(a.lastBooking).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.lastBooking).getTime() - new Date(b.lastBooking).getTime());
        break;
      case 'name-asc':
        result.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
        break;
      case 'name-desc':
        result.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
        break;
      case 'bookings-desc':
        result.sort((a, b) => b.bookingsCount - a.bookingsCount);
        break;
      default:
        break;
    }
    
    setFilteredCustomers(result);
  }, [customers, searchTerm, sortBy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const handleViewBookings = (email: string) => {
    // Navigate to bookings filtered by this customer
    console.log('View bookings for customer:', email);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search customers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[170px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="name-asc">Name (A-Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z-A)</SelectItem>
              <SelectItem value="bookings-desc">Most Bookings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredCustomers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Last Booking</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.email}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                        {customer.user?.profileImage ? (
                          <img 
                            src={customer.user.profileImage} 
                            alt={`${customer.firstName} ${customer.lastName}`} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{customer.firstName} {customer.lastName}</div>
                        <div className="text-xs text-gray-500">
                          {customer.user ? 'Registered User' : 'Guest Booking'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span>{customer.email}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Phone className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {customer.bookingsCount} {customer.bookingsCount === 1 ? 'booking' : 'bookings'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-500" />
                      <span>{formatDate(customer.lastBooking)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleViewBookings(customer.email)}>
                      View Bookings
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <User className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No customers found</h3>
            <p className="text-gray-500 mt-1">
              {searchTerm ? 'Try adjusting your search' : 'You have no customers yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersList; 