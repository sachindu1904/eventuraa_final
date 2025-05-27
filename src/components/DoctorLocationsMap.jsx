import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaPhone, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';

// Default center - Sri Lanka
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 8;

const DoctorLocationsMap = ({ specialtyFilter }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
  });

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapInstance, setMapInstance] = useState(null);

  // Fetch doctors data
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        
        // Adjust the API endpoint based on your actual endpoint
        let url = '/api/doctors';
        if (specialtyFilter) {
          url += `?specialty=${specialtyFilter}`;
        }
        
        const response = await axios.get(url);
        
        if (response.data.success) {
          // Process doctors to include their locations
          const doctorsWithLocations = await Promise.all(
            response.data.data.doctors.map(async (doctor) => {
              try {
                // Fetch locations for each doctor
                const locResponse = await axios.get(`/api/doctors/${doctor._id}/locations`);
                
                if (locResponse.data.success && locResponse.data.data.locations.length > 0) {
                  return {
                    ...doctor,
                    locations: locResponse.data.data.locations
                  };
                }
                return null; // No locations, skip this doctor
              } catch (err) {
                console.error(`Error fetching locations for doctor ${doctor._id}:`, err);
                return null;
              }
            })
          );
          
          // Filter out doctors without locations
          const filteredDoctors = doctorsWithLocations.filter(doc => doc !== null && doc.locations?.length > 0);
          setDoctors(filteredDoctors);
        } else {
          throw new Error('Failed to fetch doctors');
        }
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError('Failed to load doctors. Please try again later.');
        toast.error('Failed to load doctors. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [specialtyFilter]);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          setMapCenter(userPos);
        },
        (error) => {
          console.error('Error getting current location:', error);
        }
      );
    }
  }, []);

  const onMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const handleMarkerClick = (doctor, location) => {
    setSelectedDoctor({
      doctor,
      location
    });
  };

  const handleInfoWindowClose = () => {
    setSelectedDoctor(null);
  };

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.district) parts.push(address.district);
    
    return parts.join(', ');
  };

  // Get day of week
  const getDayOfWeek = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Check if the practice is open now
  const isOpenNow = (workingHours) => {
    if (!workingHours || workingHours.length === 0) return false;
    
    const today = getDayOfWeek();
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    const todayHours = workingHours.find(h => h.day === today);
    
    if (!todayHours || !todayHours.isAvailable) return false;
    
    return todayHours.startTime <= currentTime && currentTime <= todayHours.endTime;
  };

  // Get working hours for today
  const getTodayHours = (workingHours) => {
    if (!workingHours || workingHours.length === 0) return 'Hours not available';
    
    const today = getDayOfWeek();
    const todayHours = workingHours.find(h => h.day === today);
    
    if (!todayHours) return 'Hours not available';
    if (!todayHours.isAvailable) return 'Closed today';
    
    return `${todayHours.startTime} - ${todayHours.endTime}`;
  };

  // Button click handlers
  const handleCallDoctor = (doctor, location) => {
    const phoneNumber = location.contactNumber || doctor.phone;
    if (phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      toast.warning('Phone number not available');
    }
  };

  const handleEmailDoctor = (doctor) => {
    if (doctor.email) {
      window.location.href = `mailto:${doctor.email}`;
    } else {
      toast.warning('Email not available');
    }
  };

  const handleBookAppointment = (doctor) => {
    // Redirect to booking page or handle booking logic
    toast.info(`Booking appointment with ${doctor.name}`);
    // In a real implementation, you would redirect to a booking page
    // window.location.href = `/book-appointment/${doctor._id}`;
  };

  if (!isLoaded) {
    return <div className="flex justify-center items-center h-96">Loading Google Maps...</div>;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-3">Loading doctors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-96 bg-red-50 text-red-500 p-4 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={10}
        onLoad={onMapLoad}
        options={{
          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: false
        }}
      >
        {/* User's current location marker */}
        {userLocation && (
          <Marker
            position={userLocation}
            icon={{
              path: 0, // Circle
              scale: 8,
              fillColor: '#4285F4',
              fillOpacity: 1,
              strokeColor: 'white',
              strokeWeight: 2
            }}
            title="Your location"
          />
        )}

        {/* Doctor location markers */}
        {doctors.map(doctor => (
          doctor.locations.map(location => (
            <Marker
              key={`${doctor._id}-${location._id}`}
              position={location.coordinates}
              title={`${doctor.name} - ${location.practiceName}`}
              onClick={() => handleMarkerClick(doctor, location)}
              icon={{
                url: isOpenNow(location.workingHours) 
                  ? 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' 
                  : 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
              }}
            />
          ))
        ))}

        {/* Info window for selected doctor */}
        {selectedDoctor && (
          <InfoWindow
            position={selectedDoctor.location.coordinates}
            onCloseClick={handleInfoWindowClose}
          >
            <div className="max-w-xs">
              <h3 className="font-bold text-lg">{selectedDoctor.doctor.name}</h3>
              <p className="text-sm text-gray-600">{selectedDoctor.doctor.specialty}</p>
              
              <div className="mt-2">
                <p className="font-semibold">{selectedDoctor.location.practiceName}</p>
                <p className="text-sm">{formatAddress(selectedDoctor.location.address)}</p>
                
                <div className="mt-1 flex items-center">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                    isOpenNow(selectedDoctor.location.workingHours) ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-sm">
                    {isOpenNow(selectedDoctor.location.workingHours) ? 'Open now' : 'Closed now'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({getTodayHours(selectedDoctor.location.workingHours)})
                  </span>
                </div>
              </div>
              
              <div className="flex mt-3 space-x-2">
                <button 
                  onClick={() => handleCallDoctor(selectedDoctor.doctor, selectedDoctor.location)}
                  className="flex items-center justify-center bg-blue-600 text-white p-2 rounded-full"
                  title="Call doctor"
                >
                  <FaPhone />
                </button>
                
                <button 
                  onClick={() => handleEmailDoctor(selectedDoctor.doctor)}
                  className="flex items-center justify-center bg-gray-600 text-white p-2 rounded-full"
                  title="Email doctor"
                >
                  <FaEnvelope />
                </button>
                
                <button 
                  onClick={() => handleBookAppointment(selectedDoctor.doctor)}
                  className="flex-1 flex items-center justify-center bg-green-600 text-white py-1 px-2 rounded text-sm"
                >
                  <FaCalendarAlt className="mr-1" /> Book Appointment
                </button>
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
      
      {/* Map controls */}
      <div className="absolute bottom-4 left-4 bg-white shadow-md rounded-md p-2 z-10">
        <button
          onClick={() => userLocation && setMapCenter(userLocation)}
          className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
        >
          Center on my location
        </button>
      </div>
      
      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white shadow-md rounded-md p-2 z-10">
        <div className="text-sm font-semibold mb-1">Legend</div>
        <div className="flex items-center mb-1">
          <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-2"></span>
          <span className="text-xs">Open now</span>
        </div>
        <div className="flex items-center">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2"></span>
          <span className="text-xs">Closed now</span>
        </div>
      </div>
    </div>
  );
};

export default DoctorLocationsMap; 