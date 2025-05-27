import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Spinner } from '@/components/ui/spinner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, Calendar, User, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/utils/api-fetch';

// Define interfaces
interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  profileImage: string;
  bio?: string;
  phone?: string;
  email?: string;
  averageRating?: number;
  practices: {
    hospitalName: string;
    address: {
      street?: string;
      city?: string;
      district?: string;
      postalCode?: string;
      country?: string;
    };
    position?: string;
    contactNumber?: string;
    location?: {
      lat: number;
      lng: number;
    };
  }[];
  consultationFee?: {
    amount: number;
    currency: string;
  };
}

interface DoctorMapProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  specialty?: string;
}

// Default center coordinates for Sri Lanka
const defaultCenter = { lat: 6.9271, lng: 79.8612 }; // Colombo coordinates

const containerStyle = {
  width: '100%',
  height: '600px'
};

const DoctorMap: React.FC<DoctorMapProps> = ({ 
  center = defaultCenter, 
  zoom = 12,
  specialty
}) => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Get user's current location
  const getUserLocation = () => {
    if (navigator.geolocation) {
      toast({
        title: "Getting your location",
        description: "Please allow location access if prompted"
      });

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          
          // If we have a map instance, center it on user's location
          if (map) {
            map.panTo(userPos);
            map.setZoom(14);
          }
          
          toast({
            title: "Location found",
            description: "Showing doctors near you"
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location error",
            description: "Couldn't get your location. Showing default area.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive"
      });
    }
  };

  // Fetch doctors data
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        let url = '/doctors?active=true';
        if (specialty) {
          url += `&specialty=${specialty}`;
        }
        
        const response = await api.get<{ doctors: Doctor[] }>(url);
        
        if (response.success && response.data?.doctors) {
          // Filter doctors who have location data
          const doctorsWithLocation = response.data.doctors.filter(doctor => 
            doctor.practices && doctor.practices.some(practice => practice.location)
          );
          
          setDoctors(doctorsWithLocation);
        } else {
          setError('Failed to fetch doctors');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('An error occurred while fetching doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specialty]);

  // Contact doctor actions
  const handleCallDoctor = (doctor: Doctor) => {
    const phone = doctor.phone || doctor.practices[0]?.contactNumber;
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast({
        title: "Contact information missing",
        description: "This doctor's phone number is not available",
        variant: "destructive"
      });
    }
  };

  const handleEmailDoctor = (doctor: Doctor) => {
    if (doctor.email) {
      window.location.href = `mailto:${doctor.email}`;
    } else {
      toast({
        title: "Contact information missing",
        description: "This doctor's email is not available",
        variant: "destructive"
      });
    }
  };

  const handleMessageDoctor = (doctor: Doctor) => {
    toast({
      title: "Starting chat",
      description: `Opening secure chat with ${doctor.name}`
    });
    // In a real app, this would open a chat interface
  };

  const handleBookAppointment = (doctor: Doctor) => {
    toast({
      title: "Booking appointment",
      description: `Initiating appointment booking with ${doctor.name}`
    });
    // In a real app, this would navigate to an appointment booking form
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p>Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Spinner className="h-8 w-8 mx-auto mb-4" />
          <p>Loading doctors near you...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 text-red-600 rounded-lg">
        <div className="text-center p-6">
          <p className="mb-4">{error}</p>
          <Button variant="destructive" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="bg-gray-50 p-8 rounded-lg text-center">
        <p className="text-lg mb-4">No doctors found in this area with the selected specialty.</p>
        <Button onClick={() => window.location.reload()}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Doctors Near You</h2>
        <Button onClick={getUserLocation} className="bg-eventuraa-blue hover:bg-blue-600">
          Find Doctors Near Me
        </Button>
      </div>
      
      <div className="relative rounded-lg overflow-hidden shadow-lg">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={userLocation || center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {/* User location marker */}
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                url: '/icons/user-location.svg',
                scaledSize: new google.maps.Size(40, 40)
              }}
            />
          )}

          {/* Doctor markers */}
          {doctors.map(doctor => {
            // Get first practice with location data
            const practice = doctor.practices.find(p => p.location);
            if (!practice || !practice.location) return null;

            return (
              <Marker
                key={doctor._id}
                position={practice.location}
                onClick={() => setSelectedDoctor(doctor)}
                icon={{
                  url: '/icons/doctor-marker.svg',
                  scaledSize: new google.maps.Size(32, 32)
                }}
              />
            );
          })}

          {/* Info window for selected doctor */}
          {selectedDoctor && selectedDoctor.practices.some(p => p.location) && (
            <InfoWindow
              position={selectedDoctor.practices.find(p => p.location)?.location || defaultCenter}
              onCloseClick={() => setSelectedDoctor(null)}
            >
              <Card className="w-72 p-0 shadow-none">
                <div className="p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <img 
                      src={selectedDoctor.profileImage || '/placeholders/doctor-placeholder.jpg'} 
                      alt={selectedDoctor.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-base">{selectedDoctor.name}</h3>
                      <p className="text-sm text-gray-600">{selectedDoctor.specialty}</p>
                    </div>
                  </div>
                  
                  {selectedDoctor.averageRating && (
                    <div className="flex items-center mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i}
                          fill={i < Math.round(selectedDoctor.averageRating!) ? "currentColor" : "none"} 
                          className={`h-4 w-4 ${i < Math.round(selectedDoctor.averageRating!) ? "text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span className="text-sm ml-1">({selectedDoctor.averageRating.toFixed(1)})</span>
                    </div>
                  )}
                  
                  <p className="text-sm mb-3 line-clamp-2">
                    {selectedDoctor.bio || `${selectedDoctor.name} is a specialized healthcare professional.`}
                  </p>
                  
                  <div className="text-sm mb-3">
                    <p className="font-medium">
                      {selectedDoctor.practices[0]?.hospitalName || "Private Practice"}
                    </p>
                    <p className="text-gray-600">
                      {selectedDoctor.practices[0]?.address?.city || "Sri Lanka"}
                    </p>
                    {selectedDoctor.consultationFee && (
                      <p className="text-eventuraa-blue font-medium mt-1">
                        {selectedDoctor.consultationFee.currency} {selectedDoctor.consultationFee.amount.toLocaleString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      size="sm" 
                      className="flex items-center justify-center gap-1"
                      onClick={() => handleCallDoctor(selectedDoctor)}
                    >
                      <Phone className="h-3 w-3" /> Call
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center justify-center gap-1"
                      onClick={() => handleEmailDoctor(selectedDoctor)}
                    >
                      <Mail className="h-3 w-3" /> Email
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center justify-center gap-1"
                      onClick={() => handleMessageDoctor(selectedDoctor)}
                    >
                      <MessageSquare className="h-3 w-3" /> Message
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-eventuraa-blue hover:bg-blue-600 flex items-center justify-center gap-1"
                      onClick={() => handleBookAppointment(selectedDoctor)}
                    >
                      <Calendar className="h-3 w-3" /> Book
                    </Button>
                  </div>
                </div>
              </Card>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Map Legend</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <User className="h-3 w-3" />
            </div>
            <span>Your Location</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
              <span className="text-xs">+</span>
            </div>
            <span>Doctor Location</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorMap; 