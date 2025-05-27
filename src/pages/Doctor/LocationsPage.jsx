import React from 'react';
import DoctorLayout from '../../components/layouts/DoctorLayout';
import LocationManager from '../../components/Doctor/LocationManager';

const LocationsPage = () => {
  return (
    <DoctorLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Your Practice Locations</h1>
        <LocationManager />
      </div>
    </DoctorLayout>
  );
};

export default LocationsPage; 