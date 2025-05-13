import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminUsersPage from '@/components/admin/AdminUsersPage';
import AdminOrganizersPage from '@/components/admin/AdminOrganizersPage';
import AdminDoctorsPage from '@/components/admin/AdminDoctorsPage';
import AdminEventsPage from '@/components/admin/AdminEventsPage';
import AdminEventDetailPage from '@/components/admin/AdminEventDetailPage';
import AdminSettingsPage from '@/components/admin/AdminSettingsPage';
import AdminReportsPage from '@/components/admin/AdminReportsPage';
import PendingEventsApproval from '@/components/admin/PendingEventsApproval';
import AdminVenuesPage from '@/components/admin/AdminVenuesPage';
import AdminVenueDetailPage from '@/components/admin/AdminVenueDetailPage';
import PendingVenuesApproval from '@/components/admin/PendingVenuesApproval';
import AdminVenueHostsPage from '@/components/admin/AdminVenueHostsPage';
import AdminVenueHostDetailPage from '@/components/admin/AdminVenueHostDetailPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import useAdminData from '@/hooks/useAdminData';
import { Loader2 } from 'lucide-react';

const AdminDashboardPage: React.FC = () => {
  const { admin, isLoading, error } = useAdminData();

  if (error && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md bg-white rounded-lg shadow-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <a 
            href="/admin-login" 
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go to Admin Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute userTypes={['admin']}>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar admin={admin} isLoading={isLoading} />
        
        <div className="flex-1 flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                <p className="mt-4 text-gray-600">Loading admin data...</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<AdminDashboard admin={admin} />} />
                <Route path="/users" element={<AdminUsersPage />} />
                <Route path="/organizers" element={<AdminOrganizersPage />} />
                <Route path="/venue-hosts" element={<AdminVenueHostsPage />} />
                <Route path="/doctors" element={<AdminDoctorsPage />} />
                <Route path="/events" element={<AdminEventsPage />} />
                <Route path="/events/detail/:eventId" element={<AdminEventDetailPage />} />
                <Route path="/events/pending" element={<PendingEventsApproval />} />
                <Route path="/venues" element={<AdminVenuesPage />} />
                <Route path="/venues/detail/:venueId" element={<AdminVenueDetailPage />} />
                <Route path="/venues/pending" element={<PendingVenuesApproval />} />
                <Route path="/venue-hosts" element={<AdminVenueHostsPage />} />
                <Route path="/venue-hosts/detail/:hostId" element={<AdminVenueHostDetailPage />} />
                <Route path="/reports" element={<AdminReportsPage />} />
                <Route path="/admins" element={<div>Admin Management</div>} />
                <Route path="/settings" element={<AdminSettingsPage />} />
                <Route path="/support" element={<div>Support</div>} />
                <Route path="*" element={<Navigate to="/admin-dashboard" />} />
              </Routes>
            </div>
          )}
          
          <footer className="py-6 border-t text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Eventuraa.lk - Admin Control Panel
          </footer>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboardPage; 