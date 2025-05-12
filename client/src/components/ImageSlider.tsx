import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageSliderProps {
  images: string[];
  className?: string;
  aspectRatio?: 'square' | '16:9' | '4:3' | '1:1';
  showThumbnails?: boolean;
}

const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  className,
  aspectRatio = '16:9',
  showThumbnails = true
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Calculate aspect ratio class
  const aspectRatioClass = 
    aspectRatio === 'square' || aspectRatio === '1:1' ? 'aspect-square' :
    aspectRatio === '16:9' ? 'aspect-video' :
    aspectRatio === '4:3' ? 'aspect-4/3' : 'aspect-video';

  // Handle navigation
  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentIndex(slideIndex);
  };

  // If no images, show a placeholder
  if (!images || !images.length) {
    return (
      <div 
        className={cn("bg-gray-200 rounded-md flex items-center justify-center relative overflow-hidden", 
          aspectRatioClass, className)}
      >
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  // If only one image, show it without navigation
  if (images.length === 1) {
    return (
      <div 
        className={cn("rounded-md relative overflow-hidden", aspectRatioClass, className)}
      >
        <img 
          src={images[0]} 
          alt="Event" 
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div 
        className={cn("rounded-md relative overflow-hidden group", aspectRatioClass, className)}
      >
        {/* Main image */}
        <img 
          src={images[currentIndex]} 
          alt={`Slide ${currentIndex + 1}`} 
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Navigation arrows */}
        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={goToPrevious}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={goToNext}
            className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition"
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Image counter */}
        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-md text-xs">
          {currentIndex + 1} / {images.length}
        </div>
      </div>
      
      {/* Thumbnails */}
      {showThumbnails && images.length > 1 && (
        <div className="flex overflow-x-auto gap-2 py-1 px-2 scrollbar-thin scrollbar-thumb-gray-300">
          {images.map((image, index) => (
            <div 
              key={index}
              className={cn(
                "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden cursor-pointer border-2",
                currentIndex === index ? "border-primary" : "border-transparent"
              )}
              onClick={() => goToSlide(index)}
            >
              <img 
                src={image} 
                alt={`Thumbnail ${index + 1}`} 
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageSlider; 