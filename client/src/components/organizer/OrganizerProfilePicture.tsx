import React, { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import api from '@/utils/api-fetch';

interface OrganizerProfilePictureProps {
  currentImage: string;
  onImageUpdated: (newImageUrl: string) => void;
}

const OrganizerProfilePicture: React.FC<OrganizerProfilePictureProps> = ({
  currentImage,
  onImageUpdated
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Upload the file
      uploadProfilePicture(file);
    }
  };

  const uploadProfilePicture = async (file: File) => {
    setIsUploading(true);
    
    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      // Upload to server - using the default POST method instead of overriding with PUT
      const response = await api.uploadFormData('/organizer/profile-picture', formData);
      
      if (response.success && response.data?.logo) {
        toast.success('Profile picture updated successfully');
        onImageUpdated(response.data.logo);
      } else {
        toast.error(response.message || 'Failed to update profile picture');
        // Reset preview on error
        setPreviewImage(null);
      }
    } catch (error: any) {
      console.error('Profile picture upload error:', error);
      toast.error(error.message || 'Failed to upload profile picture');
      // Reset preview on error
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-md">
          <img 
            src={previewImage || currentImage || '/default-profile.png'} 
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        )}
        
        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={triggerFileInput}
          disabled={isUploading}
          className="absolute bottom-0 right-0 rounded-full h-10 w-10 shadow-md"
        >
          <Camera size={18} />
        </Button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <p className="text-sm text-muted-foreground mt-2">
        Click the camera icon to update your profile picture
      </p>
    </div>
  );
};

export default OrganizerProfilePicture; 