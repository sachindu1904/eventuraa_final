import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Tag, ArrowLeft, Loader2, Edit, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';
import useAuth from '@/hooks/useAuth';
import ImageSlider from '@/components/ImageSlider';
import { ApiResponse } from '@/utils/api-fetch';

interface TicketType {
  name: string;
  price: number;
  quantity: number;
  available: number;
}

interface EventData {
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
  coverImage?: string;
  images?: string[];
  organizer: {
    _id: string;
    companyName: string;
  };
}

interface EventResponse {
  event: EventData;
}

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, userType, userData } = useAuth();

  // Determine if user is an organizer or admin
  const isOrganizer = userType === 'organizer';
  const isAdmin = userType === 'admin';
  const isOrganizerOrAdmin = isOrganizer || isAdmin;
  
  // Check if user is event owner
  const [isEventOwner, setIsEventOwner] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      try {
        const response = await api.get<EventResponse>(`/events/${eventId}`);
        
        if (response.success && response.data) {
          setEvent(response.data.event);
          
          // Check if logged-in organizer is the event owner
          if (isOrganizer && userData && response.data.event.organizer) {
            setIsEventOwner(userData.id === response.data.event.organizer._id);
          }
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
  }, [eventId, isOrganizer, userData]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleBuyTickets = () => {
    navigate(`/events/${eventId}/checkout`);
  };

  const renderActionButtons = () => {
    if (!isAuthenticated) {
      return (
        <Button 
          className="w-full mt-4 bg-[#7E69AB] hover:bg-[#6E59A5]"
          onClick={() => navigate('/signin?redirect=' + encodeURIComponent(`/events/${eventId}/checkout`))}
        >
          Buy Tickets
        </Button>
      );
    }

    // For organizers who own the event or admins
    if ((isOrganizer && isEventOwner) || isAdmin) {
      return (
        <div className="space-y-2 mt-4">
          {/* Only show Edit Event to the event owner (organizer) */}
          {isOrganizer && isEventOwner && (
            <Button 
              className="w-full bg-[#7E69AB] hover:bg-[#6E59A5] flex items-center justify-center" 
              asChild
            >
              <Link to={`/organizer-portal/events/${eventId}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Event
              </Link>
            </Button>
          )}
          
          {/* Show analytics to both organizer (owner) and admin */}
          <Button 
            className="w-full bg-[#5A7D9A] hover:bg-[#4A6D8A] flex items-center justify-center"
            asChild
          >
            <Link to={`/${isOrganizer ? 'organizer-portal' : 'admin-dashboard'}/analytics?event=${eventId}`}>
              <BarChart className="mr-2 h-4 w-4" />
              View Sales Analytics
            </Link>
          </Button>
        </div>
      );
    }

    // Regular user or non-owner organizer
    return (
      <Button 
        className="w-full mt-4 bg-[#7E69AB] hover:bg-[#6E59A5]"
        onClick={handleBuyTickets}
      >
        Buy Tickets
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
            <p className="text-gray-600">Loading event details...</p>
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
            <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || "The event you're looking for doesn't exist or has been removed."}
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
          Back
        </Button>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Event Images */}
            <div className="mb-6">
              {event.images && event.images.length > 0 ? (
                <ImageSlider 
                  images={event.coverImage ? [event.coverImage, ...event.images] : event.images}
                  aspectRatio="16:9"
                  className="h-80"
                />
              ) : event.coverImage ? (
                <ImageSlider 
                  images={[event.coverImage]}
                  aspectRatio="16:9"
                  className="h-80"
                />
              ) : (
                <div className="w-full h-80 flex items-center justify-center bg-gray-200 rounded-lg">
                  <span className="text-gray-400">No images available</span>
                </div>
              )}
            </div>
            
            {/* Event Details */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{event.category}</Badge>
                <Badge variant="outline">{event.eventType}</Badge>
              </div>
              
              <h1 className="text-3xl font-bold mb-4">{event.title}</h1>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="mr-2 h-5 w-5" />
                  <span>{formattedDate}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Clock className="mr-2 h-5 w-5" />
                  <span>{event.time}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <MapPin className="mr-2 h-5 w-5" />
                  <span>
                    {event.location.name}, {event.location.address}, {event.location.city}, {event.location.district}
                  </span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Tag className="mr-2 h-5 w-5" />
                  <span>Organized by {event.organizer?.companyName || 'Unknown Organizer'}</span>
                </div>
              </div>
              
              <div className="space-y-4 mt-8">
                <h2 className="text-xl font-semibold">About This Event</h2>
                <div className="prose max-w-none text-gray-700">
                  <p>{event.description}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Ticket Information */}
          <div>
            <div className="sticky top-4 bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">
                {isOrganizerOrAdmin ? 'Ticket Information' : 'Tickets'}
              </h2>
              
              {event.ticketTypes && event.ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  {event.ticketTypes.map((ticket, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-medium">{ticket.name}</h3>
                          <p className="text-sm text-gray-500">
                            {ticket.available} tickets available
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">LKR {ticket.price.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {renderActionButtons()}
                </div>
              ) : (
                <p className="text-gray-500">No tickets available for this event.</p>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="font-medium mb-2">Event Details</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4" />
                    <span>
                      {event.ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0)} total capacity
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>{event.time}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EventDetailPage; 