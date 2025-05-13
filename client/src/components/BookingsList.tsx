import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Home,
  Users,
  Check,
  X,
  Clock,
  CreditCard,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  FileText
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

interface Booking {
  _id: string;
  bookingReference: string;
  venue: {
    _id: string;
    name: string;
  };
  roomType: {
    _id: string;
    name: string;
    pricePerNight: {
      amount: number;
      currency: string;
    };
  };
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  nightCount: number;
  totalPrice: number;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  payment: {
    method: string;
    status: string;
  };
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  createdAt: string;
}

interface BookingsListProps {
  isAdmin?: boolean;
  venueId?: string;
}

const BookingsList: React.FC<BookingsListProps> = ({ isAdmin = false, venueId }) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        let endpoint = isAdmin ? '/admin/bookings' : '/bookings/host-bookings';
        
        // If venueId is provided, filter by venue
        if (venueId) {
          endpoint += `?venueId=${venueId}`;
        }
        
        const response = await api.get(endpoint);
        
        if (response.success && response.data && response.data.bookings) {
          setBookings(response.data.bookings);
          setFilteredBookings(response.data.bookings);
        } else {
          toast.error('Failed to load bookings');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
        toast.error('An error occurred while loading bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookings();
  }, [isAdmin, venueId]);

  // Filter and sort bookings whenever search term, status filter, or sort option changes
  useEffect(() => {
    let result = [...bookings];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(booking => 
        booking.bookingReference.toLowerCase().includes(term) ||
        booking.contactInfo.firstName.toLowerCase().includes(term) ||
        booking.contactInfo.lastName.toLowerCase().includes(term) ||
        booking.contactInfo.email.toLowerCase().includes(term) ||
        booking.venue.name.toLowerCase().includes(term)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(booking => booking.status === statusFilter);
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'price-asc':
        result.sort((a, b) => a.totalPrice - b.totalPrice);
        break;
      case 'price-desc':
        result.sort((a, b) => b.totalPrice - a.totalPrice);
        break;
      case 'checkin-asc':
        result.sort((a, b) => new Date(a.checkInDate).getTime() - new Date(b.checkInDate).getTime());
        break;
      case 'checkin-desc':
        result.sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime());
        break;
      default:
        break;
    }
    
    setFilteredBookings(result);
  }, [bookings, searchTerm, statusFilter, sortBy]);

  const handleViewBooking = (bookingId: string) => {
    navigate(`/booking-confirmation/${bookingId}`);
  };

  const handleChangeStatus = async (bookingId: string, newStatus: string) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      
      if (response.success) {
        // Update booking in the state
        const updatedBookings = bookings.map(booking => 
          booking._id === bookingId ? { ...booking, status: newStatus as 'confirmed' | 'pending' | 'cancelled' | 'completed' } : booking
        );
        setBookings(updatedBookings);
        toast.success(`Booking status updated to ${newStatus}`);
      } else {
        toast.error(response.message || 'Failed to update booking status');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('An error occurred while updating booking status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search bookings..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px]">
              <ArrowUpDown className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="checkin-asc">Check-in: Soonest</SelectItem>
              <SelectItem value="checkin-desc">Check-in: Latest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="border rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead className="hidden md:table-cell">Venue / Room</TableHead>
                <TableHead className="hidden md:table-cell">Dates</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking._id}>
                  <TableCell className="font-medium">
                    {booking.bookingReference}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 mt-0.5 text-gray-500" />
                      <div>
                        <div>{booking.contactInfo.firstName} {booking.contactInfo.lastName}</div>
                        <div className="text-xs text-gray-500">{booking.contactInfo.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div className="font-medium">{booking.venue.name}</div>
                      <div className="text-xs text-gray-500">{booking.roomType.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                        {formatDate(booking.checkInDate)}
                      </div>
                      <div className="flex items-center mt-1">
                        <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                        {formatDate(booking.checkOutDate)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {booking.nightCount} nights, {booking.guests} guests
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="font-medium">
                      {booking.roomType.pricePerNight.currency} {booking.totalPrice.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {booking.payment.method}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' : 
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' :
                      'bg-red-100 text-red-800 hover:bg-red-100'
                    }>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewBooking(booking._id)}>
                          <FileText className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {booking.status === 'pending' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(booking._id, 'confirmed')}>
                            <Check className="mr-2 h-4 w-4" />
                            Confirm Booking
                          </DropdownMenuItem>
                        )}
                        {(booking.status === 'pending' || booking.status === 'confirmed') && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(booking._id, 'cancelled')}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel Booking
                          </DropdownMenuItem>
                        )}
                        {booking.status === 'confirmed' && (
                          <DropdownMenuItem onClick={() => handleChangeStatus(booking._id, 'completed')}>
                            <Check className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-10">
            <Calendar className="h-10 w-10 mx-auto text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No bookings found</h3>
            <p className="text-gray-500 mt-1">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters' 
                : 'You have no bookings yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsList; 