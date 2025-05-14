import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import BookingsList from '@/components/BookingsList';
import { Calendar, Building } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState, useEffect } from 'react';
import api from '@/utils/api-fetch';
import { toast } from '@/components/ui/sonner';

interface Venue {
  _id: string;
  name: string;
  location: string;
}

const AdminBookingsPage: React.FC = () => {
  const [selectedVenue, setSelectedVenue] = useState<string>('all');
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const response = await api.get('/admin/venues');
        
        if (response.success && response.data && response.data.venues) {
          setVenues(response.data.venues);
        } else {
          toast.error('Failed to load venues');
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        toast.error('An error occurred while loading venues');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVenues();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Bookings Management</h1>
        
        <div className="flex items-center gap-2">
          <Select 
            value={selectedVenue} 
            onValueChange={setSelectedVenue}
            disabled={isLoading}
          >
            <SelectTrigger className="w-[250px]">
              <Building className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Venues</SelectItem>
              {venues.map(venue => (
                <SelectItem key={venue._id} value={venue._id}>
                  {venue.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage bookings across all venues</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <BookingsList 
            isAdmin={true} 
            venueId={selectedVenue !== 'all' ? selectedVenue : undefined} 
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBookingsPage; 