import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';
import BookingsList from '@/components/BookingsList';

const AdminDashboardPage: React.FC = () => {
  const { admin, isLoading, error } = useAdminData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({
    users: 0,
    venues: 0,
    bookings: 0,
    events: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        // Check if token exists
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (!token) {
          toast.error('Please login to access admin dashboard');
          navigate('/admin-login');
          return;
        }

        // Check if user type is admin
        const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
        if (userType !== 'admin') {
          toast.error('Unauthorized access');
          navigate('/');
          return;
        }

        // Fetch dashboard statistics
        const response = await api.get('/admin/dashboard-stats');
        
        if (response.success && response.data) {
          setStats({
            users: response.data.userCount || 0,
            venues: response.data.venueCount || 0,
            bookings: response.data.bookingCount || 0,
            events: response.data.eventCount || 0,
            pendingApprovals: response.data.pendingApprovals || 0,
          });
        } else {
          toast.error('Failed to load dashboard data');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Session expired. Please login again');
        navigate('/admin-login');
      }
    };

    checkAdminAuth();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('user');
    
    toast.success('Logged out successfully');
    navigate('/admin-login');
  };

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
                <Route path="/bookings" element={<BookingsList isAdmin={true} />} />
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