import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Star, Navigation, Clock, User } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';

interface DoctorLocation {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distance: number;
}

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  email: string;
  regNumber: string;
  experience: number;
  consultationFee?: { amount: number; currency: string; };
  languages?: string[];
  locations: DoctorLocation[];
  nearestDistance: number;
}

interface SearchResponse {
  success: boolean;
  data?: {
    doctors: Doctor[];
    searchRadius: number;
    searchCenter: { lat: number; lng: number };
    totalFound: number;
  };
  message?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyA-2OvXggOlxKWuByjgQq6cwYj8TrWnvHo';

const FindDoctors: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showMap, setShowMap] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);
  const doctorMarkersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    loadGoogleMaps();
    getUserLocation();
  }, []);

  const loadGoogleMaps = async () => {
    try {
      const loader = new Loader({
        apiKey: GOOGLE_MAPS_API_KEY,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      await loader.load();
      setMapLoaded(true);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          searchNearbyDoctors(location.lat, location.lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Colombo if location access denied
          const defaultLocation = { lat: 6.9271, lng: 79.8612 };
          setUserLocation(defaultLocation);
          searchNearbyDoctors(defaultLocation.lat, defaultLocation.lng);
        }
      );
    } else {
      // Default to Colombo if geolocation not supported
      const defaultLocation = { lat: 6.9271, lng: 79.8612 };
      setUserLocation(defaultLocation);
      searchNearbyDoctors(defaultLocation.lat, defaultLocation.lng);
    }
  };

  const searchNearbyDoctors = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      
      const response = await fetch(
        `http://localhost:5001/api/doctors/nearby?lat=${lat}&lng=${lng}&radius=${searchRadius}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      
      if (data.success && data.data) {
        setDoctors(data.data.doctors);
        if (showMap && mapLoaded) {
          updateMap(data.data.doctors, lat, lng);
        }
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !mapLoaded || !userLocation) return;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 13,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    updateMap(doctors, userLocation.lat, userLocation.lng);
  };

  const updateMap = (doctorList: Doctor[], userLat: number, userLng: number) => {
    if (!googleMapRef.current) return;

    // Clear existing markers
    doctorMarkersRef.current.forEach(marker => marker.setMap(null));
    doctorMarkersRef.current = [];
    
    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
    }

    // Add user location marker
    userMarkerRef.current = new google.maps.Marker({
      position: { lat: userLat, lng: userLng },
      map: googleMapRef.current,
      title: 'Your Location',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        scaledSize: new google.maps.Size(32, 32),
      },
    });

    // Add doctor markers
    doctorList.forEach(doctor => {
      doctor.locations.forEach(location => {
        if (location.coordinates) {
          const marker = new google.maps.Marker({
            position: { lat: location.coordinates.lat, lng: location.coordinates.lng },
            map: googleMapRef.current,
            title: `${doctor.name} - ${location.name}`,
            icon: {
              url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
              scaledSize: new google.maps.Size(32, 32),
            },
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; font-weight: bold;">${doctor.name}</h3>
                <p style="margin: 0 0 4px 0; color: #666;">${doctor.specialty}</p>
                <p style="margin: 0 0 8px 0; font-size: 12px;">${location.name}</p>
                <p style="margin: 0 0 4px 0; font-size: 12px;">${location.address}</p>
                <p style="margin: 0; font-size: 12px; color: #007bff;">📍 ${location.distance}km away</p>
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMapRef.current, marker);
          });

          doctorMarkersRef.current.push(marker);
        }
      });
    });

    // Fit map to show all markers
    if (doctorMarkersRef.current.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend({ lat: userLat, lng: userLng });
      doctorMarkersRef.current.forEach(marker => {
        const position = marker.getPosition();
        if (position) bounds.extend(position);
      });
      googleMapRef.current.fitBounds(bounds);
    }
  };

  const handleShowMap = () => {
    setShowMap(true);
    setTimeout(() => {
      initializeMap();
    }, 100);
  };

  const handleSearch = () => {
    if (userLocation) {
      searchNearbyDoctors(userLocation.lat, userLocation.lng);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Nearby Doctors</h1>
          <p className="text-gray-600">Discover qualified doctors near your location with precise map coordinates</p>
        </div>

        {/* Search Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="radius">Search Radius (km)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(Number(e.target.value))}
                  min="1"
                  max="50"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSearch} disabled={loading}>
                  {loading ? 'Searching...' : 'Search Doctors'}
                </Button>
                {mapLoaded && (
                  <Button variant="outline" onClick={handleShowMap}>
                    <MapPin className="h-4 w-4 mr-2" />
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Doctors List */}
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto"></div>
                  <p className="mt-2 text-gray-600">Searching for doctors...</p>
                </CardContent>
              </Card>
            ) : doctors.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No doctors found</h3>
                  <p className="text-gray-600">Try increasing the search radius or check your location.</p>
                </CardContent>
              </Card>
            ) : (
              doctors.map((doctor) => (
                <Card key={doctor._id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{doctor.name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {doctor.specialty}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-blue-600">
                          <Navigation className="h-4 w-4 mr-1" />
                          <span className="font-medium">{doctor.nearestDistance}km away</span>
                        </div>
                        {doctor.consultationFee && (
                          <p className="text-sm text-gray-600 mt-1">
                            {doctor.consultationFee.currency} {doctor.consultationFee.amount}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <User className="h-4 w-4 mr-1" />
                        <span>{doctor.experience} years experience</span>
                        {doctor.languages && doctor.languages.length > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>Languages: {doctor.languages.join(', ')}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">Practice Locations:</h4>
                      {doctor.locations.map((location) => (
                        <div key={location._id} className="border rounded-lg p-3 bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <MapPin className="h-4 w-4 text-green-600" />
                                <span className="font-medium">{location.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {location.distance}km
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{location.address}</p>
                              <p className="text-sm text-gray-500">
                                {location.city}{location.state && `, ${location.state}`}
                              </p>
                              {location.phone && (
                                <div className="flex items-center mt-2">
                                  <Phone className="h-4 w-4 mr-1 text-gray-400" />
                                  <span className="text-sm text-gray-600">{location.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Map Panel */}
          <div className="lg:col-span-1">
            {showMap && (
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Doctors Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    ref={mapRef} 
                    className="w-full h-96 rounded border"
                    style={{ minHeight: '384px' }}
                  />
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Your Location</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>Doctor Locations</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FindDoctors; 