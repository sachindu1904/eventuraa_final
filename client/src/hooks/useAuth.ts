import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/utils/api-fetch';

export interface UserData {
  id: string;
  name: string;
  email: string;
  [key: string]: any;
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  userType: 'user' | 'doctor' | 'organizer' | null;
  userData: UserData | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    token: null,
    userType: null,
    userData: null
  });
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('user');
    
    setAuthState({
      isAuthenticated: false,
      isLoading: false,
      token: null,
      userType: null,
      userData: null
    });
    
    navigate('/signin');
  };

  const checkAuth = async () => {
    try {
      // Check for token in localStorage or sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
      const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
      
      if (!token || !userType || !userDataStr) {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          token: null,
          userType: null,
          userData: null
        });
        return false;
      }
      
      // Parse user data
      const userData = JSON.parse(userDataStr) as UserData;
      
      try {
        // Validate token with the server
        const response = await api.get('/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.success) {
          // Store the freshest user data from server
          const freshUserData = {
            ...userData,
            ...response.data?.user
          };
          
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            token,
            userType: userType as any,
            userData: freshUserData
          });
          return true;
        } else {
          logout();
          return false;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        
        // If the error is a 403 forbidden, the token might be valid but the user type is wrong
        // In this case, we'll still consider the user authenticated but with correct permissions
        if (error instanceof Error && error.message.includes('Access denied. You do not have permission')) {
          console.log('User authenticated but has incorrect permissions for this resource');
          
          setAuthState({
            isAuthenticated: true,
            isLoading: false,
            token,
            userType: userType as any,
            userData: userData
          });
          return true;
        }
        
        logout();
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        token: null,
        userType: null,
        userData: null
      });
      return false;
    }
  };

  // Check auth state on component mount
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    logout,
    checkAuth
  };
};

export default useAuth; 