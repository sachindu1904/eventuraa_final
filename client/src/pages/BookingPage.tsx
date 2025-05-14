import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, ArrowLeft, AlertCircle, 
  Loader2, CreditCard, Users, Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { addDays, differenceInDays, format } from "date-fns";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import api, { ApiResponse, VenueResponseData } from '@/utils/api-fetch';
import useAuth from '@/hooks/useAuth';

// Define interfaces for data
interface RoomType {
  _id: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerNight: {
    amount: number;
    currency: string;
  };
  images?: Array<{
    _id: string;
    url: string;
    isMain?: boolean;
  }>;
  amenities?: string[];
  totalRooms: number;
  availableRooms: number;
}

interface Venue {
  _id: string;
  name: string;
  type: string;
  description?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  venueHost?: string;
  contactInfo: {
    phone: string;
    email: string;
    website?: string;
  };
  images?: Array<{
    _id: string;
    url: string;
    isMain?: boolean;
  }>;
}

// Define form schema
const bookingFormSchema = z.object({
  dateRange: z.object({
    from: z.date({
      required_error: "Please select a check-in date",
    }),
    to: z.date({
      required_error: "Please select a check-out date",
    }),
  }),
  guests: z.number().min(1, "At least 1 guest required"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Phone number is required"),
  specialRequests: z.string().optional(),
  paymentMethod: z.enum(['credit_card', 'paypal']),
  // Credit card fields
  cardNumber: z.string().optional().refine(
    (val) => !val || val.replace(/\s/g, '').length >= 15,
    { message: "Card number must be at least 15 digits" }
  ),
  cardHolderName: z.string().optional(),
  expiryDate: z.string().optional(),
  cvv: z.string().optional(),
});

// Create a type from the schema
type BookingFormValues = z.infer<typeof bookingFormSchema>;

const BookingPage: React.FC = () => {
  const { venueId, roomTypeId } = useParams<{ venueId: string; roomTypeId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, userData } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up the form with react-hook-form and zod
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      dateRange: {
        from: undefined,
        to: undefined,
      },
      guests: 1,
      firstName: userData?.name?.split(' ')[0] || '',
      lastName: userData?.name?.split(' ').slice(1).join(' ') || '',
      email: userData?.email || '',
      phone: '',
      specialRequests: '',
      paymentMethod: 'credit_card',
      cardNumber: '',
      cardHolderName: '',
      expiryDate: '',
      cvv: '',
    },
  });

  // Watch payment method to conditionally show credit card fields
  const watchPaymentMethod = form.watch('paymentMethod');
  const watchDateRange = form.watch('dateRange');

  useEffect(() => {
    const fetchVenueAndRoomType = async () => {
      if (!venueId || !roomTypeId) return;
      
      setLoading(true);
      try {
        // Fetch venue details with specified room type
        const response = await api.get<ApiResponse<VenueResponseData>>(`/venues/${venueId}?roomTypeId=${roomTypeId}`);
        
        if (response.success && response.data) {
          if (response.data.venue) {
            setVenue(response.data.venue);
          } else {
            setError('Venue not found');
            return;
          }
          
          // Find the specific room type
          if (response.data.roomTypes && Array.isArray(response.data.roomTypes) && response.data.roomTypes.length > 0) {
            const foundRoomType = response.data.roomTypes.find(rt => rt._id === roomTypeId);
            if (foundRoomType) {
              setRoomType(foundRoomType);
            } else {
              setError('Room type not found');
            }
          } else {
            setError('No room types available');
          }
        } else {
          setError(response.message || 'Failed to load venue details');
          toast.error('Failed to load venue details');
        }
      } catch (error) {
        console.error('Error fetching venue details:', error);
        setError('An error occurred while loading the venue');
        toast.error('Failed to load venue. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchVenueAndRoomType();
  }, [venueId, roomTypeId]);

  // Calculate total night count
  const getNightCount = () => {
    if (watchDateRange.from && watchDateRange.to) {
      return Math.max(1, differenceInDays(watchDateRange.to, watchDateRange.from));
    }
    return 1;
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!roomType) return 0;
    const nightCount = getNightCount();
    return roomType.pricePerNight.amount * nightCount;
  };

  // Calculate service fee (5%)
  const getServiceFee = () => {
    return calculateTotalPrice() * 0.05;
  };

  // Calculate final total
  const getFinalTotal = () => {
    return calculateTotalPrice() + getServiceFee();
  };

  // Handle form submission
  const handleBookingSubmit = async (values: BookingFormValues) => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Save booking data in session storage
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        venueId,
        roomTypeId,
        ...values
      }));
      
      // Redirect to sign in page
      navigate(`/signin?redirect=${encodeURIComponent(window.location.pathname)}`);
      toast.info('Please sign in to complete your booking');
      return;
    }
    
    if (!venue || !roomType) {
      toast.error('Missing venue or room type information');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare payment data based on selected method
      const paymentData = values.paymentMethod === 'credit_card' 
        ? { 
            method: 'credit_card',
            details: {
              // Only send non-sensitive info for demonstration
              // In a real app, you'd use a payment processor SDK
              cardHolderName: values.cardHolderName,
              lastFourDigits: values.cardNumber ? values.cardNumber.slice(-4) : undefined
            }
          }
        : { method: 'paypal' };
      
      // Create booking data
      const bookingData = {
        venue: venue._id,
        roomType: roomType._id,
        checkInDate: values.dateRange.from,
        checkOutDate: values.dateRange.to,
        guests: values.guests,
        specialRequests: values.specialRequests,
        contactInfo: {
          firstName: values.firstName,
          lastName: values.lastName, 
          email: values.email,
          phone: values.phone
        },
        payment: paymentData,
        totalPrice: getFinalTotal(),
        serviceFee: getServiceFee(),
        nightCount: getNightCount()
      };
      
      const response = await api.post('/bookings', bookingData);
      
      if (response.success && response.data) {
        toast.success('Booking completed successfully!');
        
        // Store the booking ID for confirmation page
        const bookingId = response.data.bookingId || response.data._id;
        
        // For PayPal, we would normally redirect to PayPal here
        if (values.paymentMethod === 'paypal') {
          // This is just a simulation - in a real app you'd redirect to PayPal
          toast.info('Redirecting to PayPal...');
          // Simulating PayPal redirect delay
          setTimeout(() => {
            window.location.href = `/booking-confirmation/${bookingId}`;
          }, 1500);
        } else {
          // For credit card, navigate directly to confirmation
          window.location.href = `/booking-confirmation/${bookingId}`;
        }
      } else {
        toast.error(response.message || 'Failed to complete booking');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error('An error occurred while processing your booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate(`/venues/${venueId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Loading booking form...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !venue || !roomType) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md p-8 rounded-lg border border-gray-200">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Room Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The room you're trying to book doesn't exist or has been removed."}
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
          Back to Venue
        </Button>
        
        <h1 className="text-2xl font-bold mb-6">Complete Your Booking</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleBookingSubmit)} className="space-y-6">
                {/* Room Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Room Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="md:w-1/3">
                        {roomType.images && roomType.images.length > 0 ? (
                          <img 
                            src={roomType.images[0].url} 
                            alt={roomType.name}
                            className="w-full h-auto object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md">
                            <Home className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="md:w-2/3">
                        <h3 className="text-xl font-semibold">{roomType.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{venue.name}</p>
                        <p className="text-gray-600 text-sm mb-2">
                          {venue.address.city}, {venue.address.country}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Capacity:</span>
                            <span className="text-sm font-medium">{roomType.capacity} {roomType.capacity > 1 ? 'persons' : 'person'}</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-gray-600 text-sm">Price per night:</span>
                            <span className="text-sm font-medium">{roomType.pricePerNight.currency} {roomType.pricePerNight.amount.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Stay Details */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Stay Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dateRange"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Check-in and Check-out Dates</FormLabel>
                          <FormControl>
                            <DatePickerWithRange 
                              selected={field.value} 
                              onSelect={(range) => {
                                field.onChange(range);
                                // Update form validation when both dates are selected
                                if (range?.from && range?.to) {
                                  form.trigger("dateRange");
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            {field.value?.from && !field.value?.to && 
                              "Please select your check-out date"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="guests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Guests</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={roomType.capacity}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum capacity: {roomType.capacity} guests
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                {/* Guest Information */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Guest Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="specialRequests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Requests (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              placeholder="Any special requests or requirements for your stay"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                
                {/* Payment Method */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="paymentMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup 
                              value={field.value} 
                              onValueChange={field.onChange}
                              className="space-y-4"
                            >
                              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-gray-50 cursor-pointer">
                                <RadioGroupItem value="credit_card" id="credit_card" />
                                <Label htmlFor="credit_card" className="flex items-center cursor-pointer">
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
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {watchPaymentMethod === 'credit_card' && (
                      <div className="mt-4 space-y-4">
                        <FormField
                          control={form.control}
                          name="cardNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Number</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="1234 5678 9012 3456"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="cardHolderName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cardholder Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="John Doe"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="expiryDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Expiry Date (MM/YY)</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="MM/YY"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="cvv"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>CVV</FormLabel>
                                <FormControl>
                                  <Input
                                    type="password"
                                    maxLength={4}
                                    placeholder="123"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                      Processing...
                    </>
                  ) : (
                    'Complete Booking'
                  )}
                </Button>
              </form>
            </Form>
          </div>
          
          {/* Booking Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-semibold">{roomType.name}</h3>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{form.watch('guests')} guests</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Check-in</span>
                    <span className="font-medium">
                      {watchDateRange.from 
                        ? format(watchDateRange.from, 'EEE, MMM d, yyyy') 
                        : 'Select date'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Check-out</span>
                    <span className="font-medium">
                      {watchDateRange.to 
                        ? format(watchDateRange.to, 'EEE, MMM d, yyyy') 
                        : 'Select date'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Total nights</span>
                    <span className="font-medium">{getNightCount()}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{getNightCount()} nights × {roomType.pricePerNight.currency} {roomType.pricePerNight.amount}</span>
                    <span>{roomType.pricePerNight.currency} {calculateTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service fee</span>
                    <span>{roomType.pricePerNight.currency} {getServiceFee().toLocaleString()}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{roomType.pricePerNight.currency} {getFinalTotal().toLocaleString()}</span>
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

export default BookingPage; 