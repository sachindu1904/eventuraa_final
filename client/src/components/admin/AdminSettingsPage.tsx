import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Settings, 
  Users, 
  Lock, 
  PlusCircle, 
  Save, 
  Loader2, 
  RefreshCw, 
  FileUp, 
  AlertTriangle, 
  Check, 
  X,
  Key,
  History,
  ShieldAlert,
  Globe,
  UserCog,
  UserPlus,
  Mail,
  Phone,
  Eye,
  EyeOff
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
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

// Define interfaces for the different settings types
interface Role {
  id: string;
  name: string;
  isDefault?: boolean;
  permissions: string[];
}

interface SystemSettings {
  siteTitle: string;
  siteLogo?: string;
  faviconUrl?: string;
  primaryColor?: string;
  isMaintenanceMode: boolean;
  maintenanceMessage?: string;
}

interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  blockedAt: string;
  blockedUntil?: string;
}

interface Session {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAgent: string;
  ipAddress: string;
  lastActivity: string;
  isActive: boolean;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  group: string;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  permissions: {
    manageUsers: boolean;
    manageOrganizers: boolean;
    manageDoctors: boolean;
    manageEvents: boolean;
    manageContent: boolean;
    manageAdmins: boolean;
    viewReports: boolean;
    financialAccess: boolean;
  };
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

// Define API response interfaces
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

interface AdminsResponse {
  admins: AdminUser[];
}

interface AdminResponse {
  admin: AdminUser;
}

const PERMISSION_GROUPS = [
  { id: 'content', name: 'Content Management' },
  { id: 'users', name: 'User Management' },
  { id: 'events', name: 'Event Management' },
  { id: 'system', name: 'System Settings' },
  { id: 'reports', name: 'Analytics & Reports' }
];

const DEFAULT_PERMISSIONS: Permission[] = [
  { id: 'create_events', name: 'Create Events', description: 'Create new events', group: 'events' },
  { id: 'edit_events', name: 'Edit Events', description: 'Edit existing events', group: 'events' },
  { id: 'delete_events', name: 'Delete Events', description: 'Delete events', group: 'events' },
  { id: 'approve_events', name: 'Approve Events', description: 'Approve or reject events', group: 'events' },
  
  { id: 'manage_users', name: 'Manage Users', description: 'Create, edit, or delete users', group: 'users' },
  { id: 'view_users', name: 'View Users', description: 'View user details', group: 'users' },
  
  { id: 'manage_roles', name: 'Manage Roles', description: 'Create, edit, or delete roles', group: 'system' },
  { id: 'manage_settings', name: 'Manage Settings', description: 'Change system settings', group: 'system' },
  
  { id: 'view_reports', name: 'View Reports', description: 'View analytics and reports', group: 'reports' },
  { id: 'export_data', name: 'Export Data', description: 'Export data from the system', group: 'reports' },
];

const DEFAULT_ADMIN_ROLES = ['superadmin', 'manager', 'support', 'content'];

const AdminSettingsPage: React.FC = () => {
  // Role management state
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'Admin', isDefault: true, permissions: ['manage_roles', 'manage_settings', 'manage_users', 'view_users', 'create_events', 'edit_events', 'delete_events', 'approve_events', 'view_reports', 'export_data'] },
    { id: '2', name: 'Moderator', permissions: ['approve_events', 'edit_events', 'view_users', 'view_reports'] },
    { id: '3', name: 'Analytics', permissions: ['view_reports', 'export_data'] }
  ]);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>(DEFAULT_PERMISSIONS);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  // System settings state
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteTitle: 'Eventuraa.lk',
    siteLogo: '/assets/logo.png',
    faviconUrl: '/favicon.ico',
    primaryColor: '#7E69AB',
    isMaintenanceMode: false,
    maintenanceMessage: 'Our site is currently undergoing scheduled maintenance. Please check back soon!'
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Security state
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [newIPAddress, setNewIPAddress] = useState('');
  const [newIPReason, setNewIPReason] = useState('');
  const [blockDuration, setBlockDuration] = useState('permanent');
  const [isIPDialogOpen, setIsIPDialogOpen] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('roles');

  // Admin accounts state
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [newAdminData, setNewAdminData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'manager',
    password: '',
    showPassword: false,
    permissions: {
      manageUsers: false,
      manageOrganizers: false,
      manageDoctors: false,
      manageEvents: false,
      manageContent: false,
      manageAdmins: false,
      viewReports: true,
      financialAccess: false
    }
  });
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [isSavingAdmin, setIsSavingAdmin] = useState(false);

  const { register, handleSubmit, reset, setValue } = useForm<SystemSettings>({
    defaultValues: systemSettings
  });

  // Mock loading data function - in a real app, this would fetch from your API
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, you would have API calls like these:
        // const rolesResponse = await api.get('/admin/roles');
        // setRoles(rolesResponse.data.roles);
        
        // const settingsResponse = await api.get('/admin/settings');
        // setSystemSettings(settingsResponse.data.settings);
        
        // Simulating API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data loaded - using the initial state values
        toast.success('Settings loaded successfully');
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Try to create a seed admin account when component first loads
  useEffect(() => {
    const createSeedAdminIfNeeded = async () => {
      try {
        // This endpoint only works if no admins exist yet
        const response = await api.post<{ admin: { email: string, password: string } }>('/admin/seed-admin');
        
        if (response.success) {
          toast.success('Initial admin account created successfully');
          console.log('Created admin account:', response.data?.admin);
          
          // Show a success message with the credentials
          if (response.data?.admin) {
            toast.success(
              `Admin credentials: ${response.data.admin.email} / ${response.data.admin.password}`,
              { duration: 10000 }
            );
          }
        }
      } catch (error) {
        // Ignore errors - this will fail if admins already exist
        console.log('Seed admin not needed or failed');
      }
    };

    createSeedAdminIfNeeded();
  }, []);

  // Fetch admin accounts
  useEffect(() => {
    if (activeTab === 'admins') {
      fetchAdmins();
    }
  }, [activeTab]);

  const fetchAdmins = async () => {
    try {
      setIsLoadingAdmins(true);
      setAdminError(null);
      
      const response = await api.get<AdminsResponse>('/admin/accounts/all');
      
      if (response.success) {
        setAdmins(response.data?.admins || []);
      } else {
        throw new Error(response.message || 'Failed to load admin accounts');
      }
    } catch (error: any) {
      console.error('Error fetching admin accounts:', error);
      setAdminError(error.message || 'An error occurred while loading admin accounts');
      toast.error('Failed to load admin accounts');
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const handleAdminInputChange = (field: string, value: any) => {
    setNewAdminData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAdminPermissionToggle = (permission: string) => {
    setNewAdminData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission as keyof typeof prev.permissions]
      }
    }));
  };

  const validateAdminData = () => {
    if (!newAdminData.name.trim()) return 'Name is required';
    if (!newAdminData.email.trim()) return 'Email is required';
    if (!/^\S+@\S+\.\S+$/.test(newAdminData.email)) return 'Invalid email format';
    if (!newAdminData.password || newAdminData.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  const handleCreateAdmin = async () => {
    const validationError = validateAdminData();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      setIsSavingAdmin(true);
      
      const response = await api.post<AdminResponse>('/admin/accounts', {
        name: newAdminData.name,
        email: newAdminData.email,
        phone: newAdminData.phone,
        password: newAdminData.password,
        role: newAdminData.role,
        permissions: newAdminData.permissions
      });
      
      if (response.success) {
        toast.success('Admin account created successfully');
        setIsCreatingAdmin(false);
        setNewAdminData({
          name: '',
          email: '',
          phone: '',
          role: 'manager',
          password: '',
          showPassword: false,
          permissions: {
            manageUsers: false,
            manageOrganizers: false,
            manageDoctors: false,
            manageEvents: false,
            manageContent: false,
            manageAdmins: false,
            viewReports: true,
            financialAccess: false
          }
        });
        fetchAdmins();
      } else {
        throw new Error(response.message || 'Failed to create admin account');
      }
    } catch (error: any) {
      console.error('Error creating admin account:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create admin account');
    } finally {
      setIsSavingAdmin(false);
    }
  };

  const toggleAdminStatus = async (adminId: string, currentStatus: boolean) => {
    try {
      const response = await api.patch<AdminResponse>(`/admin/accounts/${adminId}/toggle-status`, {
        isActive: !currentStatus
      });
      
      if (response.success) {
        toast.success(`Admin account ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchAdmins();
      } else {
        throw new Error(response.message || 'Failed to update admin status');
      }
    } catch (error: any) {
      console.error('Error toggling admin status:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to update admin status');
    }
  };

  // Handle role creation
  const handleAddRole = () => {
    setIsAddingRole(true);
    setSelectedPermissions([]);
  };

  const handleCreateRole = (name: string) => {
    if (!name.trim()) {
      toast.error('Role name cannot be empty');
      return;
    }

    const newRole: Role = {
      id: Date.now().toString(),
      name: name.trim(),
      permissions: selectedPermissions
    };

    setRoles([...roles, newRole]);
    setIsAddingRole(false);
    toast.success(`Role "${name}" created successfully`);
  };

  // Handle role editing
  const handleEditRole = (role: Role) => {
    setIsEditingRole(role);
    setSelectedPermissions([...role.permissions]);
  };

  const handleUpdateRole = (name: string) => {
    if (!isEditingRole) return;
    if (!name.trim()) {
      toast.error('Role name cannot be empty');
      return;
    }

    const updatedRoles = roles.map(role => 
      role.id === isEditingRole.id 
        ? { ...role, name: name.trim(), permissions: selectedPermissions }
        : role
    );

    setRoles(updatedRoles);
    setIsEditingRole(null);
    toast.success(`Role "${name}" updated successfully`);
  };

  // Handle role deletion
  const handleDeleteRole = (roleId: string) => {
    const roleToDelete = roles.find(role => role.id === roleId);
    if (roleToDelete?.isDefault) {
      toast.error('Cannot delete the default admin role');
      return;
    }

    const updatedRoles = roles.filter(role => role.id !== roleId);
    setRoles(updatedRoles);
    toast.success('Role deleted successfully');
  };

  // Handle permission toggling for roles
  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Handle system settings submission
  const onSystemSettingsSubmit = async (data: SystemSettings) => {
    setIsSaving(true);
    try {
      // In a real implementation, you would have API calls like:
      // const formData = new FormData();
      // Object.entries(data).forEach(([key, value]) => {
      //   if (key !== 'siteLogo' || !selectedFile) {
      //     formData.append(key, value as string);
      //   }
      // });
      // if (selectedFile) {
      //   formData.append('siteLogo', selectedFile);
      // }
      // await api.put('/admin/settings', formData);

      // Simulating API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSystemSettings({
        ...systemSettings,
        ...data,
        siteLogo: logoPreview || systemSettings.siteLogo
      });
      toast.success('System settings updated successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to update system settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      toast.error('Please select an image file');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle IP blocking
  const handleAddBlockedIP = () => {
    if (!newIPAddress.trim()) {
      toast.error('IP address cannot be empty');
      return;
    }

    // Validate IP address format
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newIPAddress)) {
      toast.error('Please enter a valid IP address');
      return;
    }

    const now = new Date();
    let blockedUntil: Date | undefined;
    
    if (blockDuration !== 'permanent') {
      blockedUntil = new Date(now);
      const days = parseInt(blockDuration);
      blockedUntil.setDate(blockedUntil.getDate() + days);
    }

    const newBlockedIP: BlockedIP = {
      id: Date.now().toString(),
      ipAddress: newIPAddress,
      reason: newIPReason || 'No reason provided',
      blockedAt: now.toISOString(),
      blockedUntil: blockedUntil?.toISOString()
    };

    setBlockedIPs([...blockedIPs, newBlockedIP]);
    setNewIPAddress('');
    setNewIPReason('');
    setBlockDuration('permanent');
    setIsIPDialogOpen(false);
    toast.success(`IP address ${newIPAddress} blocked successfully`);
  };

  // Handle IP unblocking
  const handleUnblockIP = (ipId: string) => {
    const updatedBlockedIPs = blockedIPs.filter(ip => ip.id !== ipId);
    setBlockedIPs(updatedBlockedIPs);
    toast.success('IP address unblocked successfully');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Simulated loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-16">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Settings</h1>
          <p className="text-muted-foreground">Manage system settings and configurations</p>
        </div>
      </div>

      <Tabs 
        defaultValue="roles" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="roles" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            <span>Role Management</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>System Settings</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <Lock className="mr-2 h-4 w-4" />
            <span>Security & Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            <span>Admin Accounts</span>
          </TabsTrigger>
        </TabsList>

        {/* Role Management */}
        <TabsContent value="roles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>
                Define roles and assign permissions to control access to the system
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={handleAddRole}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add New Role
                </Button>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role Name</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">
                        {role.name}
                        {role.isDefault && (
                          <Badge variant="outline" className="ml-2">
                            Default
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.length > 0 ? (
                            role.permissions.slice(0, 3).map((permId) => {
                              const perm = permissions.find(p => p.id === permId);
                              return perm ? (
                                <Badge key={permId} variant="secondary" className="mr-1">
                                  {perm.name}
                                </Badge>
                              ) : null;
                            })
                          ) : (
                            <span className="text-muted-foreground">No permissions</span>
                          )}
                          {role.permissions.length > 3 && (
                            <Badge variant="outline">
                              +{role.permissions.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditRole(role)}
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            disabled={role.isDefault}
                            onClick={() => handleDeleteRole(role.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Add/Edit Role Dialog */}
          <Dialog open={isAddingRole || isEditingRole !== null} onOpenChange={(open) => {
            if (!open) {
              setIsAddingRole(false);
              setIsEditingRole(null);
            }
          }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {isAddingRole ? 'Add New Role' : 'Edit Role'}
                </DialogTitle>
                <DialogDescription>
                  {isAddingRole 
                    ? 'Create a new role and assign permissions' 
                    : 'Update role name and permissions'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col space-y-4 overflow-hidden flex-1">
                <div className="space-y-2">
                  <Label htmlFor="roleName">Role Name</Label>
                  <Input 
                    id="roleName" 
                    placeholder="e.g., Content Manager"
                    defaultValue={isEditingRole?.name || ''}
                  />
                </div>

                <div className="space-y-2 flex-1 overflow-hidden">
                  <Label>Permissions</Label>
                  <div className="border rounded-md overflow-hidden flex flex-col h-[300px]">
                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-6">
                        {PERMISSION_GROUPS.map(group => (
                          <div key={group.id} className="space-y-2">
                            <h4 className="font-medium text-sm">{group.name}</h4>
                            <div className="space-y-2 ml-2">
                              {permissions
                                .filter(perm => perm.group === group.id)
                                .map(permission => (
                                  <div key={permission.id} className="flex items-start space-x-2">
                                    <Checkbox 
                                      id={permission.id} 
                                      checked={selectedPermissions.includes(permission.id)}
                                      onCheckedChange={() => handlePermissionToggle(permission.id)}
                                    />
                                    <div className="grid gap-1.5">
                                      <Label 
                                        htmlFor={permission.id}
                                        className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {permission.name}
                                      </Label>
                                      <p className="text-sm text-muted-foreground">
                                        {permission.description}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAddingRole(false);
                    setIsEditingRole(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    const name = (document.getElementById('roleName') as HTMLInputElement).value;
                    if (isAddingRole) {
                      handleCreateRole(name);
                    } else if (isEditingRole) {
                      handleUpdateRole(name);
                    }
                  }}
                >
                  {isAddingRole ? 'Create Role' : 'Update Role'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-4">
          <form onSubmit={handleSubmit(onSystemSettingsSubmit)}>
            <Card>
              <CardHeader>
                <CardTitle>Site Configuration</CardTitle>
                <CardDescription>
                  Customize your site title, logo, and branding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="siteTitle">Site Title</Label>
                    <Input 
                      id="siteTitle" 
                      placeholder="Your site title"
                      defaultValue={systemSettings.siteTitle}
                      {...register('siteTitle')}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex space-x-2">
                      <Input 
                        id="primaryColor" 
                        type="text"
                        defaultValue={systemSettings.primaryColor}
                        {...register('primaryColor')}
                      />
                      <div 
                        className="h-9 w-9 rounded-md border" 
                        style={{ backgroundColor: systemSettings.primaryColor }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Logo</Label>
                  <div className="flex items-center space-x-4">
                    <div className="h-20 w-20 rounded-md border flex items-center justify-center overflow-hidden bg-gray-50">
                      {(logoPreview || systemSettings.siteLogo) ? (
                        <img 
                          src={logoPreview || systemSettings.siteLogo} 
                          alt="Site logo" 
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <FileUp className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      Choose Logo
                    </Button>
                    <input 
                      id="logo-upload" 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Maintenance Mode</CardTitle>
                <CardDescription>
                  Toggle maintenance mode to temporarily disable the site
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="maintenance-mode"
                    checked={systemSettings.isMaintenanceMode}
                    onCheckedChange={(checked) => {
                      setValue('isMaintenanceMode', checked);
                    }}
                  />
                  <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                  <Textarea 
                    id="maintenanceMessage"
                    placeholder="Message to display during maintenance"
                    defaultValue={systemSettings.maintenanceMessage}
                    {...register('maintenanceMessage')}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </TabsContent>

        {/* Security & Privacy */}
        <TabsContent value="security" className="space-y-4">
          <Tabs defaultValue="ip-blocking" className="space-y-4">
            <TabsList>
              <TabsTrigger value="ip-blocking">
                <ShieldAlert className="mr-2 h-4 w-4" />
                IP Blocking
              </TabsTrigger>
              <TabsTrigger value="sessions">
                <History className="mr-2 h-4 w-4" />
                Session Management
              </TabsTrigger>
            </TabsList>

            {/* IP Blocking */}
            <TabsContent value="ip-blocking" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div>IP Blocking / Blacklisting</div>
                    <Button onClick={() => setIsIPDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Block New IP
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Manage blocked IP addresses to prevent access to the site
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {blockedIPs.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>IP Address</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Blocked At</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedIPs.map((ip) => (
                          <TableRow key={ip.id}>
                            <TableCell className="font-medium">{ip.ipAddress}</TableCell>
                            <TableCell>{ip.reason}</TableCell>
                            <TableCell>{formatDate(ip.blockedAt)}</TableCell>
                            <TableCell>
                              {ip.blockedUntil ? formatDate(ip.blockedUntil) : 'Permanent'}
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => handleUnblockIP(ip.id)}
                              >
                                Unblock
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No IP addresses are currently blocked
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Block IP Dialog */}
              <Dialog open={isIPDialogOpen} onOpenChange={setIsIPDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Block IP Address</DialogTitle>
                    <DialogDescription>
                      Add an IP address to the blacklist to prevent access
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ip-address">IP Address</Label>
                      <Input 
                        id="ip-address" 
                        placeholder="e.g., 192.168.1.1"
                        value={newIPAddress}
                        onChange={(e) => setNewIPAddress(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="block-reason">Reason</Label>
                      <Textarea 
                        id="block-reason" 
                        placeholder="Why is this IP being blocked?"
                        value={newIPReason}
                        onChange={(e) => setNewIPReason(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="block-duration">Duration</Label>
                      <Select 
                        value={blockDuration} 
                        onValueChange={setBlockDuration}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select block duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 day</SelectItem>
                          <SelectItem value="7">1 week</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="permanent">Permanent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsIPDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddBlockedIP}>
                      Block IP
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* Session Management */}
            <TabsContent value="sessions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Active Sessions</CardTitle>
                  <CardDescription>
                    View and manage active user sessions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <div className="py-4 text-center text-muted-foreground">
                      Session management will be implemented in a future update
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Admin Accounts Tab */}
        <TabsContent value="admins" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>Admin Accounts</div>
                <Button onClick={() => setIsCreatingAdmin(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Admin Account
                </Button>
              </CardTitle>
              <CardDescription>
                Manage admin users who can access the admin dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingAdmins ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : adminError ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-500">{adminError}</p>
                  <Button variant="outline" className="mt-4" onClick={fetchAdmins}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              ) : admins.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-25" />
                  <p>No admin accounts found</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setIsCreatingAdmin(true)}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create Admin Account
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow key={admin._id}>
                        <TableCell className="font-medium">{admin.name}</TableCell>
                        <TableCell>{admin.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {admin.role.charAt(0).toUpperCase() + admin.role.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(admin.permissions)
                              .filter(([_, value]) => value === true)
                              .slice(0, 2)
                              .map(([key]) => (
                                <Badge key={key} variant="secondary" className="mr-1">
                                  {key.replace('manage', '').replace('Access', '')}
                                </Badge>
                              ))}
                            {Object.values(admin.permissions).filter(v => v === true).length > 2 && (
                              <Badge variant="outline">
                                +{Object.values(admin.permissions).filter(v => v === true).length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={admin.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                            {admin.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant={admin.isActive ? "destructive" : "outline"} 
                            size="sm"
                            onClick={() => toggleAdminStatus(admin._id, admin.isActive)}
                          >
                            {admin.isActive ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Create Admin Dialog */}
          <Dialog open={isCreatingAdmin} onOpenChange={(open) => !isSavingAdmin && setIsCreatingAdmin(open)}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>Create Admin Account</DialogTitle>
                <DialogDescription>
                  Add a new admin user with specific permissions
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col space-y-4 overflow-y-auto py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-name">Full Name</Label>
                    <Input 
                      id="admin-name" 
                      placeholder="John Doe" 
                      value={newAdminData.name}
                      onChange={(e) => handleAdminInputChange('name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input 
                      id="admin-email" 
                      type="email" 
                      placeholder="admin@example.com" 
                      value={newAdminData.email}
                      onChange={(e) => handleAdminInputChange('email', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-phone">Phone (Optional)</Label>
                    <Input 
                      id="admin-phone" 
                      placeholder="+94 77 123 4567" 
                      value={newAdminData.phone}
                      onChange={(e) => handleAdminInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="admin-role">Role</Label>
                    <Select 
                      value={newAdminData.role} 
                      onValueChange={(value) => handleAdminInputChange('role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_ADMIN_ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="admin-password">Password</Label>
                  <div className="relative">
                    <Input 
                      id="admin-password" 
                      type={newAdminData.showPassword ? "text" : "password"} 
                      placeholder="Minimum 6 characters" 
                      value={newAdminData.password}
                      onChange={(e) => handleAdminInputChange('password', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => handleAdminInputChange('showPassword', !newAdminData.showPassword)}
                    >
                      {newAdminData.showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Permissions</Label>
                  <div className="grid grid-cols-2 gap-4 border rounded-md p-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-users" 
                        checked={newAdminData.permissions.manageUsers}
                        onCheckedChange={() => handleAdminPermissionToggle('manageUsers')}
                      />
                      <Label htmlFor="perm-users">Manage Users</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-organizers" 
                        checked={newAdminData.permissions.manageOrganizers}
                        onCheckedChange={() => handleAdminPermissionToggle('manageOrganizers')}
                      />
                      <Label htmlFor="perm-organizers">Manage Organizers</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-doctors" 
                        checked={newAdminData.permissions.manageDoctors}
                        onCheckedChange={() => handleAdminPermissionToggle('manageDoctors')}
                      />
                      <Label htmlFor="perm-doctors">Manage Doctors</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-events" 
                        checked={newAdminData.permissions.manageEvents}
                        onCheckedChange={() => handleAdminPermissionToggle('manageEvents')}
                      />
                      <Label htmlFor="perm-events">Manage Events</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-content" 
                        checked={newAdminData.permissions.manageContent}
                        onCheckedChange={() => handleAdminPermissionToggle('manageContent')}
                      />
                      <Label htmlFor="perm-content">Manage Content</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-admins" 
                        checked={newAdminData.permissions.manageAdmins}
                        onCheckedChange={() => handleAdminPermissionToggle('manageAdmins')}
                      />
                      <Label htmlFor="perm-admins">Manage Admins</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-reports" 
                        checked={newAdminData.permissions.viewReports}
                        onCheckedChange={() => handleAdminPermissionToggle('viewReports')}
                      />
                      <Label htmlFor="perm-reports">View Reports</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="perm-financial" 
                        checked={newAdminData.permissions.financialAccess}
                        onCheckedChange={() => handleAdminPermissionToggle('financialAccess')}
                      />
                      <Label htmlFor="perm-financial">Financial Access</Label>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingAdmin(false)}
                  disabled={isSavingAdmin}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateAdmin}
                  disabled={isSavingAdmin}
                >
                  {isSavingAdmin ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      Create Admin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage; 