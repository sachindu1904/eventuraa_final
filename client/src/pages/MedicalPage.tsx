import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Check, 
  MapPin, 
  Star, 
  ThermometerSun, 
  Phone, 
  Hospital, 
  Search, 
  ShieldCheck, 
  Info, 
  Calendar, 
  User, 
  Mail, 
  CircleDollarSign, 
  MessageCircle, 
  Stethoscope,
  Navigation,
  Clock,
  Map
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader } from '@googlemaps/js-api-loader';
import UserAppointments from '@/components/UserAppointments';

const GOOGLE_MAPS_API_KEY = 'AIzaSyA-2OvXggOlxKWuByjgQq6cwYj8TrWnvHo';

interface DoctorLocation {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: number;
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
  bio?: string;
  isActive: boolean;
  locations: DoctorLocation[];
  nearestDistance?: number;
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

const MedicalPage = () => {
  const { toast } = useToast();
  const [location, setLocation] = useState('Colombo');
  const [specialization, setSpecialization] = useState('');
  const [availableToday, setAvailableToday] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [searchRadius, setSearchRadius] = useState(50);
  const [mapLoaded, setMapLoaded] = useState(false);
  
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
          const userPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(userPos);
          searchNearbyDoctors(userPos.lat, userPos.lng);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to Colombo if location access denied
          const defaultLocation = { lat: 6.9271, lng: 79.8612 };
          setUserLocation(defaultLocation);
          searchNearbyDoctors(defaultLocation.lat, defaultLocation.lng);
          toast({
            title: "Location access unavailable",
            description: "Using Colombo as default location. You can search for doctors in your area.",
          });
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      // Default to Colombo if geolocation not supported
      const defaultLocation = { lat: 6.9271, lng: 79.8612 };
      setUserLocation(defaultLocation);
      searchNearbyDoctors(defaultLocation.lat, defaultLocation.lng);
      toast({
        title: "Geolocation not supported",
        description: "Using Colombo as default location.",
      });
    }
  };

  const searchNearbyDoctors = async (lat: number, lng: number) => {
    try {
      setLoading(true);
      
      const url = `http://localhost:5001/api/doctors/nearby?lat=${lat}&lng=${lng}&radius=${searchRadius}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      
      if (data.success && data.data) {
        let filteredDoctors = data.data.doctors;
        
        // Filter by specialization if selected
        if (specialization && specialization !== '') {
          filteredDoctors = filteredDoctors.filter(doctor => 
            doctor.specialty.toLowerCase().includes(specialization.toLowerCase())
          );
        }
        
        setDoctors(filteredDoctors);
        
        if (activeTab === 'map' && mapLoaded) {
          updateMap(filteredDoctors, lat, lng);
        }
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error('Error searching doctors:', error);
      setDoctors([]);
      toast({
        title: "Error",
        description: "Failed to load doctors. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const detectLocation = () => {
    toast({
      title: "Detecting your location...",
      description: "Please allow location access if prompted",
    });
    getUserLocation();
  };

  const handleSearch = () => {
    if (userLocation) {
      searchNearbyDoctors(userLocation.lat, userLocation.lng);
    }
  };

  const handleEmergencyCall = () => {
    toast({
      title: "Connecting to emergency services",
      description: "Please stand by...",
      variant: "destructive",
    });
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
                ${location.distance ? `<p style="margin: 0; font-size: 12px; color: #007bff;">📍 ${location.distance}km away</p>` : ''}
                ${doctor.consultationFee ? `<p style="margin: 4px 0 0 0; font-size: 12px; font-weight: bold;">Fee: ${doctor.consultationFee.currency} ${doctor.consultationFee.amount}</p>` : ''}
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
    setActiveTab('map');
    setTimeout(() => {
      initializeMap();
    }, 100);
  };

  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/lovable-uploads/fd6c4d0f-c13f-43ab-9a2a-8067717bbe38.png" 
            alt="Friendly Sri Lankan doctor" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60"></div>
        </div>
        
        <div className="container-custom relative z-10 h-full flex flex-col justify-center items-center text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-display text-white mb-6">
            24/7 Medical Support for Tourists
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-10 max-w-3xl">
            Book online consultations or doctor visits to your hotel. Our network of certified medical 
            professionals is ready to help you anytime, anywhere in Sri Lanka.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleEmergencyCall}
              className="emergency-btn text-lg animate-pulse-gentle"
              size="lg"
            >
              🚑 Emergency Help (Click Here)
            </Button>
            
            <Link to="/doctor-login">
              <Button 
                variant="outline" 
                className="text-white border-white hover:bg-white/20 text-lg"
                size="lg"
              >
                <User className="mr-2 h-5 w-5" /> 
                Doctor Login
              </Button>
            </Link>

            <Link to="/find-doctors">
              <Button 
                variant="outline" 
                className="text-white border-white hover:bg-white/20 text-lg"
                size="lg"
              >
                <MapPin className="mr-2 h-5 w-5" /> 
                Find Doctors Near You
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Search & Filter Bar */}
      <section className="py-8 bg-white shadow-md sticky top-0 z-30">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="location" className="mb-2 block">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input 
                  id="location" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                  placeholder="Enter location"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-xs"
                  onClick={detectLocation}
                >
                  Detect
                </Button>
              </div>
            </div>
            
            <div>
              <Label htmlFor="specialization" className="mb-2 block">Specialization</Label>
              <select 
                id="specialization" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                <option value="">All Specializations</option>
                <option value="general">General Physician</option>
                <option value="cardiology">Cardiology</option>
                <option value="dermatology">Dermatology</option>
                <option value="gastroenterology">Gastroenterology</option>
                <option value="psychiatry">Psychiatry</option>
                <option value="neurology">Neurology</option>
                <option value="orthopedics">Orthopedics</option>
                <option value="pediatrics">Pediatrics</option>
              </select>
            </div>

            <div>
              <Label htmlFor="radius" className="mb-2 block">Search Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                min="1"
                max="100"
                placeholder="50"
              />
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={handleSearch} 
                disabled={loading}
                className="ml-auto bg-eventuraa-blue"
              >
                <Search className="mr-2 h-4 w-4" /> 
                {loading ? 'Searching...' : 'Search Doctors'}
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Emergency Section */}
      <section className="py-8 bg-red-50">
        <div className="container-custom">
          <div className="bg-white border-l-4 border-red-500 p-4 mb-8 rounded-r-lg shadow-md">
            <h2 className="text-2xl font-bold text-red-600 flex items-center">
              <Hospital className="mr-2" /> Need immediate help?
            </h2>
            <p className="text-gray-700 mb-4">
              If you're experiencing a medical emergency, don't wait. Contact emergency services immediately.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button className="bg-red-600 hover:bg-red-700">
                <Phone className="mr-2 h-4 w-4" /> Call 1990 (Emergency)
              </Button>
              <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white">
                <MapPin className="mr-2 h-4 w-4" /> Find Emergency Clinics
              </Button>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-4">First Aid Guides</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Collapsible className="border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-white hover:bg-gray-50">
                <div className="flex items-center">
                  <ThermometerSun className="mr-2 text-red-500" />
                  <span>Treating Sunburn</span>
                </div>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Common Issue</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border-t">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Get out of the sun and cool the skin with a cold compress.</li>
                  <li>Apply aloe vera gel or moisturizer to soothe the skin.</li>
                  <li>Drink plenty of water to prevent dehydration.</li>
                  <li>Take over-the-counter pain relievers if needed.</li>
                  <li>Seek medical attention if you have severe blistering or fever.</li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible className="border rounded-lg overflow-hidden">
              <CollapsibleTrigger className="flex justify-between items-center w-full p-4 bg-white hover:bg-gray-50">
                <div className="flex items-center">
                  <ThermometerSun className="mr-2 text-red-500" />
                  <span>Dehydration Symptoms</span>
                </div>
                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Critical</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-white border-t">
                <ul className="list-disc pl-5 space-y-2">
                  <li>Extreme thirst</li>
                  <li>Dry mouth and tongue</li>
                  <li>Little or no urination</li>
                  <li>Headache, dizziness or lightheadedness</li>
                  <li>Fatigue</li>
                  <li>Dark colored urine</li>
                </ul>
                <p className="mt-4 text-red-600 font-bold">
                  Seek immediate medical attention if experiencing severe symptoms!
                </p>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </section>
      
      {/* Doctor Cards Section with Map Toggle */}
      <section className="py-12 bg-gray-50">
        <div className="container-custom">
          <Tabs defaultValue="find-doctors" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="find-doctors">Find Doctors</TabsTrigger>
              <TabsTrigger value="my-appointments">My Appointments</TabsTrigger>
            </TabsList>
            
            <TabsContent value="find-doctors" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="section-title">Available Doctors Near You</h2>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'list' | 'map')} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="list">List View</TabsTrigger>
                    <TabsTrigger value="map" onClick={handleShowMap}>Map View</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <p className="section-subtitle">
                Find and book appointments with qualified medical professionals in your area
              </p>
              
              {activeTab === 'list' ? (
                <>
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
                        <p className="text-gray-600">Try increasing the search radius or adjusting your filters.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {doctors.map((doctor) => (
                        <DoctorCard 
                          key={doctor._id}
                          doctor={doctor}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200 bg-white">
                  <div 
                    ref={mapRef} 
                    className="w-full h-96 rounded border"
                    style={{ minHeight: '500px' }}
                  />
                  <div className="p-4 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span>Your Location</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>Doctor Locations</span>
                        </div>
                      </div>
                      <span className="text-xs">Found {doctors.length} doctors within {searchRadius}km</span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my-appointments">
              <UserAppointments />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      
      {/* Trust Badges */}
      <section className="py-8 bg-gray-50 border-y border-gray-200">
        <div className="container-custom">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center">
              <ShieldCheck className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-gray-700">All consultations encrypted</span>
            </div>
            <div className="flex items-center">
              <Check className="h-6 w-6 text-green-600 mr-2" />
              <span className="text-gray-700">Govt. registered doctors</span>
            </div>
            <div className="flex items-center">
              <Info className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-gray-700">24/7 Support Available</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <span className="text-gray-700">Same-day appointments</span>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

// Real Doctor Card Component
const DoctorCard: React.FC<{ doctor: Doctor }> = ({ doctor }) => {
  const { toast } = useToast();
  
  const handleBookNow = () => {
    // Navigate to the booking page for this doctor
    window.location.href = `/medical/book/${doctor._id}`;
  };
  
  const handleChatFirst = () => {
    toast({
      title: "Opening chat",
      description: `Starting chat with ${doctor.name}`,
    });
  };
  
  const handleCallDoctor = (phone?: string) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      toast({
        title: "No phone number",
        description: "Phone number not available for this doctor",
        variant: "destructive",
      });
    }
  };
  
  const handleEmailDoctor = () => {
    window.location.href = `mailto:${doctor.email}`;
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg border-gray-200">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left Side - Doctor Photo & Info */}
          <div className="w-full md:w-1/4 bg-gray-100 p-4 flex flex-col items-center">
            <div className="relative mb-2">
              <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                <User size={40} className="text-gray-600" />
              </div>
              <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full">
                <Check size={12} />
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-xs flex items-center justify-center mb-2 text-green-700">
                <Check size={12} className="mr-1" />
                <span>Govt. Certified</span>
              </div>
              {doctor.languages && doctor.languages.length > 0 && (
                <div className="flex justify-center space-x-1 mb-2">
                  {doctor.languages.map((lang, i) => (
                    <span key={i} className="px-1 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      {lang}
                    </span>
                  ))}
                </div>
              )}
              <div className="text-sm text-gray-700 mb-1">
                <span className="font-semibold">{doctor.experience} years</span> experience
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Reg No: {doctor.regNumber}
              </div>
            </div>
          </div>
          
          {/* Middle - Doctor Details */}
          <div className="w-full md:w-1/2 p-4">
            <div className="flex items-center mb-1">
              <h3 className="text-xl font-bold font-display mr-2">{doctor.name}</h3>
            </div>
            <div className="flex items-center mb-2">
              <p className="text-blue-600 font-medium mr-2">{doctor.specialty}</p>
              <Badge variant="secondary" className="text-xs">
                {doctor.isActive ? 'Available' : 'Unavailable'}
              </Badge>
            </div>
            
            {doctor.bio && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {doctor.bio}
              </p>
            )}
            
            {/* Practice Locations */}
            <div className="mb-3">
              <p className="text-sm font-medium mb-1">Practice Locations:</p>
              <div className="space-y-1">
                {doctor.locations.map((location, i) => (
                  <div key={location._id} className="flex items-center text-sm">
                    <MapPin size={14} className="mr-1 text-green-600" />
                    <span className="flex-1">{location.name} - {location.city}</span>
                    {location.distance && (
                      <Badge variant="outline" className="text-xs ml-2">
                        {location.distance}km
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Contact Methods */}
            <div className="flex flex-wrap gap-2 mb-3">
              {doctor.locations[0]?.phone && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center text-xs" 
                  onClick={() => handleCallDoctor(doctor.locations[0].phone)}
                >
                  <Phone size={14} className="mr-1 text-green-600" />
                  <span className="text-gray-800">{doctor.locations[0].phone}</span>
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center text-xs"
                onClick={handleEmailDoctor}
              >
                <Mail size={14} className="mr-1 text-blue-600" />
                <span className="text-gray-800">{doctor.email}</span>
              </Button>
            </div>
            
            {doctor.nearestDistance && (
              <p className="text-sm text-gray-600 flex items-center">
                <Navigation size={14} className="mr-1" />
                {doctor.nearestDistance}km away
              </p>
            )}
          </div>
          
          {/* Right Side - Booking */}
          <div className="w-full md:w-1/4 bg-gray-50 p-4 flex flex-col justify-between">
            <div>
              <p className="text-sm text-gray-700 mb-1">Consultation Fee:</p>
              {doctor.consultationFee ? (
                <h4 className="text-lg font-bold text-green-600 mb-2">
                  {doctor.consultationFee.currency} {doctor.consultationFee.amount}
                </h4>
              ) : (
                <p className="text-sm text-gray-500 mb-2">Contact for pricing</p>
              )}
            </div>
            <div className="space-y-2 mt-4">
              <Button 
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={handleBookNow}
              >
                Book Appointment
              </Button>
              <Button 
                variant="outline" 
                className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                onClick={handleChatFirst}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat First
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MedicalPage;
