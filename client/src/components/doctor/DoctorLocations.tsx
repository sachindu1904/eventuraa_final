import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Plus, MapPin, Edit, Trash2, Save, X, Map } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';

interface Location {
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
}

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
  regNumber: string;
  experience: number;
  profileImage?: string;
  consultationFee?: { amount: number; currency: string; };
  languages?: string[];
  bio?: string;
  isActive: boolean;
  verificationStatus?: { isVerified: boolean; verificationDate?: string; };
  appointmentsToday?: number;
  urgentAppointments?: number;
  unreadMessages?: number;
  locations?: Location[];
}

interface DoctorLocationsProps {
  doctor: Doctor;
}

interface ApiResponse {
  success: boolean;
  data?: Location | Location[];
  message?: string;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyA-2OvXggOlxKWuByjgQq6cwYj8TrWnvHo';

const DoctorLocations: React.FC<DoctorLocationsProps> = ({ doctor }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{lat: number; lng: number} | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
    loadGoogleMaps();
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
      toast({
        title: "Maps Error",
        description: "Failed to load Google Maps. Location selection may be limited.",
        variant: "destructive",
      });
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !mapLoaded) return;

    // Default to Colombo, Sri Lanka
    const defaultCenter = { lat: 6.9271, lng: 79.8612 };
    
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    // Add click listener to map
    googleMapRef.current.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const lat = event.latLng.lat();
        const lng = event.latLng.lng();
        
        setSelectedCoordinates({ lat, lng });
        updateMarker(lat, lng);
        reverseGeocode(lat, lng);
      }
    });

    // Initialize autocomplete for address input
    if (addressInputRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(addressInputRef.current, {
        types: ['establishment', 'geocode'],
        componentRestrictions: { country: 'lk' }, // Restrict to Sri Lanka
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current?.getPlace();
        if (place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          
          setSelectedCoordinates({ lat, lng });
          updateMarker(lat, lng);
          googleMapRef.current?.setCenter({ lat, lng });
          googleMapRef.current?.setZoom(15);
          
          // Update form with place details
          if (place.formatted_address) {
            setFormData(prev => ({
              ...prev,
              address: place.formatted_address || prev.address
            }));
          }
        }
      });
    }
  };

  const updateMarker = (lat: number, lng: number) => {
    if (!googleMapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
    }

    // Create new marker
    markerRef.current = new google.maps.Marker({
      position: { lat, lng },
      map: googleMapRef.current,
      title: 'Selected Location',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(32, 32),
      },
    });
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      
      if (response.results[0]) {
        const result = response.results[0];
        const addressComponents = result.address_components;
        
        let city = '';
        let state = '';
        let zipCode = '';
        
        addressComponents.forEach(component => {
          const types = component.types;
          if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('postal_code')) {
            zipCode = component.long_name;
          }
        });

        setFormData(prev => ({
          ...prev,
          address: result.formatted_address,
          city: city || prev.city,
          state: state || prev.state,
          zipCode: zipCode || prev.zipCode
        }));
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5001/api/doctors/locations', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setLocations(data.data);
      } else {
        console.warn('Unexpected API response format:', data);
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast({
        title: "Error",
        description: "Failed to load locations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: ''
    });
    setShowAddForm(false);
    setShowMap(false);
    setEditingId(null);
    setSelectedCoordinates(null);
    
    // Clear marker
    if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  };

  const handleAdd = async () => {
    try {
      if (!formData.name || !formData.address || !formData.city) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, Address, City).",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const locationData = {
        ...formData,
        coordinates: selectedCoordinates
      };

      const response = await fetch('http://localhost:5001/api/doctors/locations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && data.data && !Array.isArray(data.data)) {
        setLocations(prev => [...prev, data.data as Location]);
        resetForm();
        toast({
          title: "Success",
          description: "Location added successfully with map coordinates!",
        });
      } else {
        throw new Error(data.message || 'Failed to add location');
      }
    } catch (error) {
      console.error('Error adding location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add location. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location: Location) => {
    setFormData({
      name: location.name,
      address: location.address,
      city: location.city,
      state: location.state,
      zipCode: location.zipCode,
      phone: location.phone || ''
    });
    setEditingId(location._id);
    setShowAddForm(true);
    
    // Set coordinates if available
    if (location.coordinates) {
      setSelectedCoordinates(location.coordinates);
    }
  };

  const handleUpdate = async () => {
    try {
      if (!formData.name || !formData.address || !formData.city) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields (Name, Address, City).",
          variant: "destructive",
        });
        return;
      }

      if (!editingId) return;

      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const locationData = {
        ...formData,
        coordinates: selectedCoordinates
      };

      const response = await fetch(`http://localhost:5001/api/doctors/locations/${editingId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && data.data && !Array.isArray(data.data)) {
        setLocations(prev => prev.map(loc => 
          loc._id === editingId ? data.data as Location : loc
        ));
        resetForm();
        toast({
          title: "Success",
          description: "Location updated successfully!",
        });
      } else {
        throw new Error(data.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error updating location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update location. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (locationId: string) => {
    try {
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:5001/api/doctors/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setLocations(prev => prev.filter(location => location._id !== locationId));
      toast({
        title: "Success",
        description: "Location deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting location:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete location. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowMap = () => {
    setShowMap(true);
    // Initialize map after state update
    setTimeout(() => {
      initializeMap();
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Practice Locations</h2>
          <p className="text-gray-600">
            Manage your practice locations with precise map coordinates
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)} 
          className="bg-green-600 hover:bg-green-700"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* Add/Edit Location Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Location' : 'Add New Location'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Practice Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Main Clinic"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="e.g., +94 11 234 5678"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                ref={addressInputRef}
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Search for address or click on map"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="e.g., Colombo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">Province/State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="e.g., Western Province"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">Postal Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="e.g., 00100"
                />
              </div>
            </div>

            {/* Map Integration */}
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">
                  Location on Map {selectedCoordinates && (
                    <span className="text-green-600 text-xs">
                      ✓ Coordinates selected ({selectedCoordinates.lat.toFixed(4)}, {selectedCoordinates.lng.toFixed(4)})
                    </span>
                  )}
                </Label>
                {!showMap && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={handleShowMap}
                    disabled={!mapLoaded}
                  >
                    <Map className="h-4 w-4 mr-2" />
                    {mapLoaded ? 'Show Map' : 'Loading Maps...'}
                  </Button>
                )}
              </div>
              
              {showMap && (
                <div 
                  ref={mapRef} 
                  className="w-full h-64 rounded border"
                  style={{ minHeight: '256px' }}
                />
              )}
              
              {!showMap && (
                <p className="text-sm text-gray-600">
                  Click "Show Map" to select precise location coordinates. This helps patients find you more easily.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={editingId ? handleUpdate : handleAdd}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingId ? 'Update Location' : 'Save Location'}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Locations List */}
      <div className="grid gap-4">
        {loading && locations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <div className="animate-spin h-8 w-8 border-b-2 border-green-600 rounded-full mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading locations...</p>
            </CardContent>
          </Card>
        ) : locations.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No locations added yet</h3>
              <p className="text-gray-600">Add your first practice location to help patients find you.</p>
            </CardContent>
          </Card>
        ) : (
          locations.map((location) => (
            <Card key={location._id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold">{location.name}</h3>
                      {location.coordinates && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          📍 Mapped
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{location.address}</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>
                        {location.city}
                        {location.state && `, ${location.state}`}
                        {location.zipCode && ` ${location.zipCode}`}
                      </p>
                      {location.phone && (
                        <p>📞 {location.phone}</p>
                      )}
                      {location.coordinates && (
                        <p className="text-xs">
                          📍 {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(location)}
                      disabled={loading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(location._id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DoctorLocations; 