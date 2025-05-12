import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, BarChart3, Plus, ListTodo, LogOut, Settings, User, Home } from 'lucide-react';
import { OrganizerData } from '@/hooks/useOrganizerData';
import useAuth from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface OrganizerSidebarProps {
  organizer: OrganizerData | null;
  isLoading?: boolean;
}

const OrganizerSidebar: React.FC<OrganizerSidebarProps> = ({ 
  organizer, 
  isLoading = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/organizer-portal', icon: <Home size={20} /> },
    { name: 'My Events', path: '/organizer-portal/events', icon: <Calendar size={20} /> },
    { name: 'Create Event', path: '/organizer-portal/events/new', icon: <Plus size={20} /> },
    { name: 'Analytics', path: '/organizer-portal/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Account Settings', path: '/organizer-portal/settings', icon: <Settings size={20} /> },
  ];

  const getMemberSince = () => {
    if (!organizer?.createdAt) return 'New member';
    
    try {
      const date = new Date(organizer.createdAt);
      return `Member for ${formatDistanceToNow(date, { addSuffix: false })}`;
    } catch (e) {
      return 'Member';
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="w-64 bg-white border-r shadow-sm min-h-screen flex flex-col">
      <div className="p-5 border-b bg-gray-50">
        <Link to="/organizer-portal" className="text-xl font-bold text-purple-700">
          Eventuraa Organizer
        </Link>
      </div>
      
      <div className="p-5 flex flex-col items-center border-b">
        {isLoading ? (
          <div className="animate-pulse flex flex-col items-center w-full">
            <div className="rounded-full bg-gray-200 h-20 w-20 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ) : organizer ? (
          <>
            <div className="relative mb-4">
              <img 
                src={organizer.logo || "/default-company-logo.png"} 
                alt={organizer.companyName}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" 
              />
              {organizer.verificationStatus?.isVerified && (
                <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <h3 className="font-semibold text-gray-800">{organizer.companyName}</h3>
            <p className="text-sm text-gray-600 mb-1">{organizer.name}</p>
            <p className="text-xs text-gray-500">{getMemberSince()}</p>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-red-500">Unable to load profile</p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                  location.pathname === item.path
                    ? 'bg-purple-50 text-purple-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default OrganizerSidebar;
