import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Ticket, Users, CreditCard, Calendar, TrendingUp, Mail, Clock } from 'lucide-react';
import { OrganizerData } from '@/hooks/useOrganizerData';
import api from '@/utils/api-fetch';
import useAuth from '@/hooks/useAuth';

interface OrganizerDashboardProps {
  organizer: OrganizerData | null;
}

interface DashboardStats {
  totalEvents: number;
  activeEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  upcomingEvents: Array<{
    _id: string;
    title: string;
    date: string;
    ticketsSold: number;
    location: string;
  }>;
  recentActivity: Array<{
    _id: string;
    type: string;
    description: string;
    date: string;
  }>;
}

const OrganizerDashboard: React.FC<OrganizerDashboardProps> = ({ organizer }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { token } = useAuth();
  
  // Fetch dashboard stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!token) return;
      
      try {
        setIsLoading(true);
        const response = await api.get('/organizer/dashboard-stats', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Using default mock data if API fails
        setStats({
          totalEvents: 0,
          activeEvents: 0,
          totalAttendees: 0,
          totalRevenue: 0,
          upcomingEvents: [],
          recentActivity: []
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardStats();
  }, [token]);
  
  // Show skeleton loading state
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
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Welcome back, {organizer?.name || 'Organizer'}!
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.totalEvents || 0}</div>
                <p className="text-xs text-gray-500">
                  {stats?.activeEvents || 0} currently active
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Attendees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-indigo-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">{stats?.totalAttendees || 0}</div>
                <p className="text-xs text-gray-500">
                  Across all events
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold">
                  LKR {stats?.totalRevenue ? (stats.totalRevenue).toLocaleString() : '0'}
                </div>
                <p className="text-xs text-gray-500">
                  From ticket sales
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Subscription</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold capitalize">
                  {organizer?.subscription?.plan || 'Free'}
                </div>
                <p className="text-xs text-gray-500">
                  {organizer?.subscription?.isActive 
                    ? 'Active subscription' 
                    : 'Inactive subscription'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Your next scheduled events</CardDescription>
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
                        <div className="text-xs text-gray-500">{new Date(event.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-purple-600 font-medium">{event.ticketsSold}</span> tickets sold
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <h3 className="text-lg font-medium mb-1">No upcoming events</h3>
                <p className="text-sm mb-4">Start creating events to see them here</p>
                <Button asChild variant="outline">
                  <a href="/organizer-portal/events/new">Create New Event</a>
                </Button>
              </div>
            )}
          </CardContent>
          {stats?.upcomingEvents && stats.upcomingEvents.length > 0 && (
            <CardFooter>
              <Button asChild variant="outline" className="w-full">
                <a href="/organizer-portal/events">View All Events</a>
              </Button>
            </CardFooter>
          )}
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions on your account</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-4">
                {stats.recentActivity.map((activity) => (
                  <div key={activity._id} className="flex justify-between items-center border-b pb-2">
                    <div className="flex items-center">
                      {activity.type === 'ticket_sale' && <Ticket className="h-4 w-4 text-green-500 mr-2" />}
                      {activity.type === 'event_created' && <Calendar className="h-4 w-4 text-purple-500 mr-2" />}
                      {activity.type === 'message' && <Mail className="h-4 w-4 text-blue-500 mr-2" />}
                      <div>
                        <div className="font-medium">{activity.description}</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(activity.date).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <Clock className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <h3 className="text-lg font-medium mb-1">No recent activity</h3>
                <p className="text-sm">Your recent actions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
