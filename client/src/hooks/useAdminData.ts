import { useState, useEffect } from 'react';
import api from '@/utils/api-fetch';
import useAuth from './useAuth';

export interface AdminData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  role: 'superadmin' | 'manager' | 'support' | 'content';
  profileImage?: string;
  permissions: {
    manageUsers: boolean;
    manageOrganizers: boolean;
    manageDoctors: boolean;
    manageEvents: boolean;
    manageContent: boolean;
    manageAdmins: boolean;
    viewReports: boolean;
    financialAccess: boolean;
  };
  lastLogin?: string;
  isActive: boolean;
  createdAt: string;
  [key: string]: any;
}

export interface AdminDashboardStats {
  counts: {
    users: number;
    organizers: number;
    doctors: number;
    events: number;
  };
  active: {
    users: number;
    organizers: number;
    doctors: number;
  };
  pendingEvents?: number;
  upcomingEvents: Array<{
    _id: string;
    title: string;
    date: string;
    organizer: {
      _id: string;
      companyName: string;
    };
  }>;
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
}

export function useAdminData() {
  const { isAuthenticated, token, userType } = useAuth();
  const [admin, setAdmin] = useState<AdminData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAdminData = async () => {
    // Don't fetch if not authenticated or not an admin
    if (!isAuthenticated || userType !== 'admin' || !token) {
      setIsLoading(false);
      setError('Authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.success && response.data) {
        setAdmin(response.data.admin);
      } else {
        setError(response.message || 'Failed to fetch admin data');
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setError('Failed to load admin data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [isAuthenticated, token, userType]);

  return {
    admin,
    isLoading,
    error,
    refreshData: fetchAdminData
  };
}

export function useAdminDashboardStats() {
  const { isAuthenticated, token, userType } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    // Don't fetch if not authenticated or not an admin
    if (!isAuthenticated || userType !== 'admin' || !token) {
      setIsLoading(false);
      setError('Authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch dashboard stats
      const response = await api.get('/admin/dashboard-stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.success) {
        setError(response.message || 'Failed to fetch dashboard statistics');
        return;
      }

      // Initialize stats with the main dashboard data
      let dashboardData = {
        ...response.data,
        pendingEvents: 0
      };

      // Fetch pending events count - wrapped in try/catch to handle endpoint failure
      try {
        const pendingResponse = await api.get('/admin/events/pending', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        // Only update if the request was successful
        if (pendingResponse.success) {
          dashboardData.pendingEvents = pendingResponse.data.events.length;
        }
      } catch (pendingError) {
        console.warn('Could not fetch pending events:', pendingError);
        // Continue without pending events data
      }

      // Set the final stats
      setStats(dashboardData);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Failed to load dashboard statistics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [isAuthenticated, token, userType]);

  return {
    stats,
    isLoading,
    error,
    refreshStats: fetchDashboardStats
  };
}

export default useAdminData; 