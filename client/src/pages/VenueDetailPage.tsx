import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MapPin,
  Calendar,
  Users,
  DollarSign,
  ArrowLeft,
  Building,
  Wifi,
  Coffee,
  Image,
  ChevronLeft,
  ChevronRight,
  Edit,
  Plus,
  Trash,
  Check,
  X,
  Upload,
  Star,
  Bed,
  Calendar as CalendarIcon
} from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import api, { ApiResponse, VenueResponseData } from '@/utils/api-fetch';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { addDays } from "date-fns";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface VenueImage {
  _id: string;
  url: string;
  public_id: string;
  caption?: string;
  isMain: boolean;
}

interface RoomType {
  _id: string;
  name: string;
  description: string;
  capacity: number;
  pricePerNight: {
    currency: string;
    amount: number;
  };
  amenities: string[];
  images: VenueImage[];
  availableRooms: number;
  totalRooms: number;
}

interface Venue {
  _id: string;
  name: string;
  type: string;
  location: string;
  description?: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
    country?: string;
  };
  facilities?: string[];
  amenities?: string[];
  capacity?: {
    min?: number;
    max?: number;
  };
  priceRange?: {
    currency?: string;
    min?: number;
    max?: number;
  };
  images?: VenueImage[];
  imageUrl?: string; // Legacy support
  venueHost?: string;
  approvalStatus?: string;
  isActive?: boolean;
}

interface EditVenueFormData {
  name: string;
  type: string;
  location: string;
  description: string;
  address: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    country: string;
  };
  facilities: string;
  amenities: string;
  capacity: {
    min: string;
    max: string;
  };
  priceRange: {
    min: string;
    max: string;
    currency: string;
  };
}

interface VenueResponse {
  venue: Venue;
  roomTypes: RoomType[];
}

interface ApiVenueResponse extends ApiResponse {
  data: VenueResponse;
}

const VenueDetailPage: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isVenueHost, setIsVenueHost] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingImages, setIsAddingImages] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Edit form state
  const [editFormData, setEditFormData] = useState<EditVenueFormData>({
    name: '',
    type: '',
    location: '',
    description: '',
    address: {
      street: '',
      city: '',
      district: '',
      postalCode: '',
      country: 'Sri Lanka',
    },
    facilities: '',
    amenities: '',
    capacity: {
      min: '',
      max: '',
    },
    priceRange: {
      min: '',
      max: '',
      currency: 'LKR',
    },
  });

  useEffect(() => {
    // Direct way to read URL parameters without waiting for API call
    const setupFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search);
      const editMode = searchParams.get('edit') === 'true';
      console.log('Initial URL check - edit parameter:', searchParams.get('edit'));
      
      // If edit=true is in URL, set editing mode directly
      if (editMode) {
        console.log('Setting edit mode directly from URL');
        setIsEditing(true);
      }
    };
    
    // Call immediately on component mount
    setupFromUrl();
    
    const fetchVenueDetails = async () => {
      try {
        setIsLoading(true);
        
        // Check if edit mode should be activated from URL parameter
        const searchParams = new URLSearchParams(window.location.search);
        const editMode = searchParams.get('edit') === 'true';
        console.log('URL edit parameter (in fetch):', searchParams.get('edit'));
        console.log('Edit mode from URL (in fetch):', editMode);
        
        const response = await api.get<ApiResponse<VenueResponseData>>(`/venues/${venueId}`);
        
        if (response.success && response.data) {
          const data = response.data;
          if (data.venue) {
            setVenue(data.venue);
          }
          
          // Set room types if available
          if (data.roomTypes && Array.isArray(data.roomTypes)) {
            setRoomTypes(data.roomTypes);
            console.log('Room types loaded:', data.roomTypes.length);
          }
          
          // Check if current user is the venue host
          const userType = localStorage.getItem('userType') || sessionStorage.getItem('userType');
          const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
          const venueHostId = data.venue?.venueHost?.toString();
          console.log('User checks:', { userType, userId, venueHostId });
          console.log('Is venue host check:', userType === 'venue-host' && userId === venueHostId);
          
          if (userType === 'venue-host' && userId === venueHostId) {
            setIsVenueHost(true);
          } else {
            // If edit mode was requested but user is not venue host, show a message
            if (editMode && isEditing) {
              console.log('Edit mode requested but user is not venue host');
              toast.error('You must be the venue host to edit this venue');
              // Revert edit mode if user is not authorized
              setIsEditing(false);
            }
          }
          
          // Initialize edit form data from venue
          if (data.venue) {
            initializeEditForm(data.venue);
          }
        } else {
          toast.error('Failed to load venue details');
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching venue details:', error);
        toast.error('Error loading venue details');
      } finally {
        setIsLoading(false);
      }
    };

    if (venueId) {
      fetchVenueDetails();
    }
  }, [venueId, navigate, isEditing]);

  // Initialize edit form with venue data
  const initializeEditForm = (venueData: any) => {
    setEditFormData({
      name: venueData.name || '',
      type: venueData.type || '',
      location: venueData.location || '',
      description: venueData.description || '',
      address: {
        street: venueData.address?.street || '',
        city: venueData.address?.city || '',
        district: venueData.address?.district || '',
        postalCode: venueData.address?.postalCode || '',
        country: venueData.address?.country || 'Sri Lanka',
      },
      facilities: venueData.facilities?.join(', ') || '',
      amenities: venueData.amenities?.join(', ') || '',
      capacity: {
        min: venueData.capacity?.min?.toString() || '',
        max: venueData.capacity?.max?.toString() || '',
      },
      priceRange: {
        min: venueData.priceRange?.min?.toString() || '',
        max: venueData.priceRange?.max?.toString() || '',
        currency: venueData.priceRange?.currency || 'LKR',
      },
    });
  };

  // Get all available images from the venue
  const getVenueImages = () => {
    if (venue?.images && venue.images.length > 0) {
      return venue.images;
    } else if (venue?.imageUrl) {
      // Legacy support for single imageUrl
      return [{ url: venue.imageUrl, isMain: true, _id: 'legacy' }];
    }
    return [];
  };

  const venueImages = getVenueImages();
  const hasMultipleImages = venueImages.length > 1;

  // Handle edit form changes
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEditFormData({
        ...editFormData,
        [parent]: {
          ...editFormData[parent as keyof typeof editFormData] as any,
          [child]: value
        }
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value
      });
    }
  };

  const handleSelectChange = (value: string, name: string) => {
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  // Handle form submission for editing venue details
  const handleUpdateVenue = async () => {
    try {
      setIsLoading(true);
      
      // Format the form data to be sent to the API
      const venueData = {
        name: editFormData.name,
        type: editFormData.type,
        location: editFormData.location,
        description: editFormData.description,
        address: editFormData.address,
        facilities: editFormData.facilities ? editFormData.facilities.split(',').map(item => item.trim()) : [],
        amenities: editFormData.amenities ? editFormData.amenities.split(',').map(item => item.trim()) : [],
        capacity: {
          min: editFormData.capacity.min ? parseInt(editFormData.capacity.min) : undefined,
          max: editFormData.capacity.max ? parseInt(editFormData.capacity.max) : undefined
        },
        priceRange: {
          min: editFormData.priceRange.min ? parseInt(editFormData.priceRange.min) : undefined,
          max: editFormData.priceRange.max ? parseInt(editFormData.priceRange.max) : undefined,
          currency: editFormData.priceRange.currency
        }
      };
      
      // Send the update to the API
      const response = await api.put<ApiResponse<VenueResponseData>>(`/venues/${venueId}`, venueData);
      
      if (response.success && response.data && response.data.venue) {
        toast.success('Venue updated successfully');
        // Update the local venue state
        setVenue(response.data.venue);
        // Exit edit mode
        setIsEditing(false);
      } else {
        toast.error(response.message || 'Failed to update venue');
      }
    } catch (error) {
      console.error('Error updating venue:', error);
      toast.error('An error occurred while updating the venue');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      
      // Check if adding new files would exceed the limit
      if (selectedImages.length + files.length > 10) {
        toast.error('You can upload a maximum of 10 images at once');
        return;
      }
      
      // File size validation - 5MB limit per file (5 * 1024 * 1024 bytes)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
      
      if (oversizedFiles.length > 0) {
        // Calculate the size of the largest file in MB for better user feedback
        const largestFile = oversizedFiles.reduce((prev, current) => 
          prev.size > current.size ? prev : current);
        const largestSizeMB = (largestFile.size / (1024 * 1024)).toFixed(2);
        
        toast.error(
          oversizedFiles.length === 1
            ? `1 image exceeds the 5MB size limit (${largestSizeMB}MB)`
            : `${oversizedFiles.length} images exceed the 5MB size limit (largest: ${largestSizeMB}MB)`
        );
        
        // Show advice for compressing images
        toast.info(
          "Try resizing your images or use a free online tool like TinyPNG or Squoosh to compress them.",
          { duration: 6000 }
        );
        
        // Filter out files that are too large
        const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);
        
        if (validFiles.length === 0) {
          return; // No valid files to upload
        }
        
        // Proceed with only the valid files
        setSelectedImages(prevImages => [...prevImages, ...validFiles]);
        
        // Create preview URLs for the selected images
        const newPreviewImages = validFiles.map(file => URL.createObjectURL(file));
        setPreviewImages(prevPreviews => [...prevPreviews, ...newPreviewImages]);
        
        toast.info(`Added ${validFiles.length} valid images. Please keep files under 5MB.`);
      } else {
        // All files are valid
        setSelectedImages(prevImages => [...prevImages, ...files]);
        
        // Create preview URLs for the selected images
        const newPreviewImages = files.map(file => URL.createObjectURL(file));
        setPreviewImages(prevPreviews => [...prevPreviews, ...newPreviewImages]);
      }
    }
  };

  // Remove selected image before upload
  const removeSelectedImage = (index: number) => {
    // Remove the image from the arrays
    setSelectedImages(prevImages => prevImages.filter((_, i) => i !== index));
    
    // Revoke the object URL to prevent memory leaks
    URL.revokeObjectURL(previewImages[index]);
    setPreviewImages(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  // Upload images
  const handleUploadImages = async () => {
    if (selectedImages.length === 0) {
      toast.error('Please select at least one image to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Create FormData
      const formData = new FormData();
      selectedImages.forEach(image => {
        formData.append('images', image);
      });
      
      // Upload the images
      const response = await api.post<ApiResponse<VenueResponseData>>(`/venues/${venueId}/images`, formData);
      
      if (response.success && response.data && response.data.venue) {
        // Clear selected images
        setSelectedImages([]);
        // Revoke all preview URLs
        previewImages.forEach(url => URL.revokeObjectURL(url));
        setPreviewImages([]);
        
        // Update venue with new images
        setVenue(response.data.venue);
        toast.success('Images uploaded successfully');
        
        // Close the upload dialog
        setIsAddingImages(false);
      } else {
        toast.error(response.message || 'Failed to upload images');
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('An error occurred while uploading images');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete a venue image
  const handleDeleteImage = async (imageId: string) => {
    try {
      setIsLoading(true);
      const response = await api.delete<ApiResponse<VenueResponseData>>(`/venues/${venueId}/images/${imageId}`);
      
      if (response.success && response.data && response.data.venue) {
        // Update venue with the new image list
        setVenue(response.data.venue);
        toast.success('Image deleted successfully');
      } else {
        toast.error(response.message || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('An error occurred while deleting the image');
    } finally {
      setIsLoading(false);
    }
  };

  // Set an image as the main image
  const setMainImage = async (imageId: string) => {
    try {
      setIsLoading(true);
      
      // Find the image and update only the isMain property
      const updatedImages = venue.images.map((img: VenueImage) => ({
        ...img,
        isMain: img._id === imageId
      }));
      
      // Update the venue with the new image array
      const response = await api.put<ApiResponse<VenueResponseData>>(`/venues/${venueId}`, {
        images: updatedImages
      });
      
      if (response.success && response.data && response.data.venue) {
        setVenue(response.data.venue);
        toast.success('Main image updated');
      } else {
        toast.error(response.message || 'Failed to update main image');
      }
    } catch (error) {
      console.error('Error setting main image:', error);
      toast.error('An error occurred while updating the main image');
    } finally {
      setIsLoading(false);
    }
  };

  // Replace the handleOpenBookingDialog function with a navigation function
  const handleNavigateToBooking = (roomType: RoomType) => {
    // Use the correct URL pattern that matches the routing in App.tsx
    navigate(`/booking/${venueId}/${roomType._id}`);
    console.log(`Navigating to booking page for venue ${venueId} and room ${roomType._id}`);
  };

  // Keep the calculateTotalPrice function as it may be useful elsewhere
  const calculateTotalPrice = (pricePerNight: number, checkIn: Date, checkOut: Date) => {
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const nights = Math.round(Math.abs((checkOut.getTime() - checkIn.getTime()) / oneDay));
    return pricePerNight * (nights || 1); // Ensure at least 1 night
  };

  // Modify the renderRoomTypeSection function to use navigation instead of the booking dialog
  const renderRoomTypeSection = () => {
    // Only render for hotels and resorts
    if (!venue || (venue.type !== 'hotel' && venue.type !== 'resort') || roomTypes.length === 0) {
      return null;
    }
    
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Available Room Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roomTypes.map((roomType) => (
            <Card key={roomType._id} className="overflow-hidden flex flex-col h-full">
              <div className="relative h-48">
                {roomType.images && roomType.images.length > 0 ? (
                  <img 
                    src={roomType.images[0].url} 
                    alt={roomType.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <Bed className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-white font-bold text-lg">{roomType.name}</h3>
                </div>
              </div>
              
              <CardContent className="flex-grow flex flex-col p-4">
                {roomType.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{roomType.description}</p>
                )}
                
                <div className="space-y-3 mt-auto">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Capacity:</span>
                    <span className="font-medium">{roomType.capacity} {roomType.capacity > 1 ? 'persons' : 'person'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per night:</span>
                    <span className="font-medium">{roomType.pricePerNight.currency} {roomType.pricePerNight.amount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available rooms:</span>
                    <span className="font-medium">{roomType.availableRooms} of {roomType.totalRooms}</span>
                  </div>
                  
                  {roomType.amenities && roomType.amenities.length > 0 && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium mb-2">Room Amenities:</h4>
                      <div className="flex flex-wrap gap-1">
                        {roomType.amenities.slice(0, 5).map((amenity, idx) => (
                          <span key={idx} className="bg-gray-100 text-xs px-2 py-1 rounded-full">
                            {amenity}
                          </span>
                        ))}
                        {roomType.amenities.length > 5 && (
                          <span className="bg-gray-100 text-xs px-2 py-1 rounded-full">
                            +{roomType.amenities.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50 p-4">
                <Button 
                  className="w-full"
                  onClick={() => handleNavigateToBooking(roomType)}
                  disabled={roomType.availableRooms === 0}
                >
                  {roomType.availableRooms > 0 ? 'Book Now' : 'No Availability'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Venue Not Found</h1>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          {isVenueHost && !isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddingImages(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Images
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Venue
              </Button>
            </div>
          )}

          {isVenueHost && isEditing && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleUpdateVenue}>
                <Check className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Venue Image Carousel */}
          <div className="relative">
            {venueImages.length > 0 ? (
              <div className="relative">
                <Carousel className="w-full">
                  <CarouselContent>
                    {venueImages.map((image, index) => (
                      <CarouselItem key={image._id || index}>
                        <div className="h-80 md:h-96 relative overflow-hidden">
                          <img 
                            src={image.url} 
                            alt={`${venue.name} - ${index + 1}`}
                            className="w-full h-full object-cover transition-all"
                          />
                          {image.caption && (
                            <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-60 text-white p-2 rounded">
                              <p>{image.caption}</p>
                            </div>
                          )}
                          
                          {/* Image management controls for venue host */}
                          {isVenueHost && !isEditing && (
                            <div className="absolute top-2 right-2 flex gap-1">
                              {/* Set as main image */}
                              {!image.isMain && image._id !== 'legacy' && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="bg-white rounded-full h-8 w-8 p-0"
                                  title="Set as main image"
                                  onClick={() => setMainImage(image._id)}
                                >
                                  <Star className="h-4 w-4" />
                                </Button>
                              )}
                              
                              {/* Delete image button */}
                              {image._id !== 'legacy' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      className="bg-white rounded-full h-8 w-8 p-0"
                                    >
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Image</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete this image? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-red-600 hover:bg-red-700"
                                        onClick={() => handleDeleteImage(image._id)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          )}
                          
                          {/* Main image indicator */}
                          {image.isMain && (
                            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                              Main Image
                            </div>
                          )}
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {hasMultipleImages && (
                    <>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </>
                  )}
                </Carousel>
                
                {/* Image counter */}
                {hasMultipleImages && (
                  <div className="absolute bottom-4 right-4 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs z-10">
                    {venueImages.length} Photos
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-200">
                <Image className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Venue Details */}
          <div className="p-6">
            {isVenueHost && !isEditing && (
              <div className="mb-6 flex justify-end">
                <Button 
                  onClick={() => setIsEditing(true)} 
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Venue Details
                </Button>
              </div>
            )}
            
            {isEditing ? (
              <div className="space-y-6 pb-20">
                <h2 className="text-2xl font-bold">Edit Venue</h2>
                
                {/* Image Management Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Venue Images</CardTitle>
                    <CardDescription>Add, remove, or set a main image for your venue</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {venueImages.map((image, index) => (
                          <div key={image._id || index} className="relative group aspect-square">
                            <img
                              src={image.url}
                              alt={`Venue image ${index + 1}`}
                              className={`w-full h-full object-cover rounded-md ${image.isMain ? 'ring-2 ring-green-500' : ''}`}
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 rounded-md">
                              {!image.isMain && image._id !== 'legacy' && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="bg-white text-green-600 hover:bg-green-50 w-28"
                                  onClick={() => setMainImage(image._id)}
                                >
                                  <Star className="h-3 w-3 mr-2" />
                                  Set as Main
                                </Button>
                              )}
                              
                              {image.isMain && (
                                <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs w-28 text-center">
                                  Main Image
                                </div>
                              )}
                              
                              {image._id !== 'legacy' && (
                                <Button 
                                  size="sm"
                                  variant="outline"
                                  className="bg-white text-red-600 hover:bg-red-50 w-28"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this image?')) {
                                      handleDeleteImage(image._id);
                                    }
                                  }}
                                >
                                  <Trash className="h-3 w-3 mr-2" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {/* Add new images button */}
                        <div 
                          className="aspect-square border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                          onClick={() => setIsAddingImages(true)}
                        >
                          <Plus className="h-8 w-8 text-gray-400" />
                          <span className="text-sm text-gray-500 mt-2">Add Images</span>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded-md text-blue-700 text-sm">
                        <p><strong>Tip:</strong> Hover over an image to see management options. The image with a green border is your main image.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Venue Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={editFormData.name}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Venue Type</Label>
                      <Select
                        value={editFormData.type}
                        onValueChange={(value) => handleSelectChange(value, 'type')}
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
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={editFormData.location}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={editFormData.description}
                        onChange={handleEditInputChange}
                        className="min-h-[100px]"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {/* Address */}
                <Card>
                  <CardHeader>
                    <CardTitle>Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="address.street">Street Address</Label>
                        <Input
                          id="address.street"
                          name="address.street"
                          value={editFormData.address.street}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address.city">City</Label>
                        <Input
                          id="address.city"
                          name="address.city"
                          value={editFormData.address.city}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address.district">District</Label>
                        <Input
                          id="address.district"
                          name="address.district"
                          value={editFormData.address.district}
                          onChange={handleEditInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="address.postalCode">Postal Code</Label>
                        <Input
                          id="address.postalCode"
                          name="address.postalCode"
                          value={editFormData.address.postalCode}
                          onChange={handleEditInputChange}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Features */}
                <Card>
                  <CardHeader>
                    <CardTitle>Features & Capacity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="facilities">Facilities</Label>
                      <Input
                        id="facilities"
                        name="facilities"
                        placeholder="e.g., Wi-Fi, Parking, Swimming Pool (comma separated)"
                        value={editFormData.facilities}
                        onChange={handleEditInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="amenities">Amenities</Label>
                      <Input
                        id="amenities"
                        name="amenities"
                        placeholder="e.g., Restaurant, Spa, Room Service (comma separated)"
                        value={editFormData.amenities}
                        onChange={handleEditInputChange}
                      />
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
                              value={editFormData.capacity.min}
                              onChange={handleEditInputChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="capacity.max" className="text-xs">Maximum</Label>
                            <Input
                              id="capacity.max"
                              name="capacity.max"
                              type="number"
                              value={editFormData.capacity.max}
                              onChange={handleEditInputChange}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="block mb-2">Price Range</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-2">
                            <Label htmlFor="priceRange.min" className="text-xs">Minimum (LKR)</Label>
                            <Input
                              id="priceRange.min"
                              name="priceRange.min"
                              type="number"
                              value={editFormData.priceRange.min}
                              onChange={handleEditInputChange}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="priceRange.max" className="text-xs">Maximum (LKR)</Label>
                            <Input
                              id="priceRange.max"
                              name="priceRange.max"
                              type="number"
                              value={editFormData.priceRange.max}
                              onChange={handleEditInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Fixed Save Button */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-10 flex justify-end">
                  <div className="max-w-5xl w-full mx-auto flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={isLoading}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleUpdateVenue}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-800">{venue.name}</h1>
                    <div className="flex items-center mt-2 text-gray-600">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="capitalize mr-3">{venue.type.replace('_', ' ')}</span>
                      <span className="mx-2">•</span>
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{venue.location}</span>
                    </div>
                  </div>
                  <div className="mt-4 md:mt-0">
                    {venue.priceRange?.min && venue.priceRange?.max ? (
                      <div className="bg-gray-100 px-4 py-2 rounded-md">
                        <div className="text-sm font-medium text-gray-500">Price Range</div>
                        <div className="text-lg font-bold text-gray-800">
                          {venue.priceRange.currency || 'LKR'} {venue.priceRange.min} - {venue.priceRange.max}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Description */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>About This Venue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">
                      {venue.description || 'No description provided.'}
                    </p>
                  </CardContent>
                </Card>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Location */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="h-5 w-5 mr-2" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {venue.address ? (
                        <div className="space-y-1">
                          {venue.address.street && <p>{venue.address.street}</p>}
                          {venue.address.city && (
                            <p>
                              {venue.address.city}
                              {venue.address.district && `, ${venue.address.district}`}
                              {venue.address.postalCode && ` ${venue.address.postalCode}`}
                            </p>
                          )}
                          <p>{venue.address.country || 'Sri Lanka'}</p>
                        </div>
                      ) : (
                        <p>{venue.location}</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Capacity */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="h-5 w-5 mr-2" />
                        Capacity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {venue.capacity?.min && venue.capacity?.max ? (
                        <p>
                          {venue.capacity.min} - {venue.capacity.max} people
                        </p>
                      ) : (
                        <p>Capacity information not provided</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Amenities & Facilities */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Facilities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Wifi className="h-5 w-5 mr-2" />
                        Facilities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {venue.facilities && venue.facilities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {venue.facilities.map((facility: string, index: number) => (
                            <span 
                              key={index} 
                              className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                            >
                              {facility}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>No facilities information provided</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Amenities */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Coffee className="h-5 w-5 mr-2" />
                        Amenities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {venue.amenities && venue.amenities.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {venue.amenities.map((amenity: string, index: number) => (
                            <span 
                              key={index} 
                              className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                            >
                              {amenity}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>No amenities information provided</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Contact & Booking */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Book This Venue</CardTitle>
                    <CardDescription>
                      Interested in booking this venue? Use the contact information below.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row md:justify-between gap-4">
                      <div>
                        <p className="text-gray-600">
                          Please contact the venue directly to inquire about availability and booking.
                        </p>
                      </div>
                      <Button>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Check Availability
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Room Types Section */}
                {renderRoomTypeSection()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Upload Dialog */}
      <Dialog open={isAddingImages} onOpenChange={setIsAddingImages}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Images to Your Venue</DialogTitle>
            <DialogDescription>
              Upload high-quality images to showcase your venue. Images should be clear and appealing to attract more bookings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <label className="flex flex-col items-center justify-center h-32 cursor-pointer">
                <div className="flex flex-col items-center text-gray-500">
                  <Upload className="h-10 w-10 mb-2 text-gray-400" />
                  <span className="text-sm font-medium">Click to select images</span>
                  <span className="text-xs mt-1 text-gray-400">
                    JPG, PNG, or WEBP • Max 5MB per image
                  </span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                  multiple
                  onChange={handleImageChange}
                />
              </label>
              <div className="text-xs text-orange-500 mt-2 font-medium">
                <strong>Important:</strong> Each image must be under 5MB to upload successfully
              </div>
            </div>
            
            {previewImages.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Selected Images ({previewImages.length})</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedImages([]);
                      previewImages.forEach(url => URL.revokeObjectURL(url));
                      setPreviewImages([]);
                    }}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
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
                        onClick={() => removeSelectedImage(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex items-center justify-between mt-4">
            <div className="text-xs text-gray-500">
              {previewImages.length > 0 
                ? `${previewImages.length} ${previewImages.length === 1 ? 'image' : 'images'} selected` 
                : 'No images selected'}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAddingImages(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleUploadImages} 
                disabled={isUploading || selectedImages.length === 0}
                className={isUploading ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent border-white rounded-full"></div>
                    Uploading...
                  </>
                ) : (
                  <>Upload Images</>
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VenueDetailPage; 