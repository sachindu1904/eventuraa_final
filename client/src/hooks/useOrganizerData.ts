import { useState, useEffect } from 'react';
import api from '@/utils/api-fetch';
import useAuth from './useAuth';

export interface OrganizerData {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  logo?: string;
  businessType?: string;
  description?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  verificationStatus?: {
    isVerified: boolean;
    verificationDate?: string;
  };
  events?: string[];
  averageRating?: number;
  subscription?: {
    plan: string;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
  };
  createdAt: string;
  [key: string]: any;
}

export function useOrganizerData() {
  const { isAuthenticated, token, userType } = useAuth();
  const [organizer, setOrganizer] = useState<OrganizerData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizerData = async () => {
    // Don't fetch if not authenticated or not an organizer
    if (!isAuthenticated || userType !== 'organizer' || !token) {
      setIsLoading(false);
      setError('Authentication required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get('/organizer/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.success && response.data) {
        setOrganizer(response.data.organizer);
      } else {
        setError(response.message || 'Failed to fetch organizer data');
      }
    } catch (err) {
      console.error('Error fetching organizer data:', err);
      setError('Failed to load organizer data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizerData();
  }, [isAuthenticated, token, userType]);

  return {
    organizer,
    isLoading,
    error,
    refreshData: fetchOrganizerData
  };
}

export default useOrganizerData; 