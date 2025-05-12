import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye, Calendar, MapPin, Tag, Clock, Ticket } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ImageSlider from '@/components/ImageSlider';
import { format } from 'date-fns';

interface EventProps {
  event: {
    _id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: {
      name: string;
      address: string;
      city: string;
      district: string;
    };
    category: string;
    eventType: string;
    ticketPrice: number;
    ticketsAvailable: number;
    images: string[];
    coverImage: string;
    organizer: {
      _id: string;
      companyName: string;
    };
    approvalStatus: 'pending' | 'approved' | 'rejected';
  };
  onApprove: (eventId: string) => void;
  onReject: (eventId: string, reason: string) => void;
}

const EventPreview: React.FC<EventProps> = ({ event, onApprove, onReject }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');
  
  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(event._id, rejectionReason);
      setIsOpen(false);
    }
  };
  
  const handleApprove = () => {
    onApprove(event._id);
    setIsOpen(false);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPP');
  };
  
  // Prepare all images for the slider
  const allImages = [
    ...(event.coverImage ? [event.coverImage] : []),
    ...(event.images || [])
  ].filter((url, index, self) => 
    // Filter out duplicates
    url && self.indexOf(url) === index
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          <div className="md:col-span-2 space-y-6">
            {/* Image slider */}
            <div>
              <ImageSlider 
                images={allImages} 
                aspectRatio="16:9"
                className="rounded-md overflow-hidden"
                showThumbnails={true}
              />
            </div>
            
            {/* Event details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Event Details</h3>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-muted-foreground">
                    {formatDate(event.date)} at {event.time}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Location</p>
                  <p className="text-muted-foreground">
                    {event.location.name}
                    {event.location.address && `, ${event.location.address}`}
                    {event.location.city && `, ${event.location.city}`}
                    {event.location.district && `, ${event.location.district}`}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Category</p>
                  <Badge variant="secondary" className="mt-1">
                    {event.category}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Ticket className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Tickets</p>
                  <p className="text-muted-foreground">
                    LKR {event.ticketPrice.toFixed(2)} • {event.ticketsAvailable} available
                  </p>
                </div>
              </div>
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Description</h3>
              <div className="text-muted-foreground whitespace-pre-line">
                {event.description}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Organizer info */}
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="text-lg font-semibold">Organizer</h3>
              <p>{event.organizer.companyName}</p>
            </div>
            
            {/* Approval status */}
            <div className="border rounded-md p-4 space-y-3">
              <h3 className="text-lg font-semibold">Status</h3>
              <Badge
                className="capitalize"
                variant={
                  event.approvalStatus === 'approved' ? 'success' :
                  event.approvalStatus === 'rejected' ? 'destructive' : 'outline'
                }
              >
                {event.approvalStatus}
              </Badge>
            </div>
            
            {/* Approval actions */}
            {event.approvalStatus === 'pending' && (
              <div className="border rounded-md p-4 space-y-3">
                <h3 className="text-lg font-semibold">Actions</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setIsOpen(false)}
                  >
                    Close
                  </Button>
                  <Button 
                    variant="default" 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                  >
                    Approve
                  </Button>
                </div>
                
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="font-medium">Reject with reason</h4>
                  <textarea
                    className="w-full border rounded-md p-2 text-sm"
                    rows={3}
                    placeholder="Provide reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    Reject Event
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventPreview; 