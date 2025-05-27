import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import axios from 'axios';
import { toast } from 'react-toastify';

// Default center - Sri Lanka
const DEFAULT_CENTER = { lat: 7.8731, lng: 80.7718 };
const DEFAULT_ZOOM = 8;

const LocationPicker = ({ existingLocation, onSave, onCancel }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places']
  });

  const [location, setLocation] = useState({
    practiceName: existingLocation?.practiceName || '',
    address: existingLocation?.address || {
      street: '',
      city: '',
      district: '',
      postalCode: '',
      country: 'Sri Lanka'
    },
    coordinates: existingLocation?.coordinates || DEFAULT_CENTER,
    contactNumber: existingLocation?.contactNumber || '',
    isMainPractice: existingLocation?.isMainPractice || false,
    workingHours: existingLocation?.workingHours || [
      { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true },
      { day: 'Saturday', startTime: '09:00', endTime: '14:00', isAvailable: true },
      { day: 'Sunday', startTime: '09:00', endTime: '12:00', isAvailable: false }
    ]
  });

  const [mapCenter, setMapCenter] = useState(
    existingLocation?.coordinates || DEFAULT_CENTER
  );
  const [loading, setLoading] = useState(false);

  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const autocompleteRef = useRef(null);

  useEffect(() => {
    if (isLoaded && searchInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        { 
          componentRestrictions: { country: 'lk' },
          fields: ['address_components', 'formatted_address', 'geometry', 'name']
        }
      );

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        if (place.geometry) {
          const newCoordinates = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          };
          
          setMapCenter(newCoordinates);
          
          // Extract address components
          const addressComponents = {
            street: '',
            city: '',
            district: '',
            postalCode: '',
            country: 'Sri Lanka'
          };
          
          place.address_components.forEach(component => {
            const types = component.types;
            
            if (types.includes('route')) {
              addressComponents.street = component.long_name;
            } else if (types.includes('locality')) {
              addressComponents.city = component.long_name;
            } else if (types.includes('administrative_area_level_2')) {
              addressComponents.district = component.long_name;
            } else if (types.includes('postal_code')) {
              addressComponents.postalCode = component.long_name;
            }
          });
          
          setLocation(prev => ({
            ...prev,
            address: addressComponents,
            coordinates: newCoordinates
          }));
        }
      });
    }
  }, [isLoaded]);

  const handleMapClick = (e) => {
    const newCoordinates = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    
    setLocation(prev => ({
      ...prev,
      coordinates: newCoordinates
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setLocation(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setLocation(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleWorkingHoursChange = (index, field, value) => {
    const updatedHours = [...location.workingHours];
    
    if (field === 'isAvailable') {
      updatedHours[index].isAvailable = !updatedHours[index].isAvailable;
    } else {
      updatedHours[index][field] = value;
    }
    
    setLocation(prev => ({
      ...prev,
      workingHours: updatedHours
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!location.practiceName) {
      toast.error('Practice name is required');
      return;
    }
    
    if (!location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
      toast.error('Please select a location on the map');
      return;
    }
    
    setLoading(true);
    
    try {
      // Call the parent component's onSave function to handle the API call
      await onSave({
        ...location,
        locationId: existingLocation?._id
      });
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error(error.response?.data?.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          setMapCenter(currentLocation);
          setLocation(prev => ({
            ...prev,
            coordinates: currentLocation
          }));
        },
        (error) => {
          console.error('Error getting current location:', error);
          toast.error('Unable to get your current location');
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser');
    }
  };

  if (!isLoaded) {
    return <div className="text-center py-10">Loading Google Maps...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">{existingLocation ? 'Edit Location' : 'Add New Location'}</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Practice Name*
              </label>
              <input
                type="text"
                name="practiceName"
                value={location.practiceName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Main Clinic, City Branch"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Location
              </label>
              <input
                ref={searchInputRef}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search for a location"
              />
              <button 
                type="button"
                onClick={handleGetCurrentLocation}
                className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
              >
                Use My Current Location
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Street Address
              </label>
              <input
                type="text"
                name="address.street"
                value={location.address.street}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="address.city"
                  value={location.address.city}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  District
                </label>
                <input
                  type="text"
                  name="address.district"
                  value={location.address.district}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="District"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  name="address.postalCode"
                  value={location.address.postalCode}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Postal code"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  type="text"
                  name="contactNumber"
                  value={location.contactNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Contact number"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  name="isMainPractice"
                  checked={location.isMainPractice}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                Set as main practice location
              </label>
            </div>
          </div>
          
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Click on the map to set your exact location*
              </label>
              <div className="h-[300px] border border-gray-300 rounded-md">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={10}
                  onClick={handleMapClick}
                  onLoad={map => {
                    mapRef.current = map;
                  }}
                >
                  {location.coordinates && (
                    <Marker
                      position={location.coordinates}
                      draggable={true}
                      onDragEnd={e => {
                        const newCoordinates = {
                          lat: e.latLng.lat(),
                          lng: e.latLng.lng()
                        };
                        setLocation(prev => ({
                          ...prev,
                          coordinates: newCoordinates
                        }));
                      }}
                    />
                  )}
                </GoogleMap>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Coordinates: {location.coordinates?.lat.toFixed(6)}, {location.coordinates?.lng.toFixed(6)}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Working Hours
              </label>
              <div className="max-h-[200px] overflow-y-auto">
                {location.workingHours.map((hours, index) => (
                  <div key={hours.day} className="flex items-center mb-2">
                    <div className="w-24 text-sm font-medium">{hours.day}</div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={hours.isAvailable}
                        onChange={() => handleWorkingHoursChange(index, 'isAvailable')}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      {hours.isAvailable ? (
                        <>
                          <input
                            type="time"
                            value={hours.startTime}
                            onChange={e => handleWorkingHoursChange(index, 'startTime', e.target.value)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md"
                            disabled={!hours.isAvailable}
                          />
                          <span className="mx-1">-</span>
                          <input
                            type="time"
                            value={hours.endTime}
                            onChange={e => handleWorkingHoursChange(index, 'endTime', e.target.value)}
                            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md"
                            disabled={!hours.isAvailable}
                          />
                        </>
                      ) : (
                        <span className="text-sm text-gray-500 ml-2">Closed</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-6 space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            disabled={loading}
          >
            {loading ? 'Saving...' : existingLocation ? 'Update Location' : 'Save Location'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocationPicker; 