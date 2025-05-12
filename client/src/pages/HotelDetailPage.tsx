import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import { MapPin, Star, Calendar, Wifi, Coffee, Waves, Utensils, Check, Phone, Loader2, Image } from 'lucide-react';
import { toast } from "sonner";
import api from '@/utils/api-fetch';

// Define the PaymentMethod type to match what's expected by the PaymentMethodSelector
type PaymentMethod = 'visa' | 'mastercard' | 'paypal' | 'ezCash' | 'unionpay' | 'alipay';

interface Venue {
  _id: string;
  name: string;
  type: string;
  location: string;
  description: string;
  imageUrl?: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country?: string;
  };
  facilities?: string[];
  amenities?: string[];
  capacity?: {
    min?: number;
    max?: number;
  };
  priceRange?: {
    currency?: string;
    min?: number;
    max?: number;
  };
}

// Mock room types since the real API doesn't have room data yet
const mockRoomTypes = [
  {
    id: 'standard',
    name: 'Standard Room',
    price: 12000,
    description: 'Comfortable room with all basic amenities.',
    amenities: ['Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Private bathroom']
  },
  {
    id: 'deluxe',
    name: 'Deluxe Room',
    price: 18500,
    description: 'Spacious room with a king-sized bed and city view.',
    amenities: ['Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Private bathroom', 'City view']
  },
  {
    id: 'suite',
    name: 'Luxury Suite',
    price: 25000,
    description: 'Luxurious suite with separate living area and panoramic views.',
    amenities: ['Air conditioning', 'Free WiFi', 'Flat-screen TV', 'Private bathroom', 'Balcony', 'Minibar', 'Living area']
  }
];

const HotelDetailPage = () => {
  const { hotelId } = useParams<{ hotelId: string }>();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<Venue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState('deluxe');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [guests, setGuests] = useState('2');
  const [addOns, setAddOns] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('visa');
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/venues/${hotelId}`);
        
        if (response.success) {
          setHotel(response.data.venue);
        } else {
          toast.error('Failed to load hotel details');
          navigate('/hotels');
        }
      } catch (error) {
        console.error('Error fetching hotel details:', error);
        toast.error('Error loading hotel details');
        navigate('/hotels');
      } finally {
        setIsLoading(false);
      }
    };

    if (hotelId) {
      fetchHotelDetails();
    }
  }, [hotelId, navigate]);
  
  const handleRoomChange = (roomId: string) => {
    setSelectedRoom(roomId);
  };
  
  const handleAddOnToggle = (addon: string) => {
    if (addOns.includes(addon)) {
      setAddOns(addOns.filter(a => a !== addon));
    } else {
      setAddOns([...addOns, addon]);
    }
  };
  
  const calculateTotal = () => {
    const room = mockRoomTypes.find(r => r.id === selectedRoom);
    let total = room ? room.price : 0;
    
    // Add costs of add-ons
    if (addOns.includes('transport')) total += 2000;
    if (addOns.includes('breakfast')) total += 1500;
    if (addOns.includes('spa')) total += 3500;
    
    return total;
  };

  const handleReservation = () => {
    if (!checkInDate || !checkOutDate) {
      toast.error("Please select check-in and check-out dates");
      return;
    }
    
    setShowPayment(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handlePayment = () => {
    toast.success(`Booking confirmed at ${hotel?.name}!`);
    setShowPayment(false);
  };
  
  const handleExternalBooking = () => {
    toast.info("Redirecting to external booking site...");
  };

  const selectedRoomData = mockRoomTypes.find(room => room.id === selectedRoom);

  // Currency conversion rates
  const currencies = [
    { code: 'LKR', symbol: 'Rs', rate: 1 },
    { code: 'USD', symbol: '$', rate: 1/320 },
    { code: 'EUR', symbol: '€', rate: 1/350 },
    { code: 'GBP', symbol: '£', rate: 1/400 },
  ];
  
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  const convertPrice = (price: number) => {
    const converted = price * selectedCurrency.rate;
    return `${selectedCurrency.symbol} ${converted.toFixed(2)} ${selectedCurrency.code}`;
  };

  // Create an array of amenity icons based on the hotel's data
  const getAmenityIcon = (amenity: string) => {
    const amenityLower = amenity.toLowerCase();
    if (amenityLower.includes('wifi') || amenityLower.includes('internet')) return Wifi;
    if (amenityLower.includes('breakfast') || amenityLower.includes('coffee')) return Coffee;
    if (amenityLower.includes('pool') || amenityLower.includes('swim')) return Waves;
    if (amenityLower.includes('restaurant') || amenityLower.includes('food')) return Utensils;
    return Check;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-gray-400" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-grow flex flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Hotel Not Found</h1>
          <p className="text-gray-600 mb-6">Sorry, we couldn't find the hotel you're looking for.</p>
          <Button onClick={() => navigate('/hotels')}>Back to Hotels</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {showPayment ? (
          <div className="container-custom py-12 max-w-4xl mx-auto">
            <Button 
              onClick={() => setShowPayment(false)} 
              variant="outline" 
              className="mb-6"
            >
              &larr; Back to Hotel Details
            </Button>
            
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-4">Complete Your Booking</h2>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Booking Summary</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between mb-2">
                    <span>Hotel:</span>
                    <span className="font-medium">{hotel.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Room Type:</span>
                    <span className="font-medium">{selectedRoomData?.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Check-in Date:</span>
                    <span className="font-medium">{checkInDate}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Check-out Date:</span>
                    <span className="font-medium">{checkOutDate}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Guests:</span>
                    <span className="font-medium">{guests}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span>Add-ons:</span>
                    <span className="font-medium">{addOns.length > 0 ? 
                      addOns.map(addon => {
                        if (addon === 'transport') return 'Event Transport';
                        if (addon === 'breakfast') return 'Premium Breakfast';
                        if (addon === 'spa') return 'Spa Package';
                        return addon;
                      }).join(', ') 
                      : 'None'}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex justify-between font-bold">
                      <span>Total Amount:</span>
                      <div className="text-right">
                        <div className="text-eventuraa-blue">LKR {calculateTotal().toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{convertPrice(calculateTotal())}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block">Select Currency</label>
                  <div className="flex gap-2 flex-wrap">
                    {currencies.map(currency => (
                      <Button
                        key={currency.code}
                        variant={selectedCurrency.code === currency.code ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCurrency(currency)}
                        className="min-w-[80px]"
                      >
                        {currency.code}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
              
              <PaymentMethodSelector 
                onPaymentMethodSelect={setPaymentMethod}
                selectedMethod={paymentMethod}
              />
              
              <div className="mt-8 flex flex-col gap-4">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg"
                  onClick={handlePayment}
                >
                  Complete Payment & Confirm Booking
                </Button>
                
                <div className="flex flex-col space-y-2 bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium">Tourist-friendly customer support available 24/7</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    <span className="text-sm font-medium">Free cancellation available up to 24 hours before check-in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            {/* Hero Section */}
            <div className="relative h-96 bg-gray-200">
              {hotel.imageUrl ? (
                <img 
                  src={hotel.imageUrl} 
                  alt={hotel.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Image className="h-24 w-24 text-gray-400" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="container-custom">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{hotel.name}</h1>
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{hotel.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span>{hotel.priceRange?.min && hotel.priceRange?.max ? 
                        `${hotel.priceRange.currency || 'LKR'} ${hotel.priceRange.min.toLocaleString()} - ${hotel.priceRange.max.toLocaleString()} / night` : 
                        'Price on request'
                      }</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
    
            {/* Main Content */}
            <div className="container-custom py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column - Hotel Details */}
                <div className="lg:col-span-2">
                  <Card className="mb-8">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-4">About This Hotel</h2>
                      <p className="text-gray-700 mb-6">{hotel.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-bold text-lg mb-3">Facilities & Amenities</h3>
                          <ul className="space-y-2">
                            {hotel.amenities && hotel.amenities.length > 0 ? (
                              hotel.amenities.map((amenity, index) => (
                                <li key={index} className="flex items-center">
                                  {React.createElement(getAmenityIcon(amenity), { className: "h-4 w-4 mr-2 text-eventuraa-blue" })}
                                  <span>{amenity}</span>
                                </li>
                              ))
                            ) : (
                              <li>No amenities information available</li>
                            )}
                            
                            {hotel.facilities && hotel.facilities.length > 0 && (
                              hotel.facilities.map((facility, index) => (
                                <li key={`facility-${index}`} className="flex items-center">
                                  <Check className="h-4 w-4 mr-2 text-eventuraa-blue" />
                                  <span>{facility}</span>
                                </li>
                              ))
                            )}
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="font-bold text-lg mb-3">Location</h3>
                          <p className="mb-2">
                            <MapPin className="h-4 w-4 inline mr-1 text-eventuraa-blue" />
                            {hotel.address?.street ? (
                              <>
                                {hotel.address.street}, {hotel.address.city || ''} 
                                {hotel.address.district ? `, ${hotel.address.district}` : ''}
                                {hotel.address.postalCode ? ` ${hotel.address.postalCode}` : ''}
                              </>
                            ) : (
                              hotel.location
                            )}
                          </p>
                          
                          {hotel.capacity?.min && hotel.capacity?.max && (
                            <p className="mb-6">
                              <span className="font-medium">Capacity: </span>
                              {hotel.capacity.min} - {hotel.capacity.max} guests
                            </p>
                          )}
                          
                          <div className="bg-gray-100 h-40 rounded-md flex items-center justify-center text-gray-500">
                            <span>Map preview not available</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="mb-8">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-4">Room Options</h2>
                      <Tabs defaultValue="standard" onValueChange={handleRoomChange} value={selectedRoom}>
                        <TabsList className="mb-4">
                          {mockRoomTypes.map(room => (
                            <TabsTrigger key={room.id} value={room.id}>{room.name}</TabsTrigger>
                          ))}
                        </TabsList>
                        
                        {mockRoomTypes.map(room => (
                          <TabsContent key={room.id} value={room.id} className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-md">
                              <div className="flex justify-between mb-2">
                                <h3 className="font-bold">{room.name}</h3>
                                <div className="text-eventuraa-blue font-bold">
                                  LKR {room.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">/ night</span>
                                </div>
                              </div>
                              <p className="text-gray-700 mb-3">{room.description}</p>
                              <div className="flex flex-wrap gap-2">
                                {room.amenities.map((amenity, index) => (
                                  <span key={index} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs">
                                    {amenity}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                  
                  <Card className="mb-8">
                    <CardContent className="p-6">
                      <h2 className="text-2xl font-bold mb-4">Policies</h2>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-1 text-eventuraa-blue" />
                          <span>Free cancellation until 24 hours before check-in</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-1 text-eventuraa-blue" />
                          <span>Check-in from 14:00, Check-out by 12:00</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-1 text-eventuraa-blue" />
                          <span>No pets allowed</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-1 text-eventuraa-blue" />
                          <span>No smoking in rooms</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Right Column - Booking Widget */}
                <div>
                  <Card className="mb-6 sticky top-4">
                    <CardContent className="p-6">
                      <h2 className="text-xl font-bold mb-4">Book Your Stay</h2>
                      
                      <div className="space-y-4 mb-6">
                        <div>
                          <Label htmlFor="checkIn">Check-in Date</Label>
                          <Input 
                            id="checkIn" 
                            type="date" 
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="checkOut">Check-out Date</Label>
                          <Input 
                            id="checkOut" 
                            type="date" 
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            min={checkInDate || new Date().toISOString().split('T')[0]}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="guests">Number of Guests</Label>
                          <select 
                            id="guests"
                            value={guests}
                            onChange={(e) => setGuests(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-eventuraa-blue focus:ring-eventuraa-blue"
                          >
                            <option value="1">1 Guest</option>
                            <option value="2">2 Guests</option>
                            <option value="3">3 Guests</option>
                            <option value="4">4 Guests</option>
                            <option value="5">5+ Guests</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <Label>Add-ons</Label>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="transport" 
                            checked={addOns.includes('transport')}
                            onCheckedChange={() => handleAddOnToggle('transport')}
                          />
                          <Label htmlFor="transport" className="cursor-pointer">
                            Event Transport Package
                            <div className="text-sm text-gray-500">LKR 2,000</div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="breakfast" 
                            checked={addOns.includes('breakfast')}
                            onCheckedChange={() => handleAddOnToggle('breakfast')}
                          />
                          <Label htmlFor="breakfast" className="cursor-pointer">
                            Premium Breakfast
                            <div className="text-sm text-gray-500">LKR 1,500 per day</div>
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="spa" 
                            checked={addOns.includes('spa')}
                            onCheckedChange={() => handleAddOnToggle('spa')}
                          />
                          <Label htmlFor="spa" className="cursor-pointer">
                            Spa Package
                            <div className="text-sm text-gray-500">LKR 3,500</div>
                          </Label>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-md mb-6">
                        <div className="flex justify-between mb-1">
                          <span>Room Cost:</span>
                          <span>LKR {selectedRoomData ? selectedRoomData.price.toLocaleString() : '0'}</span>
                        </div>
                        {addOns.includes('transport') && (
                          <div className="flex justify-between mb-1">
                            <span>Event Transport:</span>
                            <span>LKR 2,000</span>
                          </div>
                        )}
                        {addOns.includes('breakfast') && (
                          <div className="flex justify-between mb-1">
                            <span>Premium Breakfast:</span>
                            <span>LKR 1,500</span>
                          </div>
                        )}
                        {addOns.includes('spa') && (
                          <div className="flex justify-between mb-1">
                            <span>Spa Package:</span>
                            <span>LKR 3,500</span>
                          </div>
                        )}
                        <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                          <span>Total:</span>
                          <span className="text-eventuraa-blue">LKR {calculateTotal().toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-eventuraa-blue hover:bg-blue-700"
                          onClick={handleReservation}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          Reserve Now
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={handleExternalBooking}
                        >
                          Book on Booking.com
                        </Button>
                        
                        <div className="flex items-center justify-center space-x-2 text-gray-500 text-sm">
                          <Phone className="h-4 w-4" />
                          <span>Need help? Call +94 77 123 4567</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default HotelDetailPage;
