import React, { useState } from 'react';
import useOrganizerData from '@/hooks/useOrganizerData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';
import OrganizerProfilePicture from './OrganizerProfilePicture';
import { Loader2 } from 'lucide-react';

const OrganizerSettings: React.FC = () => {
  const { organizer, isLoading, error, refreshData } = useOrganizerData();
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    description: '',
    website: '',
    businessType: '',
    facebook: '',
    instagram: '',
    twitter: '',
    linkedin: ''
  });

  // Update form state when organizer data is loaded
  React.useEffect(() => {
    if (organizer) {
      setProfileForm({
        name: organizer.name || '',
        companyName: organizer.companyName || '',
        email: organizer.email || '',
        phone: organizer.phone || '',
        description: organizer.description || '',
        website: organizer.website || '',
        businessType: organizer.businessType || '',
        facebook: organizer.socialMedia?.facebook || '',
        instagram: organizer.socialMedia?.instagram || '',
        twitter: organizer.socialMedia?.twitter || '',
        linkedin: organizer.socialMedia?.linkedin || ''
      });
    }
  }, [organizer]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save profile settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const formData = {
        name: profileForm.name,
        companyName: profileForm.companyName,
        phone: profileForm.phone,
        description: profileForm.description,
        website: profileForm.website,
        businessType: profileForm.businessType,
        socialMedia: {
          facebook: profileForm.facebook,
          instagram: profileForm.instagram,
          twitter: profileForm.twitter,
          linkedin: profileForm.linkedin
        }
      };

      const response = await api.put('/organizer/profile', formData);

      if (response.success) {
        toast.success('Profile updated successfully');
        refreshData(); // Refresh the organizer data
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'An error occurred while updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile picture update
  const handleProfilePictureUpdate = (newImageUrl: string) => {
    refreshData(); // Refresh organizer data to get the updated logo
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !organizer) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        Error: {error || 'Failed to load organizer data'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-500">Manage your organizer profile and account settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Picture */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>Update your company logo or profile picture</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <OrganizerProfilePicture 
              currentImage={organizer.logo || ''} 
              onImageUpdated={handleProfilePictureUpdate} 
            />
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your company and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Person</Label>
                  <Input 
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleChange}
                    placeholder="Your Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input 
                    id="companyName"
                    name="companyName"
                    value={profileForm.companyName}
                    onChange={handleChange}
                    placeholder="Company Name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleChange}
                    placeholder="Email"
                    disabled // Email should not be changeable
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleChange}
                    placeholder="Phone Number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessType">Business Type</Label>
                  <Input 
                    id="businessType"
                    name="businessType"
                    value={profileForm.businessType}
                    onChange={handleChange}
                    placeholder="Business Type"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website"
                    name="website"
                    value={profileForm.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Company Description</Label>
                <Textarea 
                  id="description"
                  name="description"
                  value={profileForm.description}
                  onChange={handleChange}
                  placeholder="Describe your company..."
                  rows={4}
                />
              </div>

              <Separator className="my-6" />

              <h3 className="font-semibold text-lg">Social Media</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook">Facebook</Label>
                  <Input 
                    id="facebook"
                    name="facebook"
                    value={profileForm.facebook}
                    onChange={handleChange}
                    placeholder="Facebook URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input 
                    id="instagram"
                    name="instagram"
                    value={profileForm.instagram}
                    onChange={handleChange}
                    placeholder="Instagram URL"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter</Label>
                  <Input 
                    id="twitter"
                    name="twitter"
                    value={profileForm.twitter}
                    onChange={handleChange}
                    placeholder="Twitter URL"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn</Label>
                  <Input 
                    id="linkedin"
                    name="linkedin"
                    value={profileForm.linkedin}
                    onChange={handleChange}
                    placeholder="LinkedIn URL"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrganizerSettings; 