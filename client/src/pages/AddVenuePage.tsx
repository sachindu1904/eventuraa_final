import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';
import { ArrowLeft, Building, MapPin, Info, Image } from 'lucide-react';
import api from '@/utils/api-fetch';

const AddVenuePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    description: '',
    address: {
      street: '',
      city: '',
      district: '',
      postalCode: ''
    },
    facilities: '',
    amenities: '',
    capacity: {
      min: '',
      max: ''
    },
    priceRange: {
      min: '',
      max: ''
    },
    imageUrl: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData] as any,
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Format the form data to be sent to the API
      const venueData = {
        name: formData.name,
        type: formData.type,
        location: formData.location,
        description: formData.description,
        address: formData.address,
        facilities: formData.facilities ? formData.facilities.split(',').map(item => item.trim()) : [],
        amenities: formData.amenities ? formData.amenities.split(',').map(item => item.trim()) : [],
        capacity: {
          min: formData.capacity.min ? parseInt(formData.capacity.min) : undefined,
          max: formData.capacity.max ? parseInt(formData.capacity.max) : undefined
        },
        priceRange: {
          min: formData.priceRange.min ? parseInt(formData.priceRange.min) : undefined,
          max: formData.priceRange.max ? parseInt(formData.priceRange.max) : undefined
        },
        imageUrl: formData.imageUrl || undefined
      };
      
      // Send the data to the API
      const response = await api.post('/venues', venueData);
      
      if (response.success) {
        toast.success('Venue added successfully!');
        navigate('/venue-host-portal');
      } else {
        toast.error(response.message || 'Failed to add venue');
      }
    } catch (error) {
      console.error('Error adding venue:', error);
      toast.error('An error occurred while adding the venue');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="mb-2" 
            onClick={() => navigate('/venue-host-portal')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-gray-800">Add New Venue</h1>
          <p className="text-gray-600">Create a new venue listing for your restaurant or hotel</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
                <CardDescription>
                  Provide the basic details about your venue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Venue Name <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Royal Hotel & Restaurant"
                      className="pl-10"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Venue Type <span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => handleSelectChange(value, 'type')}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select venue type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="restaurant">Restaurant</SelectItem>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="banquet_hall">Banquet Hall</SelectItem>
                      <SelectItem value="conference_center">Conference Center</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Colombo, Kandy, Galle"
                      className="pl-10"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <div className="relative">
                    <Info className="absolute left-3 top-3 text-gray-500 h-4 w-4" />
                    <Textarea
                      id="description"
                      name="description"
                      placeholder="Describe your venue, special features, history, etc."
                      className="pl-10 min-h-[100px]"
                      value={formData.description}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL</Label>
                  <div className="relative">
                    <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                      id="imageUrl"
                      name="imageUrl"
                      placeholder="e.g., https://example.com/image.jpg"
                      className="pl-10"
                      value={formData.imageUrl}
                      onChange={handleInputChange}
                    />
                  </div>
                  <p className="text-xs text-gray-500">Provide a URL to an image of your venue</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
                <CardDescription>
                  Enter the full address details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address.street">Street Address</Label>
                    <Input
                      id="address.street"
                      name="address.street"
                      placeholder="e.g., 123 Main Street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address.city">City</Label>
                    <Input
                      id="address.city"
                      name="address.city"
                      placeholder="e.g., Colombo"
                      value={formData.address.city}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address.district">District</Label>
                    <Input
                      id="address.district"
                      name="address.district"
                      placeholder="e.g., Western Province"
                      value={formData.address.district}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address.postalCode">Postal Code</Label>
                    <Input
                      id="address.postalCode"
                      name="address.postalCode"
                      placeholder="e.g., 10300"
                      value={formData.address.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Features & Capacity</CardTitle>
                <CardDescription>
                  Provide details about the features and capacity of your venue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="facilities">Facilities</Label>
                  <Input
                    id="facilities"
                    name="facilities"
                    placeholder="e.g., Wi-Fi, Parking, Swimming Pool, Air Conditioning"
                    value={formData.facilities}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">Separate multiple facilities with commas</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amenities">Amenities</Label>
                  <Input
                    id="amenities"
                    name="amenities"
                    placeholder="e.g., Restaurant, Spa, Gym, Room Service"
                    value={formData.amenities}
                    onChange={handleInputChange}
                  />
                  <p className="text-xs text-gray-500">Separate multiple amenities with commas</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="block mb-2">Capacity</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="capacity.min" className="text-xs">Minimum</Label>
                        <Input
                          id="capacity.min"
                          name="capacity.min"
                          type="number"
                          placeholder="e.g., 10"
                          value={formData.capacity.min}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="capacity.max" className="text-xs">Maximum</Label>
                        <Input
                          id="capacity.max"
                          name="capacity.max"
                          type="number"
                          placeholder="e.g., 100"
                          value={formData.capacity.max}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="block mb-2">Price Range (LKR)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                        <Label htmlFor="priceRange.min" className="text-xs">Minimum</Label>
                        <Input
                          id="priceRange.min"
                          name="priceRange.min"
                          type="number"
                          placeholder="e.g., 5000"
                          value={formData.priceRange.min}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="priceRange.max" className="text-xs">Maximum</Label>
                        <Input
                          id="priceRange.max"
                          name="priceRange.max"
                          type="number"
                          placeholder="e.g., 25000"
                          value={formData.priceRange.max}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex justify-end mt-6 space-x-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => navigate('/venue-host-portal')}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              className="bg-[#FF9800] hover:bg-[#F57C00] text-white"
            >
              {isLoading ? 'Adding Venue...' : 'Add Venue'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddVenuePage; 