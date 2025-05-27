import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaMapMarkerAlt, FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import LocationPicker from './LocationPicker';

const LocationManager = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editLocation, setEditLocation] = useState(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  // Fetch doctor locations
  useEffect(() => {
    fetchLocations();
  }, []);
  
  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/doctors/locations');
      
      if (response.data.success) {
        setLocations(response.data.data.locations);
      }
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddLocation = () => {
    setEditLocation(null);
    setShowLocationPicker(true);
  };
  
  const handleEditLocation = (location) => {
    setEditLocation(location);
    setShowLocationPicker(true);
  };
  
  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this location?')) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/doctors/locations/${locationId}`);
      
      if (response.data.success) {
        toast.success('Location deleted successfully');
        fetchLocations();
      }
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error(error.response?.data?.message || 'Failed to delete location');
    }
  };
  
  const handleSaveLocation = async (locationData) => {
    try {
      const response = await axios.post('/api/doctors/locations', locationData);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowLocationPicker(false);
        fetchLocations();
      }
    } catch (error) {
      console.error('Error saving location:', error);
      throw error; // Let the LocationPicker component handle the error
    }
  };
  
  const handleCancelEdit = () => {
    setShowLocationPicker(false);
    setEditLocation(null);
  };
  
  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return '';
    
    const parts = [];
    if (address.street) parts.push(address.street);
    if (address.city) parts.push(address.city);
    if (address.district) parts.push(address.district);
    if (address.postalCode) parts.push(address.postalCode);
    
    return parts.join(', ');
  };
  
  if (showLocationPicker) {
    return (
      <LocationPicker
        existingLocation={editLocation}
        onSave={handleSaveLocation}
        onCancel={handleCancelEdit}
      />
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Practice Locations</h2>
        <button
          onClick={handleAddLocation}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <FaPlus className="mr-2" /> Add Location
        </button>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading locations...</p>
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <FaMapMarkerAlt className="mx-auto text-gray-400 text-5xl mb-3" />
          <p className="text-gray-600 mb-4">You haven't added any practice locations yet.</p>
          <button
            onClick={handleAddLocation}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Your First Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(location => (
            <div
              key={location._id}
              className={`border rounded-lg overflow-hidden ${
                location.isMainPractice ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">
                    {location.practiceName}
                    {location.isMainPractice && (
                      <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        Main
                      </span>
                    )}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="text-blue-600 hover:text-blue-800"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location._id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <p className="text-gray-600 mt-2">
                  <FaMapMarkerAlt className="inline-block mr-1 text-gray-500" />
                  {formatAddress(location.address)}
                </p>
                
                {location.contactNumber && (
                  <p className="text-gray-600 mt-1">
                    Contact: {location.contactNumber}
                  </p>
                )}
                
                <div className="mt-3 text-sm">
                  <p className="font-medium mb-1">Working Hours:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {location.workingHours.map(hours => (
                      <div key={hours.day} className="flex">
                        <span className="w-24 font-medium">{hours.day}:</span>
                        <span>
                          {hours.isAvailable
                            ? `${hours.startTime} - ${hours.endTime}`
                            : 'Closed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationManager; 