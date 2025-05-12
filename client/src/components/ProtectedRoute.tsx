import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  userTypes?: ('user' | 'doctor' | 'organizer')[];
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  userTypes = ['user', 'doctor', 'organizer'], 
  children 
}) => {
  const { isAuthenticated, isLoading, userType } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-purple-600 animate-spin" />
          <p className="text-lg font-medium text-gray-600">Verifying your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to sign in but save the location they were trying to access
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Check if user type is allowed for this route
  if (userType && !userTypes.includes(userType as any)) {
    // User is authenticated but not allowed to access this page
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 