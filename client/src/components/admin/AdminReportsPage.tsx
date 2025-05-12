import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  LineChart, 
  PieChart,
  Download, 
  FileDown, 
  AlertTriangle, 
  Search, 
  Calendar,
  Users,
  Clock,
  FileType,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  ArrowUpDown,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';
import api from '@/utils/api-fetch';

interface TrafficData {
  date: string;
  visitors: number;
  pageViews: number;
  uniqueVisitors: number;
  bounceRate: number;
}

interface UserActivity {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

interface ErrorLog {
  id: string;
  timestamp: string;
  level: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  stackTrace?: string;
  userId?: string;
  userName?: string;
  resolved: boolean;
}

const AdminReportsPage: React.FC = () => {
  // Date range state
  const defaultDateRange: DateRange = {
    from: subDays(new Date(), 30),
    to: new Date()
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [activeTab, setActiveTab] = useState('traffic');
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  
  // Filter states
  const [trafficFilter, setTrafficFilter] = useState('all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [errorFilter, setErrorFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock traffic data
  const generateMockTrafficData = () => {
    const data: TrafficData[] = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // Generate some random but realistic-looking data
      const visitors = Math.floor(Math.random() * 500) + 100;
      const uniqueVisitors = Math.floor(visitors * (0.7 + Math.random() * 0.2));
      const pageViews = Math.floor(visitors * (1.5 + Math.random() * 1));
      const bounceRate = Math.floor(Math.random() * 25) + 20;
      
      data.push({
        date: format(date, 'yyyy-MM-dd'),
        visitors,
        uniqueVisitors,
        pageViews,
        bounceRate
      });
    }
    
    return data;
  };
  
  // Mock user activity data
  const generateMockUserActivities = () => {
    const activities: UserActivity[] = [];
    const actionTypes = ['login', 'logout', 'create', 'update', 'delete', 'view'];
    const resourceTypes = ['event', 'user', 'booking', 'payment', 'settings'];
    const names = ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Chris Taylor'];
    
    for (let i = 0; i < 50; i++) {
      const actionIndex = Math.floor(Math.random() * actionTypes.length);
      const resourceIndex = Math.floor(Math.random() * resourceTypes.length);
      const nameIndex = Math.floor(Math.random() * names.length);
      
      const timestamp = new Date();
      timestamp.setMinutes(timestamp.getMinutes() - i * 30);
      
      activities.push({
        id: `act-${i}`,
        userId: `user-${nameIndex}`,
        userName: names[nameIndex],
        action: actionTypes[actionIndex],
        resourceType: resourceTypes[resourceIndex],
        resourceId: `res-${Math.floor(Math.random() * 1000)}`,
        details: `${actionTypes[actionIndex]} ${resourceTypes[resourceIndex]}`,
        ipAddress: `192.168.0.${Math.floor(Math.random() * 255)}`,
        timestamp: timestamp.toISOString()
      });
    }
    
    return activities;
  };
  
  // Mock error logs
  const generateMockErrorLogs = () => {
    const errors: ErrorLog[] = [];
    const errorMessages = [
      'Database connection failed',
      'API request timeout',
      'Authentication failed',
      'File upload error',
      'Payment processing failed',
      'Email sending failed'
    ];
    const sources = [
      'api/events',
      'api/users',
      'api/bookings',
      'api/payments',
      'services/email',
      'services/storage'
    ];
    const levels: ('error' | 'warning' | 'info')[] = ['error', 'warning', 'info'];
    
    for (let i = 0; i < 20; i++) {
      const messageIndex = Math.floor(Math.random() * errorMessages.length);
      const sourceIndex = Math.floor(Math.random() * sources.length);
      const levelIndex = Math.floor(Math.random() * levels.length);
      
      const timestamp = new Date();
      timestamp.setHours(timestamp.getHours() - i);
      
      errors.push({
        id: `err-${i}`,
        timestamp: timestamp.toISOString(),
        level: levels[levelIndex],
        message: errorMessages[messageIndex],
        source: sources[sourceIndex],
        stackTrace: i % 3 === 0 ? 'Error: Something went wrong\n   at Function.processRequest (server.js:42:15)' : undefined,
        userId: i % 4 === 0 ? `user-${i % 5}` : undefined,
        userName: i % 4 === 0 ? ['John Doe', 'Jane Smith', 'Bob Johnson', 'Alice Williams', 'Chris Taylor'][i % 5] : undefined,
        resolved: i % 3 === 0
      });
    }
    
    return errors;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // In a real application, you would fetch data from the server
        // const response = await api.get('/admin/reports/traffic', { 
        //   params: { 
        //     from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
        //     to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined 
        //   } 
        // });
        // setTrafficData(response.data);
        
        // For this example, we'll generate mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        
        setTrafficData(generateMockTrafficData());
        setUserActivities(generateMockUserActivities());
        setErrorLogs(generateMockErrorLogs());
        
        toast.success('Report data loaded successfully');
      } catch (error) {
        console.error('Error loading report data:', error);
        toast.error('Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [dateRange]);
  
  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
  };
  
  // Handle data export
  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setIsExporting(true);
    try {
      // In a real application, this would call an API endpoint to generate the export
      // const response = await api.get(`/admin/reports/export/${activeTab}`, {
      //   params: {
      //     format,
      //     from: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      //     to: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined
      //   },
      //   responseType: 'blob'
      // });
      
      // const url = window.URL.createObjectURL(new Blob([response.data]));
      // const link = document.createElement('a');
      // link.href = url;
      // link.setAttribute('download', `${activeTab}_report_${format(new Date(), 'yyyy-MM-dd')}.${format}`);
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
      
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };
  
  // Filter functions
  const getFilteredErrorLogs = () => {
    let filtered = [...errorLogs];
    
    if (errorFilter === 'error') {
      filtered = filtered.filter(log => log.level === 'error');
    } else if (errorFilter === 'warning') {
      filtered = filtered.filter(log => log.level === 'warning');
    } else if (errorFilter === 'unresolved') {
      filtered = filtered.filter(log => !log.resolved);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(query) || 
        log.source.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  const getFilteredUserActivities = () => {
    let filtered = [...userActivities];
    
    if (activityFilter !== 'all') {
      filtered = filtered.filter(activity => activity.action === activityFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(activity => 
        activity.userName.toLowerCase().includes(query) || 
        activity.details.toLowerCase().includes(query) ||
        activity.resourceType.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };
  
  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  };
  
  // Get level badge style
  const getLevelBadge = (level: 'error' | 'warning' | 'info') => {
    switch (level) {
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'info':
        return <Badge variant="secondary">Info</Badge>;
    }
  };
  
  // Get action badge style
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
      case 'logout':
        return <Badge variant="outline">{action}</Badge>;
      case 'create':
        return <Badge className="bg-green-100 text-green-800">{action}</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-800">{action}</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-800">{action}</Badge>;
      case 'view':
        return <Badge className="bg-gray-100 text-gray-800">{action}</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor website activity, user actions, and system logs</p>
        </div>
        
        <div className="flex items-center space-x-2">
          <DateRangePicker 
            value={dateRange}
            onChange={handleDateRangeChange}
          />
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => setIsLoading(false), 1000);
              toast.success('Reports refreshed');
            }}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Tabs 
        defaultValue="traffic" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="traffic" className="flex items-center">
            <BarChart className="mr-2 h-4 w-4" />
            <span>Traffic Stats</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>User Activity</span>
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center">
            <FileDown className="mr-2 h-4 w-4" />
            <span>Export Data</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4" />
            <span>Error Logs</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Traffic Stats Tab */}
        <TabsContent value="traffic" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {trafficData.reduce((sum, day) => sum + day.visitors, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  For selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Unique Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {trafficData.reduce((sum, day) => sum + day.uniqueVisitors, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  For selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {trafficData.reduce((sum, day) => sum + day.pageViews, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  For selected period
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Avg. Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {Math.round(trafficData.reduce((sum, day) => sum + day.bounceRate, 0) / trafficData.length)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  For selected period
                </p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>Daily visitor trends for the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center border-b">
                <div className="text-center text-muted-foreground">
                  <LineChart className="h-16 w-16 mx-auto text-gray-300 mb-2" />
                  <p>Interactive chart will be implemented here</p>
                  <p className="text-sm text-muted-foreground">
                    Using a charting library like Recharts or Chart.js
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="font-medium mb-2">Traffic Data</h3>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Visitors</TableHead>
                        <TableHead className="text-right">Unique</TableHead>
                        <TableHead className="text-right">Page Views</TableHead>
                        <TableHead className="text-right">Bounce Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trafficData.slice(0, 7).map((day) => (
                        <TableRow key={day.date}>
                          <TableCell>{format(new Date(day.date), 'MMM d, yyyy')}</TableCell>
                          <TableCell className="text-right">{day.visitors.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{day.uniqueVisitors.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{day.pageViews.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{day.bounceRate}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* User Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>User Activity Log</CardTitle>
                  <CardDescription>Track actions performed by users on the platform</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative w-full sm:w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search logs..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={activityFilter}
                    onValueChange={setActivityFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="login">Login</SelectItem>
                      <SelectItem value="logout">Logout</SelectItem>
                      <SelectItem value="create">Create</SelectItem>
                      <SelectItem value="update">Update</SelectItem>
                      <SelectItem value="delete">Delete</SelectItem>
                      <SelectItem value="view">View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead className="w-[70px]">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredUserActivities().slice(0, 10).map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>{activity.userName}</TableCell>
                        <TableCell>{getActionBadge(activity.action)}</TableCell>
                        <TableCell>
                          <span className="capitalize">{activity.resourceType}</span>
                          <span className="text-muted-foreground text-xs ml-1">
                            ({activity.resourceId})
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{activity.ipAddress}</TableCell>
                        <TableCell>
                          <span className="text-sm">{formatTimestamp(activity.timestamp)}</span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {getFilteredUserActivities().length > 10 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Export Data Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Export Report Data</CardTitle>
              <CardDescription>Download data in various formats for offline analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Traffic Report</CardTitle>
                    <CardDescription>Visitor and pageview statistics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="text-sm space-y-1">
                      <li>• Daily visitor counts</li>
                      <li>• Page view statistics</li>
                      <li>• Bounce rates</li>
                      <li>• Traffic sources</li>
                    </ul>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">User Activity Report</CardTitle>
                    <CardDescription>User actions and behavior</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="text-sm space-y-1">
                      <li>• User logins and registrations</li>
                      <li>• Content creation/edits</li>
                      <li>• Purchase activities</li>
                      <li>• Administrative actions</li>
                    </ul>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">System Logs</CardTitle>
                    <CardDescription>Error and warning events</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <ul className="text-sm space-y-1">
                      <li>• Error messages</li>
                      <li>• Warning logs</li>
                      <li>• System events</li>
                      <li>• Performance metrics</li>
                    </ul>
                  </CardContent>
                  <CardFooter className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('csv')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('excel')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleExport('pdf')}
                      disabled={isExporting}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Custom Export</CardTitle>
                  <CardDescription>Create a custom report with specific data points</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Report Type</Label>
                      <Select defaultValue="combined">
                        <SelectTrigger>
                          <SelectValue placeholder="Select report type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="combined">Combined Report</SelectItem>
                          <SelectItem value="traffic">Traffic Only</SelectItem>
                          <SelectItem value="activity">User Activity Only</SelectItem>
                          <SelectItem value="errors">Errors Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>File Format</Label>
                      <Select defaultValue="excel">
                        <SelectTrigger>
                          <SelectValue placeholder="Select file format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={() => {
                      toast.promise(
                        new Promise(resolve => setTimeout(resolve, 2000)),
                        {
                          loading: 'Generating custom report...',
                          success: 'Custom report downloaded successfully',
                          error: 'Failed to generate report'
                        }
                      );
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Generate Custom Report
                  </Button>
                </CardFooter>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Error Logs Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <CardTitle>System Error Logs</CardTitle>
                  <CardDescription>Monitor and troubleshoot system errors</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative w-full sm:w-[200px]">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search errors..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={errorFilter}
                    onValueChange={setErrorFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter errors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Logs</SelectItem>
                      <SelectItem value="error">Errors Only</SelectItem>
                      <SelectItem value="warning">Warnings Only</SelectItem>
                      <SelectItem value="unresolved">Unresolved Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[70px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredErrorLogs().slice(0, 10).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{getLevelBadge(log.level)}</TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {log.message}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{log.source}</TableCell>
                        <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                        <TableCell>
                          {log.resolved ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Unresolved
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>View Details</DropdownMenuItem>
                              <DropdownMenuItem>
                                {log.resolved ? 'Mark as Unresolved' : 'Mark as Resolved'}
                              </DropdownMenuItem>
                              <DropdownMenuItem>Archive Log</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {getFilteredErrorLogs().length > 10 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline">
                    Load More
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportsPage; 