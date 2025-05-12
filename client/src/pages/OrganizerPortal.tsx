import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import OrganizerSidebar from '@/components/organizer/OrganizerSidebar';
import OrganizerDashboard from '@/components/organizer/OrganizerDashboard';
import EventsList from '@/components/organizer/EventsList';
import CreateEvent from '@/components/organizer/CreateEvent';
import EditEvent from '@/components/organizer/EditEvent';
import SalesAnalytics from '@/components/organizer/SalesAnalytics';
import OrganizerSettings from '@/components/organizer/OrganizerSettings';
import ProtectedRoute from '@/components/ProtectedRoute';
import useOrganizerData from '@/hooks/useOrganizerData';
import { Loader2 } from 'lucide-react';

const OrganizerPortal: React.FC = () => {
  const { organizer, isLoading, error } = useOrganizerData();

  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a 
            href="/signin" 
            className="inline-block px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute userTypes={['organizer']}>
      <div className="flex min-h-screen bg-gray-50">
        <OrganizerSidebar organizer={organizer} isLoading={isLoading} />
        
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
                <p className="mt-4 text-gray-600">Loading organizer data...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<OrganizerDashboard organizer={organizer} />} />
                <Route path="/events" element={<EventsList />} />
                <Route path="/events/new" element={<CreateEvent />} />
                <Route path="/events/:id" element={<EditEvent />} />
                <Route path="/analytics" element={<SalesAnalytics />} />
                <Route path="/settings" element={<OrganizerSettings />} />
                <Route path="*" element={<Navigate to="/organizer-portal" />} />
              </Routes>
            </div>
          )}
          
          <footer className="py-6 border-t text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Eventuraa.lk - Event Organizer Portal
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default OrganizerPortal;
