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
import { ArrowLeft, Building, MapPin, Info, Image, X, Upload, Plus, Trash2, Bed } from 'lucide-react';
import api from '@/utils/api-fetch';

const AddVenuePage: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
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
    }
  });

  // New state for room types
  const [roomTypes, setRoomTypes] = useState<Array<{
    name: string;
    description: string;
    capacity: string;
    pricePerNight: string;
    amenities: string;
    totalRooms: string;
    images: File[];
    imagePreviewUrls: string[];
  }>>([]);

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

  // Handler for room type inputs
  const handleRoomTypeChange = (index: number, field: string, value: string) => {
    const updatedRoomTypes = [...roomTypes];
    updatedRoomTypes[index] = {
      ...updatedRoomTypes[index],
      [field]: value
    };
    setRoomTypes(updatedRoomTypes);
  };

  // Add a new room type
  const addRoomType = () => {
    setRoomTypes([
      ...roomTypes,
      {
        name: '',
        description: '',
        capacity: '',
        pricePerNight: '',
        amenities: '',
        totalRooms: '',
        images: [],
        imagePreviewUrls: []
      }
    ]);
  };

  // Remove a room type
  const removeRoomType = (index: number) => {
    const updatedRoomTypes = [...roomTypes];
    
    // Clean up image previews to prevent memory leaks
    updatedRoomTypes[index].imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
    
    updatedRoomTypes.splice(index, 1);
    setRoomTypes(updatedRoomTypes);
  };

  // Handler for room type image upload
  const handleRoomTypeImageChange = (e: React.ChangeEvent<HTMLInputElement>, roomTypeIndex: number) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Check if adding new files would exceed the limit (5 per room type)
      if (roomTypes[roomTypeIndex].images.length + files.length > 5) {
        toast.error('You can upload a maximum of 5 images per room type');
        return;
      }
      
      const updatedRoomTypes = [...roomTypes];
      updatedRoomTypes[roomTypeIndex].images = [
        ...updatedRoomTypes[roomTypeIndex].images,
        ...files
      ];
      
      // Create preview URLs for the selected images
      const newPreviewUrls = files.map(file => URL.createObjectURL(file));
      updatedRoomTypes[roomTypeIndex].imagePreviewUrls = [
        ...updatedRoomTypes[roomTypeIndex].imagePreviewUrls,
        ...newPreviewUrls
      ];
      
      setRoomTypes(updatedRoomTypes);
    }
  };

  // Remove a room type image
  const removeRoomTypeImage = (roomTypeIndex: number, imageIndex: number) => {
    const updatedRoomTypes = [...roomTypes];
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(updatedRoomTypes[roomTypeIndex].imagePreviewUrls[imageIndex]);
    
    // Remove image and its preview
    updatedRoomTypes[roomTypeIndex].images.splice(imageIndex, 1);
    updatedRoomTypes[roomTypeIndex].imagePreviewUrls.splice(imageIndex, 1);
    
    setRoomTypes(updatedRoomTypes);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Check if adding new files would exceed the limit
      if (selectedImages.length + files.length > 10) {
        toast.error('You can upload a maximum of 10 images');
        return;
      }
      
      setSelectedImages(prevImages => [...prevImages, ...files]);
      
      // Create preview URLs for the selected images
      const newPreviewImages = files.map(file => URL.createObjectURL(file));
      setPreviewImages(prevPreviews => [...prevPreviews, ...newPreviewImages]);
    }
  };

  const removeImage = (index: number) => {
    // Remove the image from the arrays
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate room types if any are added
    if (roomTypes.length > 0) {
      const invalidRoomTypes = roomTypes.filter(rt => 
        !rt.name || !rt.capacity || !rt.totalRooms || !rt.pricePerNight
      );
      
      if (invalidRoomTypes.length > 0) {
        toast.error('Please fill in all required fields for room types');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Create a FormData object for the file upload
      const formDataObj = new FormData();
      
      // Append venue data as JSON
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
        approvalStatus: 'pending'
      };
      
      formDataObj.append('name', formData.name);
      formDataObj.append('type', formData.type);
      formDataObj.append('location', formData.location);
      formDataObj.append('description', formData.description || '');
      formDataObj.append('approvalStatus', 'pending');
      
      // Append address data
      Object.entries(formData.address).forEach(([key, value]) => {
        if (value) formDataObj.append(`address[${key}]`, value);
      });
      
      // Append other data
      if (formData.facilities) {
        formData.facilities.split(',').forEach((facility, index) => {
          formDataObj.append(`facilities[${index}]`, facility.trim());
        });
      }
      
      if (formData.amenities) {
        formData.amenities.split(',').forEach((amenity, index) => {
          formDataObj.append(`amenities[${index}]`, amenity.trim());
        });
      }
      
      // Capacity and price range
      if (formData.capacity.min) formDataObj.append('capacity[min]', formData.capacity.min);
      if (formData.capacity.max) formDataObj.append('capacity[max]', formData.capacity.max);
      if (formData.priceRange.min) formDataObj.append('priceRange[min]', formData.priceRange.min);
      if (formData.priceRange.max) formDataObj.append('priceRange[max]', formData.priceRange.max);
      
      // Append venue images
      selectedImages.forEach(image => {
        formDataObj.append('images', image);
      });
      
      // Append room types data
      if (roomTypes.length > 0) {
        console.log(`Adding ${roomTypes.length} room types to form data`);
        
        // Add room types to FormData with clear index structure
        roomTypes.forEach((roomType, rtIndex) => {
          // Basic room type data
          formDataObj.append(`roomTypes[${rtIndex}][name]`, roomType.name);
          formDataObj.append(`roomTypes[${rtIndex}][description]`, roomType.description || '');
          formDataObj.append(`roomTypes[${rtIndex}][capacity]`, roomType.capacity);
          formDataObj.append(`roomTypes[${rtIndex}][pricePerNight]`, roomType.pricePerNight);
          formDataObj.append(`roomTypes[${rtIndex}][totalRooms]`, roomType.totalRooms);
          
          // Add amenities
          if (roomType.amenities) {
            formDataObj.append(`roomTypes[${rtIndex}][amenities]`, roomType.amenities);
          }
          
          // Add room type images with explicit naming that matches server expectations
          if (roomType.images.length > 0) {
            roomType.images.forEach((image) => {
              // Using the exact field name pattern that the server expects
              formDataObj.append(`roomTypes[${rtIndex}][images]`, image);
            });
          }
        });
        
        // Also stringify and append the entire roomTypes array as a fallback
        // This provides an additional way for the server to parse the data
        const roomTypesJSON = JSON.stringify(roomTypes.map(rt => ({
          name: rt.name,
          description: rt.description,
          capacity: rt.capacity, 
          pricePerNight: rt.pricePerNight,
          totalRooms: rt.totalRooms,
          amenities: rt.amenities
        })));
        formDataObj.append('roomTypesJSON', roomTypesJSON);
      }
      
      // Log FormData entries for debugging
      console.log('FormData entries:');
      for (const pair of formDataObj.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      // Send the data to the API with multipart/form-data
      // Don't manually set Content-Type header, browser will set it automatically with boundary
      const response = await api.post('/venues', formDataObj);
      
      if (response.success) {
        // Cleanup preview URLs
        previewImages.forEach(url => URL.revokeObjectURL(url));
        roomTypes.forEach(rt => {
          rt.imagePreviewUrls.forEach(url => URL.revokeObjectURL(url));
        });
        
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
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Room Types</CardTitle>
                  <CardDescription>
                    Add different types of rooms available at your venue
                  </CardDescription>
                </div>
                <Button 
                  type="button" 
                  onClick={addRoomType}
                  className="bg-[#FF9800] hover:bg-[#F57C00] text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Room Type
                </Button>
              </CardHeader>
              <CardContent>
                {roomTypes.length === 0 ? (
                  <div className="text-center p-6 border border-dashed rounded-md">
                    <Bed className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-gray-500">No room types added yet</p>
                    <p className="text-gray-400 text-sm">Click the button above to add room types like Standard, Deluxe, Suite, etc.</p>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {roomTypes.map((roomType, index) => (
                      <div key={index} className="border rounded-md p-4 relative">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeRoomType(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <h3 className="font-medium text-lg mb-4">Room Type #{index + 1}</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Room Type Name <span className="text-red-500">*</span></Label>
                            <Input
                              placeholder="e.g., Deluxe, Standard, Suite"
                              value={roomType.name}
                              onChange={(e) => handleRoomTypeChange(index, 'name', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Capacity (Persons) <span className="text-red-500">*</span></Label>
                            <Input
                              type="number"
                              placeholder="e.g., 2"
                              value={roomType.capacity}
                              onChange={(e) => handleRoomTypeChange(index, 'capacity', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Price Per Night (LKR) <span className="text-red-500">*</span></Label>
                            <Input
                              type="number"
                              placeholder="e.g., 15000"
                              value={roomType.pricePerNight}
                              onChange={(e) => handleRoomTypeChange(index, 'pricePerNight', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label>Total Rooms <span className="text-red-500">*</span></Label>
                            <Input
                              type="number"
                              placeholder="e.g., 10"
                              value={roomType.totalRooms}
                              onChange={(e) => handleRoomTypeChange(index, 'totalRooms', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label>Room Amenities</Label>
                            <Input
                              placeholder="e.g., Air Conditioning, TV, Mini Fridge, Balcony"
                              value={roomType.amenities}
                              onChange={(e) => handleRoomTypeChange(index, 'amenities', e.target.value)}
                            />
                            <p className="text-xs text-gray-500">Separate multiple amenities with commas</p>
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label>Description</Label>
                            <Textarea
                              placeholder="Describe this room type..."
                              value={roomType.description}
                              onChange={(e) => handleRoomTypeChange(index, 'description', e.target.value)}
                              className="min-h-[80px]"
                            />
                          </div>
                          
                          <div className="space-y-2 md:col-span-2">
                            <Label>Room Images</Label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 w-full h-24 cursor-pointer hover:border-gray-400 transition-colors duration-200">
                                <div className="flex flex-col items-center text-gray-500">
                                  <Upload className="h-6 w-6 mb-1" />
                                  <span className="text-sm">Upload room images</span>
                                  <span className="text-xs">(Max 5 images)</span>
                                </div>
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  multiple
                                  onChange={(e) => handleRoomTypeImageChange(e, index)}
                                />
                              </label>
                            </div>
                            
                            {roomType.imagePreviewUrls.length > 0 && (
                              <div className="mt-3">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                  {roomType.imagePreviewUrls.map((preview, imgIndex) => (
                                    <div key={imgIndex} className="relative group">
                                      <img
                                        src={preview}
                                        alt={`Room ${index + 1} Preview ${imgIndex + 1}`}
                                        className="h-16 w-full object-cover rounded-md"
                                      />
                                      <button
                                        type="button"
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removeRoomTypeImage(index, imgIndex)}
                                      >
                                        <X className="h-2 w-2" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Venue Images</CardTitle>
                <CardDescription>
                  Upload up to 10 images of your venue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images</Label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md p-4 w-full h-32 cursor-pointer hover:border-gray-400 transition-colors duration-200">
                      <div className="flex flex-col items-center text-gray-500">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm">Click to upload images</span>
                        <span className="text-xs">(Max 10 images)</span>
                      </div>
                      <Input
                        id="images"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        multiple
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                  
                  {previewImages.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium mb-2">Selected Images:</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {previewImages.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="h-24 w-full object-cover rounded-md"
                            />
                            <button
                              type="button"
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 text-xs bg-green-500 text-white px-1 py-0.5 rounded">
                                Main
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">Upload high-quality images of your venue. The first image will be used as the main image.</p>
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