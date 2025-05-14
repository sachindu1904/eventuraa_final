import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  LogOut, 
  Settings, 
  User, 
  Home, 
  Shield, 
  ClipboardList,
  Globe,
  FileText,
  HelpCircle,
  AlertTriangle,
  Building,
  LandPlot,
  CircleExclamation
} from 'lucide-react';
import { AdminData } from '@/hooks/useAdminData';
import useAuth from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';

interface SubMenuItem {
  name: string;
  path: string;
  badge?: string;
}

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  submenu?: SubMenuItem[];
}

interface AdminSidebarProps {
  admin: AdminData | null;
  isLoading?: boolean;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ 
  admin, 
  isLoading = false 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const baseNavItems = [
    { name: 'Dashboard', path: '/admin-dashboard', icon: <Home size={20} /> },
    { name: 'Users', path: '/admin-dashboard/users', icon: <Users size={20} /> },
    { name: 'Organizers', path: '/admin-dashboard/organizers', icon: <Globe size={20} /> },
    { name: 'Venue Hosts', path: '/admin-dashboard/venue-hosts', icon: <Building size={20} /> },
    { name: 'Doctors', path: '/admin-dashboard/doctors', icon: <ClipboardList size={20} /> },
    { 
      name: 'Events', 
      path: '/admin-dashboard/events', 
      icon: <Calendar size={20} />,
      submenu: [
        { name: 'All Events', path: '/admin-dashboard/events' },
        { name: 'Pending Approval', path: '/admin-dashboard/events/pending', badge: 'new' }
      ]
    },
    { 
      name: 'Venues', 
      path: '/admin-dashboard/venues', 
      icon: <LandPlot size={20} />,
      submenu: [
        { name: 'All Venues', path: '/admin-dashboard/venues' },
        { name: 'Pending Approval', path: '/admin-dashboard/venues/pending', badge: 'new' }
      ]
    },
    { name: 'Reports', path: '/admin-dashboard/reports', icon: <BarChart3 size={20} /> },
  ];

  // Add admin management option only if user has permission
  const navItems: NavItem[] = [...baseNavItems];
  if (admin?.permissions?.manageAdmins) {
    navItems.push({ 
      name: 'Admin Management', 
      path: '/admin-dashboard/admins', 
      icon: <Shield size={20} /> 
    });
  }
  
  // Add settings at the end
  navItems.push({ 
    name: 'Settings', 
    path: '/admin-dashboard/settings', 
    icon: <Settings size={20} /> 
  });

  const getMemberSince = () => {
    if (!admin?.createdAt) return 'New admin';
    
    try {
      const date = new Date(admin.createdAt);
      return `Member for ${formatDistanceToNow(date, { addSuffix: false })}`;
    } catch (e) {
      return 'Admin member';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'superadmin':
        return 'bg-red-100 text-red-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'support':
        return 'bg-green-100 text-green-800';
      case 'content':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-64 bg-white border-r shadow-sm min-h-screen flex flex-col">
      <div className="p-5 border-b bg-indigo-50 flex items-center space-x-2">
        <Shield className="h-5 w-5 text-indigo-700" />
        <Link to="/admin-dashboard" className="text-xl font-bold text-indigo-700">
          Admin Panel
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
        ) : admin ? (
          <>
            <div className="relative mb-4">
              <img 
                src={admin.profileImage || "/default-admin-avatar.png"} 
                alt={admin.name}
                className="h-20 w-20 rounded-full object-cover border-2 border-gray-200" 
              />
              <div className={`absolute bottom-0 right-0 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(admin.role)}`}>
                {admin.role}
              </div>
            </div>
            <h3 className="font-semibold text-gray-800">{admin.name}</h3>
            <p className="text-sm text-gray-600 mb-1">{admin.email}</p>
            <p className="text-xs text-gray-500">{getMemberSince()}</p>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-red-500">Unable to load profile</p>
          </div>
        )}
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              {item.submenu ? (
                <div className="mb-1">
                  <div
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                      location.pathname.startsWith(item.path)
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </div>
                  <ul className="ml-8 mt-1 space-y-1">
                    {item.submenu.map(subItem => (
                      <li key={subItem.path}>
                        <Link
                          to={subItem.path}
                          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                            location.pathname === subItem.path
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span className="w-1 h-1 rounded-full bg-current"></span>
                          {subItem.name}
                          {subItem.badge && (
                            <span className="ml-auto text-xs font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                              {subItem.badge}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-md transition-colors ${
                    location.pathname === item.path
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="px-4 py-2 border-t">
        <div className="flex items-center justify-between text-sm px-4 py-2 text-gray-500">
          <HelpCircle size={16} />
          <span>Need help?</span>
          <Link to="/admin-dashboard/support" className="text-indigo-600 hover:underline">
            Support
          </Link>
        </div>
      </div>
      
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

export default AdminSidebar; 