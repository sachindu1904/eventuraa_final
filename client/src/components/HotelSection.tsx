import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import api from '@/utils/api-fetch';
import { Skeleton } from '@/components/ui/skeleton';

interface Venue {
  _id: string;
  name: string;
  location: string;
  address: {
    city: string;
    district: string;
  };
  facilities: string[];
  images: {
    url: string;
    isMain: boolean;
  }[];
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
  averageRating: number;
  type: string;
}

const HotelCard = ({ name, location, rating, image, price, features, id }: {
  name: string;
  location: string;
  rating: number;
  image: string;
  price: string;
  features: string[];
  id: string;
}) => {
  return (
    <div className="flex flex-col lg:flex-row bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-gray-100">
      <div className="lg:w-1/3 h-48 lg:h-auto overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold mb-1">{name}</h3>
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-eventuraa-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {location}
            </div>
          </div>
          <div className="flex items-center bg-yellow-50 text-yellow-700 px-2 py-1 rounded">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            <span className="font-medium">{rating}</span>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 my-3">
          {features.map((feature, i) => (
            <span key={i} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
              {feature}
            </span>
          ))}
        </div>
        
        <div className="mt-auto flex items-center justify-between">
          <div>
            <span className="block text-gray-500 text-sm">Per night</span>
            <span className="font-bold text-lg text-eventuraa-blue">{price}</span>
          </div>
          <Link to={`/venues/${id}`}>
            <Button className="bg-eventuraa-blue hover:bg-blue-600">Book Room</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

const HotelSkeleton = () => (
  <div className="flex flex-col lg:flex-row bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
    <div className="lg:w-1/3 h-48 lg:h-auto overflow-hidden">
      <Skeleton className="h-full w-full" />
    </div>
    <div className="flex-1 p-6 flex flex-col">
      <div className="flex justify-between items-start">
        <div className="w-3/4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-2" />
        </div>
        <Skeleton className="h-8 w-12 rounded" />
      </div>
      
      <div className="flex flex-wrap gap-2 my-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-6 w-16 rounded-full" />
        ))}
      </div>
      
      <div className="mt-auto flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-16 mb-1" />
          <Skeleton className="h-6 w-24" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  </div>
);

const HotelSection = () => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ venues: Venue[] }>('/venues?type=hotel,resort&limit=2&featured=true');
        
        if (response.success && response.data?.venues) {
          setVenues(response.data.venues);
        } else {
          setError('Failed to fetch hotels');
        }
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setError('An error occurred while fetching hotels');
      } finally {
        setLoading(false);
      }
    };

    fetchHotels();
  }, []);

  // Get the first image or a fallback
  const getMainImage = (venue: Venue) => {
    if (venue.images && venue.images.length > 0) {
      // Find the main image first
      const mainImage = venue.images.find(img => img.isMain)?.url;
      if (mainImage) return mainImage;
      
      // Otherwise, return the first image
      return venue.images[0].url;
    }
    // Fallback image
    return '/placeholders/venue-placeholder.jpg';
  };

  // Get location display
  const getLocation = (venue: Venue) => {
    if (venue.address?.city) return venue.address.city;
    if (venue.location) return venue.location;
    return 'Location TBA';
  };

  // Get rating
  const getRating = (venue: Venue) => {
    if (typeof venue.averageRating === 'number') {
      return venue.averageRating.toFixed(1);
    }
    return 'N/A';
  };

  // Get price display
  const getPriceDisplay = (venue: Venue) => {
    if (venue.priceRange?.min && venue.priceRange?.currency) {
      return `${venue.priceRange.currency} ${venue.priceRange.min.toLocaleString()}`;
    }
    return 'Price on request';
  };

  // Get facilities
  const getFacilities = (venue: Venue) => {
    if (venue.facilities && venue.facilities.length > 0) {
      return venue.facilities.slice(0, 5);
    }
    return [venue.type || 'Accommodation'];
  };

  return (
    <section id="hotels" className="bg-white py-16">
      <div className="container-custom">
        <div className="text-center mb-12">
          <h2 className="section-title">Premium Accommodations</h2>
          <p className="section-subtitle">
            Find perfect stays across Sri Lanka - from beachfront resorts to mountain retreats
          </p>
        </div>

        {error && (
          <div className="text-center text-red-500 mb-8">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {loading ? (
            // Show skeletons while loading
            Array(2).fill(0).map((_, index) => <HotelSkeleton key={index} />)
          ) : venues.length > 0 ? (
            // Show real hotels
            venues.map((venue) => (
              <HotelCard 
                key={venue._id}
                id={venue._id}
                name={venue.name}
                location={getLocation(venue)}
                rating={parseFloat(getRating(venue))}
                image={getMainImage(venue)}
                price={getPriceDisplay(venue)}
                features={getFacilities(venue)}
              />
            ))
          ) : (
            // Fallback for no hotels
            <div className="text-center py-8">
              <p className="text-gray-500">No premium accommodations available at the moment</p>
            </div>
          )}
        </div>

        <div className="text-center mt-12">
          <Link to="/hotels">
            <Button variant="outline" className="text-eventuraa-blue border-eventuraa-blue hover:bg-eventuraa-blue hover:text-white">
              Explore All Hotels
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HotelSection;
