import { toast } from '@/components/ui/sonner';

// API base URL configuration - ensure this matches your server
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Define API response interfaces
export interface VenueResponseData {
  venue: {
    _id: string;
    name: string;
    type: string;
    location: string;
    description?: string;
    address?: {
      street?: string;
      city?: string;
      district?: string;
      postalCode?: string;
      country?: string;
    };
    facilities?: string[];
    amenities?: string[];
    capacity?: {
      min?: number;
      max?: number;
    };
    priceRange?: {
      currency?: string;
      min?: number;
      max?: number;
    };
    images?: any[];
    imageUrl?: string;
    venueHost?: string;
    approvalStatus?: string;
    isActive?: boolean;
  };
  roomTypes?: any[];
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  userType: 'user' | 'doctor' | 'organizer' | 'admin';
}

/**
 * Wrapper around fetch with error handling for API requests
 */
async function apiFetch<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;
  
  // Get auth token from storage if available
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  // Check if body is FormData
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    // Don't set Content-Type for FormData (browser sets it with boundary)
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    console.log(`Making API request to: ${url} (${isFormData ? 'FormData' : 'JSON'})`);
    const response = await fetch(url, config);
    
    // Check content type to catch HTML responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error('Received HTML instead of JSON. Check API endpoint and server configuration.');
      toast.error('API endpoint returned HTML instead of JSON. Please check server configuration.');
      throw new Error('API returned HTML instead of JSON');
    }
    
    // Parse the JSON response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      toast.error('Invalid response format from server');
      throw new Error('Invalid JSON response from server');
    }
    
    // Check if response is not ok (status outside 200-299)
    if (!response.ok) {
      // Log the full error response for debugging
      console.error('Server error response:', data);
      
      // Handle different status codes
      switch (response.status) {
        case 401:
          toast.error('Authentication required. Please log in.');
          break;
        case 403:
          toast.error('You do not have permission to perform this action.');
          break;
        case 404:
          toast.error('The requested resource was not found.');
          break;
        case 500:
          // Enhanced 500 error handling
          const errorDetail = data.error || data.message || 'Unknown server error';
          console.error('Server error details:', errorDetail);
          toast.error(`Server error: ${errorDetail}. Please try again later.`);
          break;
        default:
          toast.error(data.message || 'An error occurred. Please try again.');
      }
      
      // Create a more detailed error object
      const error = new Error(data.message || 'API request failed');
      (error as any).statusCode = response.status;
      (error as any).responseData = data;
      throw error;
    }
    
    return data as ApiResponse<T>;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      toast.error('Cannot connect to server. Please check your connection.');
      console.error('Network error:', error);
    } else if (error instanceof Error) {
      // Only show toast if it wasn't already shown in status code handling
      if (!error.message.includes('API request failed') && 
          !error.message.includes('API returned HTML') &&
          !error.message.includes('Invalid JSON')) {
        toast.error(error.message || 'An error occurred');
      }
    }
    
    console.error('API Error:', error);
    throw error;
  }
}

// API client object with methods for common HTTP verbs
const api = {
  get: <T>(endpoint: string, options?: RequestInit) => 
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, data?: any, options?: RequestInit) => {
    // Check if data is FormData and handle it accordingly
    if (data instanceof FormData) {
      // For FormData, don't set Content-Type as browser will set it with boundary
      return apiFetch<T>(endpoint, {
        ...options,
        method: 'POST',
        body: data // Use FormData directly as body
      });
    }
    
    // For JSON data, stringify it
    return apiFetch<T>(endpoint, { 
      ...options, 
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined
    });
  },
  
  put: <T>(endpoint: string, data?: any, isFormData: boolean = false, options?: RequestInit) => {
    // Check if data is FormData or isFormData flag is set
    if (data instanceof FormData || isFormData) {
      return apiFetch<T>(endpoint, {
        ...options, 
        method: 'PUT',
        body: data // Use data directly as FormData
      });
    }
    
    // For regular JSON data
    return apiFetch<T>(endpoint, { 
      ...options, 
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined
    });
  },
  
  patch: <T>(endpoint: string, data?: any, options?: RequestInit) => 
    apiFetch<T>(endpoint, { 
      ...options, 
      method: 'PATCH',
      body: JSON.stringify(data)
    }),
  
  delete: <T>(endpoint: string, options?: RequestInit) => 
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
    
  // Legacy method for uploading form data with files
  uploadFormData: <T>(endpoint: string, formData: FormData, options?: RequestInit) => {
    // For FormData, we should not set Content-Type as the browser will set it with boundary
    const headers = { ...options?.headers };
    
    // Remove Content-Type as browser will set it automatically with the correct boundary
    if (headers && 'Content-Type' in headers) {
      delete headers['Content-Type'];
    }
    
    return apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      headers,
      body: formData
    });
  }
};

// Check if the API server is accessible
export const checkApiConnection = async (): Promise<boolean> => {
  try {
    // Just check if the server responds at all
    const baseUrl = API_URL.substring(0, API_URL.lastIndexOf('/api'));
    console.log(`Checking API connection to: ${baseUrl}`);
    const response = await fetch(baseUrl);
    // Consider any response as successful connection
    return response.status !== 0; // Status 0 means no connection
  } catch (error) {
    console.error('API connection check failed:', error);
    return false;
  }
};

// Function to check MongoDB connection via API
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    console.log(`Checking database connection via: ${API_URL}/check-db`);
    const response = await fetch(`${API_URL}/check-db`);
    const data = await response.json();
    return data.success && data.connection.state === 1;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
};

export default api; 