import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import api from '@/utils/api-fetch';
import { Skeleton } from '@/components/ui/skeleton';

interface Event {
  _id: string;
  title: string;
  date: string;
  location: {
    name: string;
    city: string;
    address: string;
  };
  images: string[];
  category: string;
  ticketPrice: number;
  eventType: string;
}

const EventCard = ({ title, date, location, image, category, price, id }: {
  title: string;
  date: string;
  location: string;
  image: string;
  category: string;
  price: string;
  id: string;
}) => {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-md hover:shadow-lg transition-all border border-gray-100 flex flex-col h-full">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
        <img src={image} alt={title} className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 bg-eventuraa-purple text-white px-2 py-1 rounded-md text-xs z-20">
          {category}
        </span>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {date}
        </div>
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="font-semibold text-eventuraa-purple">{price}</div>
          <Link to={`/events/${id}`}>
            <Button variant="outline" className="text-eventuraa-purple border-eventuraa-purple hover:bg-eventuraa-purple hover:text-white">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const EventSkeleton = () => (
  <div className="rounded-xl overflow-hidden bg-white shadow-md border border-gray-100 flex flex-col h-full">
    <div className="relative h-48 overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="p-5 flex-1 flex flex-col">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="mt-auto flex items-center justify-between">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  </div>
);

const FeaturedEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ events: Event[] }>('/events?featured=true&limit=4');
        
        if (response.success && response.data?.events) {
          setEvents(response.data.events);
        } else {
          setError('Failed to fetch events');
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError('An error occurred while fetching events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Format date function
  const formatDate = (dateString: string) => {
    if (!dateString) return 'TBA';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'TBA';
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get location display
  const getLocation = (event: Event) => {
    if (event.location?.name) return event.location.name;
    if (event.location?.city) return event.location.city;
    if (event.location?.address) return event.location.address;
    return 'Location TBA';
  };

  // Get image URL
  const getImageUrl = (event: Event) => {
    if (event.images && event.images.length > 0 && event.images[0]) {
      return event.images[0];
    }
    return '/placeholders/event-placeholder.jpg';
  };

  // Get category
  const getCategory = (event: Event) => {
    return event.category || event.eventType || 'Event';
  };

  // Format price
  const formatPrice = (event: Event) => {
    if (typeof event.ticketPrice === 'number') {
      return `LKR ${event.ticketPrice.toLocaleString()}`;
    }
    return 'Price TBA';
  };

  return (
    <section id="events" className="bg-gray-50 py-16">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">Featured Experiences</h2>
          <p className="section-subtitle">
            Discover unique Sri Lankan experiences - from cultural festivals to adventure activities
          </p>
        </div>

        {error && (
          <div className="text-center text-red-500 mb-8">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            // Show skeletons while loading
            Array(4).fill(0).map((_, index) => <EventSkeleton key={index} />)
          ) : events.length > 0 ? (
            // Show real events
            events.map((event) => (
              <EventCard 
                key={event._id}
                id={event._id}
                title={event.title}
                date={formatDate(event.date)}
                location={getLocation(event)}
                image={getImageUrl(event)}
                category={getCategory(event)}
                price={formatPrice(event)}
              />
            ))
          ) : (
            // Fallback for no events
            <div className="col-span-4 text-center py-8">
              <p className="text-gray-500">No featured events available at the moment</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link to="/events">
            <Button className="bg-eventuraa-purple hover:bg-eventuraa-darkPurple">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedEvents;
