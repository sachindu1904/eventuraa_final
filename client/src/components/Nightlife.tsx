import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, MartiniIcon, Calendar, PartyPopper, Disc } from "lucide-react";
import { Link } from 'react-router-dom';
import api from '@/utils/api-fetch';
import { Skeleton } from '@/components/ui/skeleton';

interface Venue {
  _id: string;
  name: string;
  type: string;
  location?: string;
  address?: {
    city?: string;
    district?: string;
  };
  description?: string;
  images?: Array<{
    url: string;
    isMain?: boolean;
  }>;
  facilities?: string[];
  amenities?: string[];
  businessHours?: {
    open?: string;
    close?: string;
  };
}

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
  organizer: {
    _id: string;
    name: string;
  };
  description: string;
}

interface Organizer {
  _id: string;
  name: string;
  description?: string;
  venues?: string[];
  venueNames?: string[];
  socialMedia?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  profileImage?: string;
}

const NightlifeCard = ({ 
  name, 
  id,
  type, 
  image, 
  location, 
  hours, 
  description
}: {
  name: string;
  id?: string;
  type: string;
  image: string;
  location: string;
  hours: string;
  description: string;
}) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border border-gray-100 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 bg-eventuraa-purple text-white px-2 py-1 rounded-md text-xs z-20">
          {type}
        </span>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {location}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex items-center mb-3 text-xs text-gray-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {hours}
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={id ? `/nightlife/${id}` : "/nightlife"} className="w-full">
          <Button className="w-full bg-eventuraa-blue hover:bg-blue-600">
            {id ? "View Details & Reviews" : "Book a Table"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const PartyOrganizerCard = ({
  name,
  id,
  type,
  image,
  venues,
  social,
  description
}: {
  name: string;
  id?: string;
  type: string;
  image: string;
  venues: string[];
  social: string;
  description: string;
}) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border border-gray-100 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <span className="absolute top-3 left-3 bg-eventuraa-orange text-white px-2 py-1 rounded-md text-xs z-20">
          {type}
        </span>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-sm">
          <PartyPopper className="h-4 w-4" />
          {social}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 mb-1">Popular Venues:</p>
          <div className="flex flex-wrap gap-1">
            {venues.map((venue, idx) => (
              <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
                {venue}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={id ? `/nightlife/${id}` : "/nightlife"} className="w-full">
          <Button className="w-full bg-eventuraa-orange hover:bg-orange-600">
            {id ? "View Events & Reviews" : "View Events"}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const EventCard = ({
  name,
  date,
  image,
  venue,
  organizer,
  description,
  id
}: {
  name: string;
  date: string;
  image: string;
  venue: string;
  organizer: string;
  description: string;
  id?: string;
}) => {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg border border-gray-100 h-full flex flex-col">
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10"></div>
        <img src={image} alt={name} className="w-full h-full object-cover" />
        <div className="absolute top-3 left-3 bg-eventuraa-blue text-white px-3 py-2 rounded-lg text-xs font-semibold z-20 flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          {date}
        </div>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-xl">{name}</CardTitle>
        <CardDescription className="flex items-center gap-1 text-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {venue}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="flex items-center mb-3 text-xs text-gray-600">
          <PartyPopper className="h-4 w-4 mr-1" />
          <span>By {organizer}</span>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Link to={id ? `/events/${id}` : "/events"} className="w-full">
          <Button className="w-full bg-eventuraa-blue hover:bg-blue-600">
            Book Tickets
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

const CardSkeleton = () => (
  <Card className="overflow-hidden border border-gray-100 h-full flex flex-col">
    <div className="h-48 relative">
      <Skeleton className="h-full w-full" />
      <div className="absolute top-3 left-3 z-10">
        <Skeleton className="h-6 w-20 rounded-md" />
      </div>
    </div>
    <div className="p-4">
      <Skeleton className="h-7 w-3/4 mb-2" />
      <Skeleton className="h-5 w-1/2 mb-3" />
      <Skeleton className="h-4 w-4/5 mb-1" />
      <Skeleton className="h-4 w-3/4 mb-1" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <Skeleton className="h-10 w-full rounded" />
    </div>
  </Card>
);

const Nightlife = () => {
  const [nightlifeVenues, setNightlifeVenues] = useState<Venue[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState({
    venues: true,
    events: true,
    organizers: true
  });
  const [error, setError] = useState({
    venues: null as string | null,
    events: null as string | null,
    organizers: null as string | null
  });

  useEffect(() => {
    const fetchNightlifeVenues = async () => {
      try {
        const response = await api.get<{ venues: Venue[] }>('/venues?type=nightclub,bar,lounge&limit=4');
        
        if (response.success && response.data?.venues) {
          setNightlifeVenues(response.data.venues);
        } else {
          setError(prev => ({ ...prev, venues: 'Failed to fetch nightlife venues' }));
        }
      } catch (err) {
        console.error('Error fetching nightlife venues:', err);
        setError(prev => ({ ...prev, venues: 'An error occurred while fetching venues' }));
      } finally {
        setLoading(prev => ({ ...prev, venues: false }));
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await api.get<{ events: Event[] }>('/events?category=nightlife,party&limit=4');
        
        if (response.success && response.data?.events) {
          setEvents(response.data.events);
        } else {
          setError(prev => ({ ...prev, events: 'Failed to fetch events' }));
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(prev => ({ ...prev, events: 'An error occurred while fetching events' }));
      } finally {
        setLoading(prev => ({ ...prev, events: false }));
      }
    };

    const fetchOrganizers = async () => {
      try {
        const response = await api.get<{ organizers: Organizer[] }>('/organizers?category=nightlife,party&limit=4');
        
        if (response.success && response.data?.organizers) {
          setOrganizers(response.data.organizers);
        } else {
          setError(prev => ({ ...prev, organizers: 'Failed to fetch organizers' }));
        }
      } catch (err) {
        console.error('Error fetching organizers:', err);
        setError(prev => ({ ...prev, organizers: 'An error occurred while fetching organizers' }));
      } finally {
        setLoading(prev => ({ ...prev, organizers: false }));
      }
    };

    fetchNightlifeVenues();
    fetchEvents();
    fetchOrganizers();
  }, []);

  // Helper functions
  const getVenueImage = (venue: Venue) => {
    if (venue.images && venue.images.length > 0) {
      const mainImage = venue.images.find(img => img.isMain);
      return mainImage ? mainImage.url : venue.images[0].url;
    }
    return '/placeholders/venue-placeholder.jpg';
  };

  const getVenueLocation = (venue: Venue) => {
    if (venue.address?.city) return venue.address.city;
    if (venue.location) return venue.location;
    return 'Sri Lanka';
  };

  const getVenueHours = (venue: Venue) => {
    if (venue.businessHours?.open && venue.businessHours?.close) {
      return `${venue.businessHours.open} - ${venue.businessHours.close}`;
    }
    return 'Hours not specified';
  };

  const getEventImage = (event: Event) => {
    if (event.images && event.images.length > 0) {
      return event.images[0];
    }
    return '/placeholders/event-placeholder.jpg';
  };

  const getEventLocation = (event: Event) => {
    if (event.location?.name) return event.location.name;
    if (event.location?.city) return event.location.city;
    if (event.location?.address) return event.location.address;
    return 'Location TBA';
  };

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

  const getOrganizerImage = (organizer: Organizer) => {
    if (organizer.profileImage) return organizer.profileImage;
    return '/placeholders/organizer-placeholder.jpg';
  };

  const getOrganizerSocial = (organizer: Organizer) => {
    if (organizer.socialMedia?.instagram) return `@${organizer.socialMedia.instagram.split('/').pop()}`;
    if (organizer.socialMedia?.facebook) return organizer.socialMedia.facebook.split('/').pop() || '';
    return organizer.name;
  };

  return (
    <section id="nightlife" className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <div className="container-custom">
        <div className="flex items-center gap-3 justify-center mb-4">
          <MartiniIcon className="h-8 w-8 text-eventuraa-purple" />
          <Music className="h-6 w-6 text-eventuraa-blue" />
        </div>
        <div className="text-center mb-12">
          <h2 className="section-title text-white">Nightlife in Sri Lanka</h2>
          <p className="section-subtitle text-gray-300">
            Experience the vibrant nightlife scene with exclusive clubs, lounges, and dining experiences
          </p>
          <div className="mt-4">
            <Link to="/nightlife">
              <Button className="bg-eventuraa-blue hover:bg-blue-600">
                Explore All Venues & Reviews
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading.venues ? (
            // Show skeletons while loading
            Array(4).fill(0).map((_, index) => <CardSkeleton key={index} />)
          ) : error.venues ? (
            <div className="col-span-4 text-center py-8">
              <p className="text-red-400">{error.venues}</p>
            </div>
          ) : nightlifeVenues.length > 0 ? (
            // Show actual venues
            nightlifeVenues.map((venue) => (
              <NightlifeCard 
                key={venue._id}
                id={venue._id}
                name={venue.name}
                type={venue.type}
                image={getVenueImage(venue)}
                location={getVenueLocation(venue)}
                hours={getVenueHours(venue)}
                description={venue.description || 'Experience this amazing venue in Sri Lanka.'}
              />
            ))
          ) : (
            <div className="col-span-4 text-center py-8">
              <p className="text-gray-400">No nightlife venues available at the moment</p>
            </div>
          )}
        </div>

        <div className="mt-20 mb-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <PartyPopper className="h-8 w-8 text-eventuraa-orange" />
            <Disc className="h-6 w-6 text-eventuraa-blue" />
          </div>
          <div className="text-center mb-12">
            <h2 className="section-title text-white">Party Life in Sri Lanka</h2>
            <p className="section-subtitle text-gray-300">
              Discover the vibrant party scene with top event organizers hosting unforgettable experiences
            </p>
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <PartyPopper className="h-5 w-5 text-eventuraa-orange" />
            Top Event Organizers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading.organizers ? (
              // Show skeletons while loading
              Array(4).fill(0).map((_, index) => <CardSkeleton key={index} />)
            ) : error.organizers ? (
              <div className="col-span-4 text-center py-8">
                <p className="text-red-400">{error.organizers}</p>
              </div>
            ) : organizers.length > 0 ? (
              // Show actual organizers
              organizers.map((organizer) => (
                <PartyOrganizerCard
                  key={organizer._id}
                  id={organizer._id}
                  name={organizer.name}
                  type="Event Organizer"
                  image={getOrganizerImage(organizer)}
                  venues={organizer.venueNames || organizer.venues || ['Various venues']}
                  social={getOrganizerSocial(organizer)}
                  description={organizer.description || `${organizer.name} hosts amazing events across Sri Lanka.`}
                />
              ))
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-gray-400">No event organizers available at the moment</p>
              </div>
            )}
          </div>
        </div>

        <div className="mb-12">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-eventuraa-blue" />
            Upcoming Events
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading.events ? (
              // Show skeletons while loading
              Array(4).fill(0).map((_, index) => <CardSkeleton key={index} />)
            ) : error.events ? (
              <div className="col-span-4 text-center py-8">
                <p className="text-red-400">{error.events}</p>
              </div>
            ) : events.length > 0 ? (
              // Show actual events
              events.map((event) => (
                <EventCard
                  key={event._id}
                  id={event._id}
                  name={event.title}
                  date={formatDate(event.date)}
                  image={getEventImage(event)}
                  venue={getEventLocation(event)}
                  organizer={event.organizer?.name || 'Eventuraa'}
                  description={event.description || 'Join us for an unforgettable night of entertainment.'}
                />
              ))
            ) : (
              <div className="col-span-4 text-center py-8">
                <p className="text-gray-400">No upcoming events available at the moment</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 mt-12">
          <h3 className="text-xl font-semibold text-white mb-4">Tips for Partygoers</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-2">
              <div className="mt-1 bg-eventuraa-orange rounded-full p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-300">Check Instagram pages of event organizers for last-minute updates</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 bg-eventuraa-orange rounded-full p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-300">Pre-book tickets through our platform for the best prices</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 bg-eventuraa-orange rounded-full p-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-300">Beach parties are best experienced during the dry season (December-April)</p>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/nightlife">
            <Button className="bg-eventuraa-purple hover:bg-eventuraa-darkPurple">
              Explore All Nightlife Venues & Share Your Reviews
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Nightlife;
