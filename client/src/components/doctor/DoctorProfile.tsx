import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, User, Mail, Phone, FileText, Languages, DollarSign } from 'lucide-react';

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  email: string;
  phone?: string;
  regNumber: string;
  experience: number;
  profileImage?: string;
  consultationFee?: { amount: number; currency: string; };
  languages?: string[];
  bio?: string;
  isActive: boolean;
  verificationStatus?: { isVerified: boolean; verificationDate?: string; };
  appointmentsToday?: number;
  urgentAppointments?: number;
  unreadMessages?: number;
  locations?: Location[];
}

interface Location {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
}

interface DoctorProfileProps {
  doctor: Doctor;
  onUpdate: (updatedDoctor: Doctor) => void;
}

interface ApiResponse {
  success: boolean;
  data?: {
    doctor: Doctor;
  };
  message?: string;
}

const DoctorProfile: React.FC<DoctorProfileProps> = ({ doctor, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: doctor.name || '',
    specialty: doctor.specialty || '',
    phone: doctor.phone || '',
    experience: doctor.experience || 0,
    bio: doctor.bio || '',
    languages: doctor.languages?.join(', ') || '',
    consultationFee: doctor.consultationFee?.amount || 0,
    currency: doctor.consultationFee?.currency || 'LKR'
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        name: formData.name,
        specialty: formData.specialty,
        phone: formData.phone,
        experience: Number(formData.experience),
        bio: formData.bio,
        languages: formData.languages.split(',').map(lang => lang.trim()).filter(lang => lang),
        consultationFee: {
          amount: Number(formData.consultationFee),
          currency: formData.currency
        }
      };

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:5001/api/doctors/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      
      if (data.success && data.data?.doctor) {
        onUpdate(data.data.doctor);
        setIsEditing(false);
        toast({
          title: "Success",
          description: "Profile updated successfully!",
        });
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: doctor.name || '',
      specialty: doctor.specialty || '',
      phone: doctor.phone || '',
      experience: doctor.experience || 0,
      bio: doctor.bio || '',
      languages: doctor.languages?.join(', ') || '',
      consultationFee: doctor.consultationFee?.amount || 0,
      currency: doctor.consultationFee?.currency || 'LKR'
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Doctor Profile
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                {isEditing ? (
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{doctor.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                {isEditing ? (
                  <Input
                    id="specialty"
                    value={formData.specialty}
                    onChange={(e) => handleInputChange('specialty', e.target.value)}
                    placeholder="Enter your specialty"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{doctor.specialty}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <p className="p-2 bg-gray-50 rounded text-gray-600">{doctor.email} (Read-only)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{doctor.phone || 'Not provided'}</p>
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Registration Number</Label>
                <p className="p-2 bg-gray-50 rounded text-gray-600">{doctor.regNumber} (Read-only)</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Experience (Years)</Label>
                {isEditing ? (
                  <Input
                    id="experience"
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleInputChange('experience', parseInt(e.target.value) || 0)}
                    placeholder="Years of experience"
                    min="0"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">{doctor.experience} years</p>
                )}
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Bio
              </Label>
              {isEditing ? (
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Tell patients about yourself..."
                  rows={4}
                />
              ) : (
                <p className="p-3 bg-gray-50 rounded min-h-[100px]">
                  {doctor.bio || 'No bio provided'}
                </p>
              )}
            </div>

            {/* Languages */}
            <div className="space-y-2">
              <Label htmlFor="languages" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Languages
              </Label>
              {isEditing ? (
                <Input
                  id="languages"
                  value={formData.languages}
                  onChange={(e) => handleInputChange('languages', e.target.value)}
                  placeholder="e.g., English, Sinhala, Tamil"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">
                  {doctor.languages?.join(', ') || 'Not specified'}
                </p>
              )}
            </div>

            {/* Consultation Fee */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="consultationFee" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Consultation Fee
                </Label>
                {isEditing ? (
                  <Input
                    id="consultationFee"
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => handleInputChange('consultationFee', parseInt(e.target.value) || 0)}
                    placeholder="Enter fee amount"
                    min="0"
                  />
                ) : (
                  <p className="p-2 bg-gray-50 rounded">
                    {doctor.consultationFee ? 
                      `${doctor.consultationFee.currency} ${doctor.consultationFee.amount}` : 
                      'Not set'
                    }
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                {isEditing ? (
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="LKR">LKR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                ) : (
                  <p className="p-2 bg-gray-50 rounded">
                    {doctor.consultationFee?.currency || 'LKR'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Information */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Account Status</Label>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  doctor.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {doctor.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div>
              <Label>Verification Status</Label>
              <div className="mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  doctor.verificationStatus?.isVerified 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {doctor.verificationStatus?.isVerified ? 'Verified' : 'Pending Verification'}
                </span>
                {doctor.verificationStatus?.verificationDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Verified on: {new Date(doctor.verificationStatus.verificationDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorProfile; 