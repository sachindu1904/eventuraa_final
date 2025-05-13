import React, { useState, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { Camera, Loader2, User, Mail, Phone, MapPin, Building } from 'lucide-react';
import api from '@/utils/api-fetch';

interface VenueHost {
  _id: string;
  name: string;
  email: string;
  phone: string;
  venueName: string;
  venueType: string;
  venueLocation: string;
  description?: string;
  profileImage?: string;
  businessAddress?: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
}

interface VenueHostSettingsProps {
  venueHost: VenueHost;
  onUpdate: (updatedVenueHost: VenueHost) => void;
}

const VenueHostSettings: React.FC<VenueHostSettingsProps> = ({ venueHost, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: venueHost.name || '',
    phone: venueHost.phone || '',
    venueName: venueHost.venueName || '',
    venueType: venueHost.venueType || 'restaurant',
    venueLocation: venueHost.venueLocation || '',
    description: venueHost.description || '',
    street: venueHost.businessAddress?.street || '',
    city: venueHost.businessAddress?.city || '',
    district: venueHost.businessAddress?.district || '',
    postalCode: venueHost.businessAddress?.postalCode || '',
    country: venueHost.businessAddress?.country || 'Sri Lanka',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const venueTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'resort', label: 'Resort' },
    { value: 'banquet_hall', label: 'Banquet Hall' },
    { value: 'conference_center', label: 'Conference Center' },
    { value: 'other', label: 'Other' },
  ];
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Create the update payload
      const updateData = {
        name: formData.name,
        phone: formData.phone,
        venueName: formData.venueName,
        venueType: formData.venueType,
        venueLocation: formData.venueLocation,
        description: formData.description,
        businessAddress: {
          street: formData.street,
          city: formData.city,
          district: formData.district,
          postalCode: formData.postalCode,
          country: formData.country,
        }
      };
      
      const response = await api.put('/venue-host/profile', updateData);
      
      if (response.success) {
        toast.success('Profile updated successfully');
        onUpdate(response.data.venueHost);
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('An error occurred while updating your profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, JPEG, or PNG)');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await api.put('/venue-host/profile/update-image', formData, true);
      
      if (response.success) {
        toast.success('Profile image updated successfully');
        // Update the venue host data with the new profile image
        onUpdate({
          ...venueHost,
          profileImage: response.data.profileImage
        });
      } else {
        toast.error(response.message || 'Failed to update profile image');
      }
    } catch (error) {
      console.error('Error updating profile image:', error);
      toast.error('An error occurred while updating your profile image');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your personal and business information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-6">
            <div 
              className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100 mb-4 cursor-pointer"
              onClick={handleImageClick}
            >
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              ) : (
                <>
                  {venueHost.profileImage ? (
                    <img 
                      src={venueHost.profileImage} 
                      alt={venueHost.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity">
                    <Camera className="h-8 w-8 text-white opacity-0 hover:opacity-100" />
                  </div>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg, image/png, image/jpg"
              onChange={handleImageChange}
            />
            <p className="text-sm text-gray-500">Click to change profile picture</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your full name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Your phone number"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2">
                    <Label htmlFor="venueName">Venue/Business Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="venueName"
                        name="venueName"
                        value={formData.venueName}
                        onChange={handleChange}
                        placeholder="Your venue name"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="venueType">Venue Type</Label>
                    <Select 
                      value={formData.venueType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, venueType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue type" />
                      </SelectTrigger>
                      <SelectContent>
                        {venueTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="venueLocation">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="venueLocation"
                        name="venueLocation"
                        value={formData.venueLocation}
                        onChange={handleChange}
                        placeholder="City or area"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Write a brief description about your venue"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="street">Street Address</Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Street address"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="City"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      name="district"
                      value={formData.district}
                      onChange={handleChange}
                      placeholder="District"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Postal code"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Country"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default VenueHostSettings; 