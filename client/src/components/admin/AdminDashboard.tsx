import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Globe, 
  Calendar, 
  ClipboardList, 
  AlertTriangle,
  Check,
  Clock,
  UserPlus,
  Bell,
  ArrowRight,
  Building,
  Home,
  MapPin,
  Star
} from 'lucide-react';
import { AdminData } from '@/hooks/useAdminData';
import { useAdminDashboardStats } from '@/hooks/useAdminData';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

interface AdminDashboardProps {
  admin: AdminData | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin }) => {
  const { stats, isLoading, error } = useAdminDashboardStats();
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-40 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center">
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <AlertTriangle className="h-12 w-12 text-red-500" />
            </div>
            <CardTitle className="text-center">Error Loading Dashboard</CardTitle>
            <CardDescription className="text-center text-red-500">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              Please try refreshing the page or contact technical support if the issue persists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome, {admin?.name || 'Administrator'}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.counts.users || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.active.users || 0} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Organizers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.counts.organizers || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.active.organizers || 0} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Venue Hosts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building className="h-8 w-8 text-pink-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.counts.venueHosts || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.active.venueHosts || 0} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Venues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Home className="h-8 w-8 text-indigo-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.counts.venues || 0}</div>
                <p className="text-xs text-gray-500">
                  Total registered venues
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.counts.doctors || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.active.doctors || 0} active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.counts.events || 0}</div>
                <div className="flex items-center">
                  <p className="text-xs text-gray-500 mr-2">
                    Total registered events
                  </p>
                  {stats?.pendingEvents && stats.pendingEvents > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {stats.pendingEvents} pending
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {stats?.pendingEvents && stats.pendingEvents > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-yellow-600" />
              <CardTitle>Events Pending Approval</CardTitle>
            </div>
            <CardDescription>
              {stats.pendingEvents} event{stats.pendingEvents !== 1 ? 's' : ''} waiting for your review
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Link to="/admin-dashboard/events/pending">
              <Button className="w-full">
                Review Pending Events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Latest scheduled events across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.upcomingEvents && stats.upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {stats.upcomingEvents.map((event) => (
                  <div key={event._id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <Globe className="h-3 w-3 mr-1" />
                          {event.organizer?.companyName || 'Unknown organizer'}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-indigo-600 font-medium">
                        {format(new Date(event.date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                <p className="text-sm">Events will appear here when scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Recently registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentUsers && stats.recentUsers.length > 0 ? (
              <div className="space-y-4">
                {stats.recentUsers.map((user) => (
                  <div key={user._id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <UserPlus className="h-4 w-4 text-blue-500 mr-2" />
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(user.createdAt), 'MMM d, yyyy')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Users className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <h3 className="text-lg font-medium mb-1">No recent users</h3>
                <p className="text-sm">New user registrations will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Trending Venues</CardTitle>
            <CardDescription>Top-rated venues on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.trendingVenues && stats.trendingVenues.length > 0 ? (
              <div className="space-y-4">
                {stats.trendingVenues.map((venue) => (
                  <div key={venue._id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      <Home className="h-4 w-4 text-indigo-500 mr-2" />
                      <div>
                        <div className="font-medium">{venue.name}</div>
                        <div className="text-xs text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {venue.location} • {venue.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-3 w-3 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium">{venue.averageRating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Building className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <h3 className="text-lg font-medium mb-1">No venues available</h3>
                <p className="text-sm">Trending venues will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {admin?.role === 'superadmin' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Superadmin Notice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700">
              You are logged in with superadmin privileges. All administrative actions are logged and audited.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminDashboard; 