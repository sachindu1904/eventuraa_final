import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Trash, Upload, X } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import api from '@/utils/api-fetch';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventImages, setEventImages] = useState<File[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', price: '', quantity: '100' }
  ]);
  const form = useRef<HTMLFormElement>(null);
  
  const handleAddTicketType = () => {
    setTicketTypes([...ticketTypes, { name: '', price: '', quantity: '' }]);
  };
  
  const handleRemoveTicketType = (index: number) => {
    setTicketTypes(ticketTypes.filter((_, i) => i !== index));
  };
  
  const handleTicketChange = (index: number, field: string, value: string) => {
    const newTicketTypes = [...ticketTypes];
    newTicketTypes[index] = { ...newTicketTypes[index], [field]: value };
    setTicketTypes(newTicketTypes);
  };
  
  const handleImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      setEventImages(prev => [...prev, ...fileArray]);
      
      if (!eventImagePreview && fileArray[0]) {
        const reader = new FileReader();
        reader.onload = () => {
          setEventImagePreview(reader.result as string);
        };
        reader.readAsDataURL(fileArray[0]);
      }
      
      if (!coverImage && fileArray[0]) {
        setCoverImage(fileArray[0]);
      }
    }
  };
  
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      
      const reader = new FileReader();
      reader.onload = () => {
        setEventImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleRemoveImage = () => {
    setEventImages([]);
    setCoverImage(null);
    setEventImagePreview(null);
  };
  
  // Helper function to debug FormData contents
  const logFormDataEntries = (formData: FormData, label: string) => {
    console.group(`FormData Contents: ${label}`);
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File - ${value.name} (${value.size} bytes)`);
      } else if (Array.isArray(value)) {
        console.log(`${key}: Array - ${JSON.stringify(value)}`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }
    console.groupEnd();
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Get initial form data
      const formData = new FormData(form.current as HTMLFormElement);
      logFormDataEntries(formData, "Initial");
      
      if (!date) {
        toast.error('Please select an event date');
        setIsSubmitting(false);
        return;
      }
      
      // Fix category being sent as an array
      const categoryValue = formData.get('category');
      if (categoryValue && Array.isArray(categoryValue)) {
        console.warn('Category is an array:', categoryValue);
        formData.delete('category');
        formData.set('category', categoryValue[0]);
      }
      
      formData.set('date', date.toISOString());
      
      const locationName = formData.get('location')?.toString() || '';
      formData.delete('location');
      formData.set('location[name]', locationName);
      formData.set('location[address]', locationName);
      formData.set('location[city]', 'Default City');
      formData.set('location[district]', 'Default District');
      
      formData.set('eventType', 'regular');
      
      ticketTypes.forEach((ticket, index) => {
        formData.set(`ticketTypes[${index}][name]`, ticket.name);
        formData.set(`ticketTypes[${index}][price]`, ticket.price);
        formData.set(`ticketTypes[${index}][quantity]`, ticket.quantity);
        formData.set(`ticketTypes[${index}][available]`, ticket.quantity);
      });
      
      if (ticketTypes.length > 0) {
        formData.set('ticketPrice', ticketTypes[0].price);
        formData.set('ticketsAvailable', ticketTypes[0].quantity);
      } else {
        formData.set('ticketPrice', '0');
        formData.set('ticketsAvailable', '0');
      }
      
      formData.delete('images');
      eventImages.forEach((file, index) => {
        formData.append('images', file);
      });
      
      if (coverImage) {
        formData.set('coverImage', coverImage);
      }
      
      // Log final form data before submission
      logFormDataEntries(formData, "Final before submission");
      
      const response = await api.uploadFormData('/organizer/events', formData);
      
      if (response.success) {
        toast.success('Event created successfully! Awaiting admin approval.');
        navigate('/organizer-portal/events');
      } else {
        toast.error('Failed to create event: ' + response.message);
      }
    } catch (error: any) {
      console.error('Event creation error:', error);
      
      const errorMessage = error.responseData 
        ? `Error: ${error.responseData.message || error.message}${error.responseData.error ? ` (${error.responseData.error})` : ''}`
        : error.message || 'Unknown error';
      
      toast.error(`Failed to create event: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Create New Event</h1>
      <p className="text-gray-600 mb-8">Fill in the details to create a new event</p>
      
      <form onSubmit={handleSubmit} ref={form} className="space-y-8">
        {/* Basic Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Event Details</h2>
              
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" name="title" placeholder="Enter event title" required />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="time">Event Time</Label>
                  <Input id="time" name="time" type="time" required />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="Enter event location" required />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  defaultValue="cultural"
                  onValueChange={(value) => {
                    // Clear any existing category input
                    const existingInput = form.current?.querySelector('input[name="category"]');
                    if (existingInput) {
                      existingInput.remove();
                    }
                    
                    // Create a new hidden input with the selected value
                    const input = document.createElement('input');
                    input.type = 'hidden';
                    input.name = 'category';
                    input.value = value;
                    form.current?.appendChild(input);
                    
                    console.log(`Category selected: ${value}`);
                  }}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cultural">Cultural</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="culinary">Culinary</SelectItem>
                    <SelectItem value="adventure">Adventure</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Event Description</Label>
                <Textarea 
                  id="description" 
                  name="description"
                  placeholder="Describe your event..." 
                  className="min-h-[120px]"
                />
              </div>
            </div>
          </div>
          
          <div>
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Event Images</h2>
              <div className="border rounded-md p-4">
                {eventImagePreview ? (
                  <div className="relative">
                    <img 
                      src={eventImagePreview} 
                      alt="Event" 
                      className="w-full h-48 object-cover rounded-md"
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md"
                      onClick={handleRemoveImage}
                    >
                      <X size={16} />
                    </button>
                    <div className="mt-2">
                      <p className="text-sm font-medium">
                        {eventImages.length} image(s) selected
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed rounded-md flex flex-col items-center justify-center h-48 bg-gray-50">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 mb-1">Drag and drop event images or</p>
                    <Label 
                      htmlFor="images-upload" 
                      className="cursor-pointer text-[#7E69AB] hover:underline text-sm"
                    >
                      Browse
                    </Label>
                    <Input 
                      id="images-upload" 
                      name="images"
                      type="file" 
                      accept="image/*" 
                      multiple
                      className="hidden" 
                      onChange={handleImagesUpload}
                    />
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Add up to 10 images for your event. First image will be used as cover image.
                </p>
              </div>
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Cover Image</h3>
                {coverImage ? (
                  <p className="text-sm">
                    Using{" "}
                    <span className="font-medium">{coverImage.name}</span>
                    {" "}as cover image
                  </p>
                ) : (
                  <div className="border-2 border-dashed rounded-md flex flex-col items-center justify-center h-24 bg-gray-50">
                    <Label 
                      htmlFor="cover-image-upload" 
                      className="cursor-pointer text-[#7E69AB] hover:underline text-sm"
                    >
                      Select cover image
                    </Label>
                    <Input 
                      id="cover-image-upload" 
                      name="coverImage"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCoverImageUpload}
                    />
                  </div>
                )}
              </div>
              
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Publishing Options</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox id="publish" name="publish" />
                  <Label htmlFor="publish" className="text-sm">Publish immediately</Label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  If unchecked, event will be saved as draft
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Ticket Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Ticket Information</h2>
          
          <div className="space-y-4">
            {ticketTypes.map((ticket, index) => (
              <div key={index} className="border rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Ticket Type {index + 1}</h3>
                  {ticketTypes.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveTicketType(index)}
                    >
                      <Trash size={16} className="text-red-500" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`ticket-name-${index}`}>Ticket Name</Label>
                    <Input
                      id={`ticket-name-${index}`}
                      name={`ticket-name-${index}`}
                      placeholder="e.g., General Admission"
                      value={ticket.name}
                      onChange={(e) => handleTicketChange(index, 'name', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`ticket-price-${index}`}>Price (LKR)</Label>
                    <Input
                      id={`ticket-price-${index}`}
                      name={`ticket-price-${index}`}
                      type="number"
                      placeholder="0"
                      value={ticket.price}
                      onChange={(e) => handleTicketChange(index, 'price', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor={`ticket-quantity-${index}`}>Quantity Available</Label>
                    <Input
                      id={`ticket-quantity-${index}`}
                      name={`ticket-quantity-${index}`}
                      type="number"
                      placeholder="100"
                      value={ticket.quantity}
                      onChange={(e) => handleTicketChange(index, 'quantity', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTicketType}
            className="flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Another Ticket Type
          </Button>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/organizer-portal/events')}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            className="bg-[#7E69AB] hover:bg-[#6E59A5]"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Event'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;
