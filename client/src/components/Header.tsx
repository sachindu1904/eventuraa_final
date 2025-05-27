import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import { LogOut, User } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  _id: string;
  // More specific types for additional properties that might be in user data
  userType?: string;
  phone?: string;
  profileImage?: string;
  role?: string;
}

const Header = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const userDataStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    
    if (token && userDataStr) {
      setIsAuthenticated(true);
      try {
        setUserData(JSON.parse(userDataStr));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userType');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userType');
    sessionStorage.removeItem('user');
    
    setIsAuthenticated(false);
    setUserData(null);
    
    // Redirect to home
    navigate('/');
  };

  return (
    <header className="bg-white py-4 shadow-md">
      <div className="container-custom flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-gray-800">
          Eventuraa.lk
        </Link>
        <div className="flex items-center">
          <nav className="hidden md:block">
            <ul className="flex items-center space-x-6">
              <li>
                <Link to="/" className="text-gray-600 hover:text-gray-800">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-gray-600 hover:text-gray-800">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/nightlife" className="text-gray-600 hover:text-gray-800">
                  Nightlife
                </Link>
              </li>
              
              <li>
                <Link to="/hotels" className="text-gray-600 hover:text-gray-800">
                  Hotels
                </Link>
              </li>
              <li>
                <Link to="/hidden-gems" className="text-gray-600 hover:text-gray-800">
                  Hidden Gems
                </Link>
              </li>
              <li>
                <Link to="/medical" className="text-gray-600 hover:text-gray-800">
                  Medical
                </Link>
              </li>
            </ul>
          </nav>
          <div className="flex items-center gap-4 ml-6">
            <LanguageSwitcher />
            
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-600" />
                  <span className="text-sm text-gray-600">{userData?.name || 'User'}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </div>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link to="/signup" className="hidden md:inline-flex">
                  <Button variant="default">Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <div className="bg-eventuraa-yellow py-1 text-center text-sm">
        <div className="container-custom">
          <p className="text-eventuraa-orange font-medium">
            <Link to="/hidden-gems-owner-login" className="underline">Property Owner?</Link> List your Hidden Gem and earn with just 5-10% commission
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
