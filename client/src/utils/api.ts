// Try ESM import syntax that Vite prefers
import axios from 'axios';
import { toast } from '@/components/ui/sonner';

// API base URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // If token exists, add to headers
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error);

    // Handle different error scenarios
    if (!error.response) {
      // Network error or server not running
      toast.error('Cannot connect to server. Please check your connection.');
    } else {
      // Server returned an error response
      const message = error.response.data?.message || 'An error occurred. Please try again.';
      
      // Handle different status codes
      switch (error.response.status) {
        case 401:
          toast.error('Authentication required. Please log in.');
          // You could redirect to login page here
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('The requested resource was not found.');
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

// Check if the API server is accessible
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

// Function to check MongoDB connection via API
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    const response = await api.get('/check-db');
    return response.data.success && response.data.connection.state === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

export default api; 