import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VenueImage {
  url: string;
  public_id?: string;
  caption?: string;
  isMain?: boolean;
  _id?: string;
}

interface VenueImageGalleryProps {
  images: VenueImage[];
  maxHeight?: string;
}

const VenueImageGallery: React.FC<VenueImageGalleryProps> = ({ 
  images, 
  maxHeight = "400px" 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div 
        className="bg-gray-100 rounded-md flex items-center justify-center"
        style={{ height: maxHeight }}
      >
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === images.length - 1 ? 0 : prevIndex + 1));
  };

  return (
    <div className="relative rounded-md overflow-hidden" style={{ maxHeight }}>
      <div className="relative w-full h-full">
        <img
          src={images[currentIndex].url}
          alt={images[currentIndex].caption || `Venue image ${currentIndex + 1}`}
          className="w-full h-full object-cover"
          style={{ height: maxHeight }}
        />
        
        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Navigation buttons */}
      {images.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-none rounded-full h-8 w-8"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Button
            variant="outline"
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white border-none rounded-full h-8 w-8"
            onClick={handleNext}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}
      
      {/* Thumbnail navigation */}
      {images.length > 1 && (
        <div className="flex justify-center mt-2 gap-2 overflow-x-auto py-2">
          {images.map((image, index) => (
            <button
              key={image._id || index}
              onClick={() => setCurrentIndex(index)}
              className={`h-12 w-12 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                index === currentIndex ? 'ring-2 ring-primary' : 'opacity-70'
              }`}
            >
              <img
                src={image.url}
                alt={`Thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VenueImageGallery; 