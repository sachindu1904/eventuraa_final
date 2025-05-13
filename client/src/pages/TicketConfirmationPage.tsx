import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Ticket, Calendar, MapPin, Clock, Download, Loader2, User, TicketIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import api from '@/utils/api-fetch';
import useAuth from '@/hooks/useAuth';

interface PurchaseTicket {
  ticketNumber: string;
  ticketType: string;
  price: number;
  status: string;
}

interface PurchaseData {
  _id: string;
  transactionId: string;
  purchaseDate: string;
  tickets: PurchaseTicket[];
  totalAmount: number;
  serviceFee: number;
  status: string;
  payment: {
    method: string;
    status: string;
  };
  contactInfo: {
    fullName: string;
    email: string;
    phoneNumber: string;
  };
  event: {
    _id: string;
    title: string;
    date: string;
    time: string;
    location: {
      name: string;
      address: string;
      city: string;
    };
    coverImage?: string;
  };
}

// Add interface for user bookings page
interface UserBookingData {
  _id: string;
  transactionId: string;
  purchaseDate: string;
  event: {
    _id: string;
    title: string;
    date: string;
    coverImage?: string;
  };
  tickets: {
    ticketType: string;
    price: number;
  }[];
  totalAmount: number;
  status: string;
}

const TicketConfirmationPage: React.FC = () => {
  const { purchaseId } = useParams<{ purchaseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [purchase, setPurchase] = useState<PurchaseData | null>(null);
  const [userBookings, setUserBookings] = useState<UserBookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const fetchPurchaseDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/tickets/${purchaseId}`);
        
        if (response.success && response.data) {
          setPurchase(response.data);
        } else {
          setError(response.message || 'Failed to load ticket details');
          toast.error('Failed to load ticket details');
        }
      } catch (error) {
        console.error('Error fetching ticket purchase:', error);
        setError('An error occurred while loading the ticket');
        toast.error('Failed to load ticket. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserBookings = async () => {
      setLoading(true);
      try {
        const response = await api.get('/tickets/my-purchases');
        
        if (response.success && response.data) {
          setUserBookings(response.data);
        } else {
          setError(response.message || 'Failed to load your bookings');
          toast.error('Failed to load your bookings');
        }
      } catch (error) {
        console.error('Error fetching user bookings:', error);
        setError('An error occurred while loading your bookings');
        toast.error('Failed to load your bookings. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (purchaseId && isAuthenticated) {
      fetchPurchaseDetails();
    } else if (isAuthenticated) {
      // If no purchaseId is provided, fetch all user bookings
      fetchUserBookings();
    }
  }, [purchaseId, isAuthenticated, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  // Add a function to render the list of user bookings
  const renderUserBookings = () => {
    if (userBookings.length === 0) {
      return (
        <div className="text-center p-8 border border-dashed rounded-lg mt-8">
          <TicketIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-bold mb-2">No Tickets Yet</h2>
          <p className="text-gray-600 mb-6">You haven't purchased any tickets yet.</p>
          <Button asChild>
            <Link to="/events">Browse Events</Link>
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Tickets</h1>
        
        {userBookings.map((booking) => {
          const eventDate = new Date(booking.event.date);
          const formattedDate = eventDate.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          
          return (
            <Card key={booking._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/4 bg-gray-100 p-4 flex justify-center items-center">
                    <Calendar className="h-16 w-16 text-purple-500" />
                  </div>
                  <div className="p-6 flex-1">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{booking.event.title}</h3>
                        <p className="text-sm text-gray-600">{formattedDate}</p>
                      </div>
                      <Badge className="mt-2 md:mt-0 w-fit">{booking.status}</Badge>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
                      <div className="flex items-center">
                        <Ticket className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{booking.tickets.length} ticket(s)</span>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <p className="font-medium">LKR {booking.totalAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <Button asChild size="sm">
                        <Link to={`/bookings/${booking._id}`}>View Details</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">
              {purchaseId ? 'Loading your tickets...' : 'Loading your bookings...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (purchaseId && (error || !purchase)) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-8 rounded-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-4">Ticket Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The ticket you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const eventDate = new Date(purchase.event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const purchaseDate = new Date(purchase.purchaseDate);
  const formattedPurchaseDate = purchaseDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <Button 
          variant="outline" 
          className="mb-6" 
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        {purchaseId && purchase ? (
          // Display single purchase details when purchaseId is available
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 text-center">
              <Badge className="mb-2 bg-green-500">Confirmed</Badge>
              <h1 className="text-2xl md:text-3xl font-bold">Your Tickets are Ready!</h1>
              <p className="text-gray-600 mt-2">
                Transaction ID: {purchase.transactionId}
              </p>
            </div>
            
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">{purchase.event.title}</h2>
                  <div className="mt-2 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{purchase.event.time}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>
                        {purchase.event.location.name}, {purchase.event.location.address}, {purchase.event.location.city}
                      </span>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-2">Your Information</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{purchase.contactInfo.fullName}</span>
                    </div>
                    <p className="text-gray-600">{purchase.contactInfo.email}</p>
                    <p className="text-gray-600">{purchase.contactInfo.phoneNumber}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Your Tickets ({purchase.tickets.length})</h2>
              
              <div className="space-y-4">
                {purchase.tickets.map((ticket, index) => (
                  <Card key={index} className="overflow-hidden border-2 border-dashed border-gray-200">
                    <div className="bg-gray-50 py-2 px-4 border-b border-dashed border-gray-200">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <Ticket className="h-5 w-5 mr-2 text-[#7E69AB]" />
                          <span className="font-medium">{ticket.ticketType}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {ticket.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="py-4">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Ticket Number</p>
                          <p className="font-mono font-medium">{ticket.ticketNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                          <p className="font-medium">LKR {ticket.price.toLocaleString()}</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-8">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Purchase Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Purchase Date</span>
                    <span>{formattedPurchaseDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Method</span>
                    <span className="capitalize">{purchase.payment.method}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Payment Status</span>
                    <Badge variant={purchase.payment.status === 'completed' ? 'default' : 'outline'} className="capitalize">
                      {purchase.payment.status}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>LKR {(purchase.totalAmount - purchase.serviceFee).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee</span>
                    <span>LKR {purchase.serviceFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-medium pt-2">
                    <span>Total</span>
                    <span>LKR {purchase.totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-gray-50 border-t">
                <p className="text-xs text-gray-500">
                  Need help? Contact support@eventuraa.com
                </p>
                <Button variant="link" size="sm" asChild>
                  <Link to={`/events/${purchase.event._id}`}>
                    View Event
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        ) : (
          // Display list of all user bookings
          <div className="max-w-4xl mx-auto">
            {renderUserBookings()}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default TicketConfirmationPage; 