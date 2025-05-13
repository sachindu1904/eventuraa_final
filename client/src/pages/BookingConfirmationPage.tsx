import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Calendar, Clock, Users, MapPin, CreditCard, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import api, { ApiResponse } from '@/utils/api-fetch';
import { format } from 'date-fns';
import useAuth from '@/hooks/useAuth';

interface Booking {
  _id: string;
  bookingReference: string;
  venue: {
    _id: string;
    name: string;
    address: {
      city: string;
      country: string;
    };
    images?: Array<{
      url: string;
      isMain?: boolean;
    }>;
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
  serviceFee: number;
  contactInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  payment: {
    method: string;
    status: string;
    details?: {
      cardHolderName?: string;
      lastFourDigits?: string;
    };
  };
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

const BookingConfirmationPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    const fetchBookingDetails = async () => {
      if (!bookingId) return;
      
      setLoading(true);
      try {
        const response = await api.get<ApiResponse<{ booking: Booking }>>(`/bookings/${bookingId}`);
        
        if (response.success && response.data && response.data.booking) {
          setBooking(response.data.booking);
        } else {
          setError(response.message || 'Failed to load booking details');
          toast.error('Failed to load booking details');
        }
      } catch (error) {
        console.error('Error fetching booking details:', error);
        setError('An error occurred while loading the booking');
        toast.error('Failed to load booking. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [bookingId, isAuthenticated, navigate]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'EEE, MMM d, yyyy');
  };

  const handleBackToBookings = () => {
    navigate('/my-bookings');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-8 rounded-lg border border-gray-200">
            <Info className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The booking you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Button onClick={handleBackToBookings}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to My Bookings
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={handleBackToBookings}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Bookings
        </Button>
        
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
            <p className="text-gray-600">
              Your booking reference is: <span className="font-semibold">{booking.bookingReference}</span>
            </p>
            <p className="text-gray-600 text-sm mt-1">
              Confirmation sent to: {booking.contactInfo.email}
            </p>
            
            <div className="mt-4">
              <Badge className={
                booking.status === 'confirmed' ? 'bg-green-500' : 
                booking.status === 'pending' ? 'bg-yellow-500' : 
                'bg-red-500'
              }>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="md:w-1/3">
                  {booking.venue.images && booking.venue.images.length > 0 ? (
                    <img 
                      src={booking.venue.images.find(img => img.isMain)?.url || booking.venue.images[0].url} 
                      alt={booking.venue.name}
                      className="w-full h-auto object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md">
                      <MapPin className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-xl font-semibold">{booking.roomType.name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{booking.venue.name}</p>
                  <p className="text-gray-600 text-sm mb-4">
                    {booking.venue.address.city}, {booking.venue.address.country}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Check-in</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.checkInDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Calendar className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Check-out</p>
                        <p className="text-sm text-gray-600">{formatDate(booking.checkOutDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Clock className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Duration</p>
                        <p className="text-sm text-gray-600">{booking.nightCount} nights</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start">
                      <Users className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Guests</p>
                        <p className="text-sm text-gray-600">{booking.guests} {booking.guests === 1 ? 'person' : 'people'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Guest Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Name</p>
                  <p className="text-gray-600">{booking.contactInfo.firstName} {booking.contactInfo.lastName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-gray-600">{booking.contactInfo.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-gray-600">{booking.contactInfo.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Booking Date</p>
                  <p className="text-gray-600">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center mb-4">
                {booking.payment.method === 'credit-card' ? (
                  <>
                    <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                    <span className="font-medium">
                      Credit/Debit Card
                      {booking.payment.details?.lastFourDigits && (
                        <span className="ml-1 text-gray-500">
                          ending in {booking.payment.details.lastFourDigits}
                        </span>
                      )}
                    </span>
                  </>
                ) : booking.payment.method === 'paypal' ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-[#003087] fill-current">
                      <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.378-1.012-3.35-1.207-5.836-1.207h-5.92c-.101 0-.187.077-.202.178L6.65 18.447c0 .025 0 .046.012.07 0 .024.012.047.024.07.011.023.035.035.058.047.023.012.047.012.07.012H9.52c.135 0 .26-.077.29-.212l.74-4.773.023-.13.012-.071c.023-.142.15-.236.29-.236h.607c3.656 0 6.56-1.505 7.423-5.858.312-1.59.135-2.921-.683-3.857z"></path>
                      <path d="M21.047 6.893c-.07.4-.16.81-.27 1.232-.98 5.05-4.349 6.796-8.646 6.796h-2.19c-.522 0-.967.382-1.048.9l-1.12 7.106c-.048.307.17.593.48.593h3.96c.4 0 .739-.293.8-.693l.036-.18.654-4.195.043-.224c.059-.4.4-.693.8-.693h.503c3.254 0 5.806-1.336 6.557-5.207.308-1.621.15-2.977-.664-3.932a3.592 3.592 0 0 0-.705-.503z"></path>
                    </svg>
                    <span className="font-medium">PayPal</span>
                  </>
                ) : (
                  <span className="font-medium">{booking.payment.method}</span>
                )}
                
                <Badge className={
                  booking.payment.status === 'completed' ? 'bg-green-500 ml-2' : 
                  booking.payment.status === 'pending' ? 'bg-yellow-500 ml-2' : 
                  'bg-red-500 ml-2'
                }>
                  {booking.payment.status}
                </Badge>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{booking.nightCount} nights × {booking.roomType.pricePerNight.currency} {booking.roomType.pricePerNight.amount}</span>
                  <span>{booking.roomType.pricePerNight.currency} {(booking.totalPrice - booking.serviceFee).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service fee</span>
                  <span>{booking.roomType.pricePerNight.currency} {booking.serviceFee.toLocaleString()}</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-semibold">
                  <span>Total paid</span>
                  <span>{booking.roomType.pricePerNight.currency} {booking.totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50 border-t">
              <p className="text-sm text-gray-600">
                For any questions or changes to your booking, please contact the venue directly.
              </p>
            </CardFooter>
          </Card>
          
          <div className="flex gap-4 justify-center mt-8">
            <Button onClick={() => window.print()} variant="outline">
              Print Confirmation
            </Button>
            <Button onClick={() => navigate(`/venues/${booking.venue._id}`)}>
              View Venue
            </Button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default BookingConfirmationPage; 