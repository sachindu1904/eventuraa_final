import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowLeft, AlertCircle, Loader2, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import api, { ApiResponse } from '@/utils/api-fetch';
import useAuth from '@/hooks/useAuth';

interface TicketType {
  name: string;
  price: number;
  quantity: number;
  available: number;
}

interface EventData {
  _id: string;
  title: string;
  date: string;
  time: string;
  location: {
    name: string;
    address: string;
    city: string;
  };
  ticketTypes: TicketType[];
  organizer: {
    companyName: string;
  };
}

interface EventResponse {
  event: EventData;
}

interface BookingResponse {
  bookingId?: string;
  transactionId?: string;
  tickets?: Array<{
    ticketNumber: string;
    ticketType: string;
    price: number;
  }>;
}

const TicketCheckoutPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, userData } = useAuth();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ticketCounts, setTicketCounts] = useState<Record<string, number>>({});
  const [contactInfo, setContactInfo] = useState({
    fullName: userData?.name || '',
    email: userData?.email || '',
    phoneNumber: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'credit-card' | 'paypal'>('credit-card');
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    cardHolderName: '',
    expiryDate: '',
    cvv: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get<EventResponse>(`/events/${eventId}`);
        
        if (response.success && response.data) {
          setEvent(response.data.event);
          
          // Initialize ticket counts to zero
          const initialCounts: Record<string, number> = {};
          if (response.data.event.ticketTypes) {
            response.data.event.ticketTypes.forEach((ticket: TicketType) => {
              initialCounts[ticket.name] = 0;
            });
          }
          setTicketCounts(initialCounts);
        } else {
          setError(response.message || 'Failed to load event details');
          toast.error('Failed to load event details');
        }
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('An error occurred while loading the event');
        toast.error('Failed to load event. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, isAuthenticated, userData]);

  const handleTicketChange = (ticketName: string, value: number) => {
    const ticket = event?.ticketTypes.find(t => t.name === ticketName);
    if (ticket) {
      const newValue = Math.max(0, Math.min(value, ticket.available, 4)); // Limit to available tickets and max 4
      setTicketCounts({
        ...ticketCounts,
        [ticketName]: newValue
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setContactInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCardDetailsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getTotalAmount = () => {
    if (!event) return 0;
    
    return Object.entries(ticketCounts).reduce((total, [name, count]) => {
      const ticketType = event.ticketTypes.find(t => t.name === name);
      return total + (ticketType ? ticketType.price * count : 0);
    }, 0);
  };

  const getServiceFee = () => {
    return getTotalAmount() * 0.05; // 5% service fee
  };

  const getFinalTotal = () => {
    return getTotalAmount() + getServiceFee();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const totalTickets = Object.values(ticketCounts).reduce((sum, count) => sum + count, 0);
    if (totalTickets === 0) {
      toast.error('Please select at least one ticket');
      return;
    }

    if (!contactInfo.fullName || !contactInfo.email || !contactInfo.phoneNumber) {
      toast.error('Please fill in all contact information');
      return;
    }

    // Validate payment information based on selected method
    if (paymentMethod === 'credit-card') {
      if (!cardDetails.cardNumber || !cardDetails.cardHolderName || 
          !cardDetails.expiryDate || !cardDetails.cvv) {
        toast.error('Please complete all card details');
        return;
      }
    }

    // Check if user is authenticated before proceeding
    if (!isAuthenticated) {
      // Save the selection in sessionStorage
      sessionStorage.setItem('pendingTicketPurchase', JSON.stringify({
        eventId,
        ticketCounts,
        contactInfo,
        paymentMethod
      }));
      
      // Redirect to sign in page
      navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      toast.info('Please sign in to complete your purchase');
      return;
    }

    // Prepare ticket data
    const selectedTickets = Object.entries(ticketCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, count]) => {
        const ticket = event?.ticketTypes.find(t => t.name === name);
        return {
          ticketType: name,
          quantity: count,
          pricePerTicket: ticket?.price || 0
        };
      });

    // Prepare payment data based on selected method
    const paymentData = paymentMethod === 'credit-card' 
      ? { 
          method: 'credit-card',
          details: {
            // Only send non-sensitive info for demonstration
            // In a real app, you'd use a payment processor SDK
            cardHolderName: cardDetails.cardHolderName,
            lastFourDigits: cardDetails.cardNumber.slice(-4)
          }
        }
      : { method: 'paypal' };

    setIsSubmitting(true);

    try {
      // Call the ticket purchase API endpoint
      const response = await api.post<BookingResponse>('/tickets/purchase', {
        eventId,
        tickets: selectedTickets,
        contactInfo,
        payment: paymentData,
        totalAmount: getFinalTotal(),
        serviceFee: getServiceFee()
      });

      if (response.success && response.data) {
        toast.success('Tickets purchased successfully!');
        
        // For PayPal, we would normally redirect to PayPal here
        if (paymentMethod === 'paypal') {
          // This is just a simulation - in a real app you'd redirect to PayPal
          toast.info('Redirecting to PayPal...');
          // Simulating PayPal redirect delay
          setTimeout(() => {
            if (response.data.bookingId) {
              navigate(`/bookings/${response.data.bookingId}`);
            } else {
              navigate('/my-bookings');
            }
          }, 1500);
        } else {
          // For credit card, navigate directly to confirmation
          if (response.data.bookingId) {
            navigate(`/bookings/${response.data.bookingId}`);
          } else {
            navigate('/my-bookings');
          }
        }
      } else {
        toast.error(response.message || 'Failed to complete purchase');
      }
    } catch (error) {
      console.error('Error purchasing tickets:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-8 rounded-lg border border-gray-200">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The event you're trying to purchase tickets for doesn't exist or has been removed."}
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

  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
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
          Back to Event
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Complete Your Purchase</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {/* Ticket Selection */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Select Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                  {event.ticketTypes.map((ticket, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <h3 className="font-medium">{ticket.name}</h3>
                        <p className="text-sm text-gray-500">
                          {ticket.available} available
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-semibold">LKR {ticket.price.toLocaleString()}</span>
                        <div className="flex items-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleTicketChange(ticket.name, (ticketCounts[ticket.name] || 0) - 1)}
                            disabled={!ticketCounts[ticket.name]}
                          >
                            -
                          </Button>
                          <span className="w-10 text-center">
                            {ticketCounts[ticket.name] || 0}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={() => handleTicketChange(ticket.name, (ticketCounts[ticket.name] || 0) + 1)}
                            disabled={ticketCounts[ticket.name] >= Math.min(ticket.available, 4)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-4">* Maximum 4 tickets per type</p>
                </CardContent>
              </Card>
              
              {/* Contact Information */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={contactInfo.fullName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={contactInfo.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      value={contactInfo.phoneNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your phone number"
                      required
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Payment Method */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Payment Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup 
                    value={paymentMethod} 
                    onValueChange={(value) => setPaymentMethod(value as 'credit-card' | 'paypal')}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="credit-card" id="credit-card" />
                      <Label htmlFor="credit-card" className="flex items-center cursor-pointer">
                        <CreditCard className="h-5 w-5 mr-2 text-gray-600" />
                        <span>Credit / Debit Card</span>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                      <RadioGroupItem value="paypal" id="paypal" />
                      <Label htmlFor="paypal" className="flex items-center cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 mr-2 text-[#003087] fill-current">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.378-1.012-3.35-1.207-5.836-1.207h-5.92c-.101 0-.187.077-.202.178L6.65 18.447c0 .025 0 .046.012.07 0 .024.012.047.024.07.011.023.035.035.058.047.023.012.047.012.07.012H9.52c.135 0 .26-.077.29-.212l.74-4.773.023-.13.012-.071c.023-.142.15-.236.29-.236h.607c3.656 0 6.56-1.505 7.423-5.858.312-1.59.135-2.921-.683-3.857z"></path>
                          <path d="M21.047 6.893c-.07.4-.16.81-.27 1.232-.98 5.05-4.349 6.796-8.646 6.796h-2.19c-.522 0-.967.382-1.048.9l-1.12 7.106c-.048.307.17.593.48.593h3.96c.4 0 .739-.293.8-.693l.036-.18.654-4.195.043-.224c.059-.4.4-.693.8-.693h.503c3.254 0 5.806-1.336 6.557-5.207.308-1.621.15-2.977-.664-3.932a3.592 3.592 0 0 0-.705-.503z"></path>
                        </svg>
                        <span>PayPal</span>
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  {paymentMethod === 'credit-card' && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          placeholder="1234 5678 9012 3456"
                          value={cardDetails.cardNumber}
                          onChange={handleCardDetailsChange}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cardHolderName">Cardholder Name</Label>
                        <Input
                          id="cardHolderName"
                          name="cardHolderName"
                          placeholder="John Doe"
                          value={cardDetails.cardHolderName}
                          onChange={handleCardDetailsChange}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Expiry Date (MM/YY)</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={cardDetails.expiryDate}
                            onChange={handleCardDetailsChange}
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            type="password"
                            placeholder="123"
                            maxLength={4}
                            value={cardDetails.cvv}
                            onChange={handleCardDetailsChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'paypal' && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-600">
                        You will be redirected to PayPal to complete your payment after submitting your order.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="mt-6 lg:hidden">
                <Button 
                  type="submit" 
                  className="w-full bg-[#7E69AB] hover:bg-[#6E59A5]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Complete Purchase'
                  )}
                </Button>
              </div>
            </form>
          </div>
          
          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">{event.title}</h3>
                    <p className="text-sm text-gray-600">{formattedDate}, {event.time}</p>
                    <p className="text-sm text-gray-600">{event.location.name}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    {Object.entries(ticketCounts)
                      .filter(([_, count]) => count > 0)
                      .map(([name, count]) => {
                        const ticket = event.ticketTypes.find(t => t.name === name);
                        return (
                          <div key={name} className="flex justify-between">
                            <span>{count} × {name}</span>
                            <span>LKR {((ticket?.price || 0) * count).toLocaleString()}</span>
                          </div>
                        );
                      })}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>LKR {getTotalAmount().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Service Fee (5%)</span>
                      <span>LKR {getServiceFee().toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>LKR {getFinalTotal().toLocaleString()}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="py-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span>Payment Method:</span>
                      <span className="ml-auto">
                        {paymentMethod === 'credit-card' ? (
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            <span>Credit / Debit Card</span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4 mr-1 text-[#003087] fill-current">
                              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-1.378-1.012-3.35-1.207-5.836-1.207h-5.92c-.101 0-.187.077-.202.178L6.65 18.447c0 .025 0 .046.012.07 0 .024.012.047.024.07.011.023.035.035.058.047.023.012.047.012.07.012H9.52c.135 0 .26-.077.29-.212l.74-4.773.023-.13.012-.071c.023-.142.15-.236.29-.236h.607c3.656 0 6.56-1.505 7.423-5.858.312-1.59.135-2.921-.683-3.857z"></path>
                              <path d="M21.047 6.893c-.07.4-.16.81-.27 1.232-.98 5.05-4.349 6.796-8.646 6.796h-2.19c-.522 0-.967.382-1.048.9l-1.12 7.106c-.048.307.17.593.48.593h3.96c.4 0 .739-.293.8-.693l.036-.18.654-4.195.043-.224c.059-.4.4-.693.8-.693h.503c3.254 0 5.806-1.336 6.557-5.207.308-1.621.15-2.977-.664-3.932a3.592 3.592 0 0 0-.705-.503z"></path>
                            </svg>
                            <span>PayPal</span>
                          </div>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="hidden lg:block mt-6">
                    <Button 
                      type="submit"
                      form="checkout-form"
                      className="w-full bg-[#7E69AB] hover:bg-[#6E59A5]"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Complete Purchase'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TicketCheckoutPage; 