import React from 'react';
import EventCard from './EventCard';
import { Link } from 'react-router-dom';

// This interface should match the Event from EventCard component
interface CardEvent {
  id: number | string;
  title: string;
  date: string;
  location: string;
  image: string;
  category: string;
  price: string;
  description?: string;
}

// This interface should match the Event from the API
interface APIEvent {
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
  ticketTypes: {
    name: string;
    price: number;
    quantity: number;
    available: number;
  }[];
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

interface EventSuggestionsProps {
  events: APIEvent[];
}

const EventSuggestions = ({ events }: EventSuggestionsProps) => {
  // Only display up to 3 suggested events
  const suggestedEvents = events.slice(0, 3);
  
  // Format event for EventCard component
  const formatEventForCard = (event: APIEvent): CardEvent => {
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
      image: event.coverImage || '/placeholder-event.jpg', 
      category: event.category,
      price: `From LKR ${lowestPrice.toLocaleString()}`,
      description: event.description
    };
  };

  // If no events, don't render the component
  if (!events || events.length === 0) {
    return null;
  }
  
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 font-display">You Might Also Like</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {suggestedEvents.map((event) => (
          <Link key={event._id} to={`/events/${event._id}`} className="no-underline">
            <EventCard 
              key={event._id} 
              event={formatEventForCard(event)} 
              onSelect={() => console.log(`Selected suggested event: ${event.title}`)} 
            />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EventSuggestions;
