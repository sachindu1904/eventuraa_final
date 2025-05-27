import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Music, Search, Ticket, X, Star, Clock, Users, DollarSign, Tag, Loader2 } from 'lucide-react';
import EventSearch from '@/components/EventSearch';
import EventCard from '@/components/EventCard';
import EventSuggestions from '@/components/EventSuggestions';
import LocationSuggestions from '@/components/LocationSuggestions';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import ReviewSystem from '@/components/ReviewSystem';
import PaymentMethodSelector from '@/components/PaymentMethodSelector';
import api from '@/utils/api-fetch';
import { Link } from 'react-router-dom';

// User role enum (for future use)
enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}

// Define the real event interface
interface TicketType {
  name: string;
  price: number;
  quantity: number;
  available: number;
}

interface Event {
  _id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: {
    name: string;
    address: string;
    city: string;
    district: string;
  };
  category: string;
  eventType: string;
  ticketTypes: TicketType[];
  ticketPrice: number;
  ticketsAvailable: number;
  coverImage?: string;
  images?: string[];
  organizer: {
    _id: string;
    companyName: string;
  };
  createdAt: string;
}

// Sample suggested places
const suggestedPlaces = [
  { name: "Sigiriya Rock Fortress", distance: "2.5 km" },
  { name: "Dambulla Cave Temple", distance: "5 km" },
  { name: "The Lake Hotel", distance: "1 km" },
  { name: "Minneriya National Park", distance: "15 km" }
];

interface TicketSelection {
  type: string;
  price: number;
  quantity: number;
}

type PaymentMethod = 'visa' | 'mastercard' | 'paypal' | 'ezCash';

const EventPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [ticketSelections, setTicketSelections] = useState<TicketSelection[]>([]);
  const [activeTab, setActiveTab] = useState('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('visa');
  const [checkoutStep, setCheckoutStep] = useState(1); // 1: Tickets, 2: Payment

  // Fetch events from the API
  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const response = await api.get('/events');
        if (response.success) {
          setEvents(response.data.events);
          setFilteredEvents(response.data.events);
        } else {
          setError('Failed to fetch events');
          toast('Failed to load events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('An error occurred while loading events');
        toast('Server error. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);
  
  const handleFilter = (filters: any) => {
    // In a real app, this would filter based on the provided criteria
    console.log("Filtering with:", filters);
    
    // Apply basic filtering
    let filtered = [...events];
    
    // Filter by category if provided
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(event => 
        event.category.toLowerCase() === filters.category.toLowerCase()
      );
    }
    
    // Filter by date range if provided
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(event => new Date(event.date) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      filtered = filtered.filter(event => new Date(event.date) <= endDate);
    }
    
    // Filter by location if provided
    if (filters.location) {
      filtered = filtered.filter(event => 
        event.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
        event.location.district.toLowerCase().includes(filters.location.toLowerCase()) ||
        event.location.name.toLowerCase().includes(filters.location.toLowerCase())
      );
    }
    
    setFilteredEvents(filtered);
  };
  
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    // Initialize ticket selections based on available ticket types
    if (event.ticketTypes) {
      setTicketSelections(
        event.ticketTypes.map(type => ({
          type: type.name,
          price: type.price,
          quantity: 0
        }))
      );
    }
    setShowCheckout(true);
  };
  
  const handleTicketChange = (typeName: string, quantity: number) => {
    setTicketSelections(prev => 
      prev.map(ticket => 
        ticket.type === typeName ? {...ticket, quantity} : ticket
      )
    );
  };
  
  const getTotalCost = () => {
    const subtotal = ticketSelections.reduce(
      (sum, ticket) => sum + (ticket.price * ticket.quantity), 0
    );
    const serviceFee = subtotal * 0.05; // 5% service fee
    return {
      subtotal,
      serviceFee,
      total: subtotal + serviceFee
    };
  };
  
  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };
  
  const handleCheckout = () => {
    const { total } = getTotalCost();
    if (total === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket to proceed"
      });
      return;
    }
    
    if (checkoutStep === 1) {
      setCheckoutStep(2);
      return;
    }
    
    // Process payment
    toast({
      title: "Processing payment",
      description: `Total: LKR ${total.toFixed(2)} with ${paymentMethod}`,
    });
    
    // Simulate successful payment
    setTimeout(() => {
      toast({
        title: "Payment successful!",
        description: "Your tickets have been sent to your email",
      });
      setShowCheckout(false);
      setCheckoutStep(1); // Reset for next purchase
    }, 2000);
  };
  
  // Convert event to format expected by EventCard
  const formatEventForCard = (event: Event) => {
    // Find lowest priced ticket
    const lowestPrice = event.ticketTypes.reduce(
      (min, ticket) => Math.min(min, ticket.price), 
      event.ticketTypes[0]?.price || event.ticketPrice
    );
    
    return {
      id: event._id,
      title: event.title,
      date: new Date(event.date).toLocaleDateString() + (event.time ? ` at ${event.time}` : ''),
      location: event.location.name + (event.location.city ? `, ${event.location.city}` : ''),
      image: event.coverImage || '/placeholder-event.jpg', // Fallback image
      category: event.category,
      price: `From LKR ${lowestPrice.toLocaleString()}`,
      description: event.description,
      ticketTypes: event.ticketTypes
    };
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url('https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2074&q=80')`,
      backgroundColor: '#ffffff'
    }}>
      <Header />
      
      <main className="flex-1">
        {/* Hero Section with search */}
        <div className="bg-cover bg-center bg-no-repeat text-white py-12 md:py-24 relative" style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
        }}>
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-shadow-lg">Discover Events</h1>
            <p className="text-xl md:text-2xl mb-8 text-shadow-lg">Find and book the best events in Sri Lanka</p>
            
            <EventSearch onSearch={handleFilter} />
          </div>
        </div>
        
        {/* Featured Events Section */}
        <div className="container mx-auto px-4 py-12">
          {error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">No Events Found</h2>
              <p className="text-gray-600 mb-6">No events match your current filters, please try different criteria.</p>
              <Button onClick={() => setFilteredEvents(events)}>Show All Events</Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold">Upcoming Events</h2>
                <span className="text-gray-500">{filteredEvents.length} events found</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Link key={event._id} to={`/events/${event._id}`} className="no-underline">
                    <EventCard 
                      event={formatEventForCard(event)} 
                      onSelect={() => handleEventSelect(event)}
                    />
                  </Link>
                ))}
              </div>
            </>
          )}
          
          {/* Suggestions sections can remain */}
          {!error && (
            <>
              <EventSuggestions events={filteredEvents} />
              <LocationSuggestions places={suggestedPlaces} />
            </>
          )}
        </div>
      </main>
      
      <Footer />
      
      {/* Event Detail and Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">{selectedEvent.title}</DialogTitle>
                <DialogDescription className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  {new Date(selectedEvent.date).toLocaleDateString()}
                  {selectedEvent.time && ` • ${selectedEvent.time}`}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                <div className="md:col-span-2">
                  <div className="relative h-48 md:h-64 mb-4 overflow-hidden rounded-lg">
                    <img 
                      src={selectedEvent.coverImage || '/placeholder-event.jpg'} 
                      alt={selectedEvent.title} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex space-x-4 mb-6">
                    <button 
                      className={`pb-2 font-medium ${activeTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('details')}
                    >
                      Details
                    </button>
                    <button 
                      className={`pb-2 font-medium ${activeTab === 'reviews' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
                      onClick={() => setActiveTab('reviews')}
                    >
                      Reviews
                    </button>
                  </div>
                  
                  {activeTab === 'details' ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 mb-4">
                        <Badge>{selectedEvent.category}</Badge>
                        <Badge variant="outline">{selectedEvent.eventType}</Badge>
                      </div>
                      
                      <div className="text-gray-600 space-y-2">
                        <div className="flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                          <span>
                            {selectedEvent.location.name}, {selectedEvent.location.address}, 
                            {selectedEvent.location.city}, {selectedEvent.location.district}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Users className="h-5 w-5 mr-2 text-gray-500" />
                          <span>Organized by {selectedEvent.organizer?.companyName || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      <div className="prose max-w-none">
                        <h3 className="text-lg font-semibold">About This Event</h3>
                        <p>{selectedEvent.description}</p>
                      </div>
                    </div>
                  ) : (
                    <ReviewSystem entityId={selectedEvent._id} entityType="event" initialRating={4} />
                  )}
                </div>
                
                <div>
                  {checkoutStep === 1 ? (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="font-semibold mb-4">Select Tickets</h3>
                      
                      {selectedEvent.ticketTypes.map((ticket, index) => (
                        <div key={index} className="py-3 border-b last:border-b-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-medium">{ticket.name}</h4>
                              <p className="text-sm text-gray-500">{ticket.available} available</p>
                            </div>
                            <div className="font-semibold">
                              LKR {ticket.price.toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex justify-end items-center space-x-3">
                            <span className="text-sm text-gray-700">Quantity:</span>
                            <select 
                              value={ticketSelections.find(t => t.type === ticket.name)?.quantity || 0}
                              onChange={(e) => handleTicketChange(ticket.name, parseInt(e.target.value))}
                              className="p-1 border rounded text-center w-16"
                            >
                              {[0, 1, 2, 3, 4, 5].map(num => (
                                <option key={num} value={num}>{num}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Subtotal</span>
                          <span>LKR {getTotalCost().subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Service Fee (5%)</span>
                          <span>LKR {getTotalCost().serviceFee.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Total</span>
                          <span>LKR {getTotalCost().total.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                        onClick={handleCheckout}
                      >
                        Proceed to Payment
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <h3 className="font-semibold mb-4">Payment Method</h3>
                      
                      <PaymentMethodSelector
                        selectedMethod={paymentMethod}
                        onSelect={handlePaymentMethodSelect}
                      />
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between font-bold pt-2 border-t">
                          <span>Total</span>
                          <span>LKR {getTotalCost().total.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => setCheckoutStep(1)}
                        >
                          Back
                        </Button>
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={handleCheckout}
                        >
                          Complete Purchase
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventPage;
