import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CalendarIcon, ArrowLeft, AlertCircle, 
  Loader2, User, Phone, Mail, Clock, MapPin, Stethoscope
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from '@/components/ui/textarea';
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import useAuth from '@/hooks/useAuth';

// Define interfaces for data
interface DoctorLocation {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  distance?: number;
}

interface Doctor {
  _id: string;
  name: string;
  specialty: string;
  email: string;
  regNumber: string;
  experience: number;
  consultationFee?: { amount: number; currency: string; };
  languages?: string[];
  bio?: string;
  isActive: boolean;
  locations: DoctorLocation[];
}

// Define form schema
const appointmentFormSchema = z.object({
  patientName: z.string().min(2, "Patient name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(6, "Phone number is required"),
  appointmentDate: z.string().min(1, "Appointment date is required"),
  appointmentTime: z.string().min(1, "Appointment time is required"),
  type: z.enum(['in-person', 'video', 'phone']),
  reason: z.string().min(5, "Please provide a reason for the appointment"),
  locationId: z.string().optional(),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

const MedicalBookingPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, userData } = useAuth();
  
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available time slots for appointments
  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Set up the form with react-hook-form and zod
  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientName: userData?.name || '',
      email: userData?.email || '',
      phone: '',
      appointmentDate: '',
      appointmentTime: '',
      type: 'in-person',
      reason: '',
      locationId: '',
    },
  });

  const watchType = form.watch('type');

  useEffect(() => {
    const fetchDoctorDetails = async () => {
      if (!doctorId) return;
      
      setLoading(true);
      try {
        // Fetch doctor details
        const response = await fetch(`http://localhost:5001/api/doctors/nearby?lat=6.9271&lng=79.8612&radius=1000`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const foundDoctor = data.data.doctors.find((d: Doctor) => d._id === doctorId);
            if (foundDoctor) {
              setDoctor(foundDoctor);
              // Set default location if available
              if (foundDoctor.locations && foundDoctor.locations.length > 0) {
                form.setValue('locationId', foundDoctor.locations[0]._id);
              }
            } else {
              toast({
                title: "Error",
                description: "Doctor not found",
                variant: "destructive",
              });
              navigate('/medical');
            }
          }
        } else {
          throw new Error('Failed to fetch doctor details');
        }
      } catch (error) {
        console.error('Error fetching doctor details:', error);
        toast({
          title: "Error",
          description: "Failed to load doctor details. Please try again.",
          variant: "destructive",
        });
        navigate('/medical');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorDetails();
  }, [doctorId, navigate, toast, form]);

  const handleAppointmentSubmit = async (values: AppointmentFormValues) => {
    if (!doctor) return;
    
    setIsSubmitting(true);
    try {
      const appointmentData = {
        patientName: values.patientName,
        patientContact: {
          email: values.email,
          phone: values.phone
        },
        appointmentDate: values.appointmentDate,
        appointmentTime: values.appointmentTime,
        type: values.type,
        reason: values.reason,
        locationId: values.type === 'in-person' ? values.locationId : null,
        userId: userData?._id || null
      };

      const response = await fetch(`http://localhost:5001/api/doctors/${doctorId}/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast({
          title: "Success!",
          description: "Your appointment has been booked successfully.",
        });
        
        // Navigate to a confirmation page or back to medical page
        navigate('/medical', { 
          state: { 
            message: 'Appointment booked successfully!',
            appointmentId: result.data.appointment._id 
          }
        });
      } else {
        throw new Error(result.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/medical');
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading doctor details...</span>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!doctor) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Doctor Not Found</h2>
            <p className="text-gray-600 mb-4">The doctor you're looking for could not be found.</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Medical Page
            </Button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Medical Page
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Book Appointment</h1>
            <p className="text-gray-600 mt-2">Schedule your appointment with Dr. {doctor.name}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Doctor Information */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Stethoscope className="mr-2 h-5 w-5" />
                    Doctor Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mx-auto mb-3">
                      <User size={32} className="text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-lg">{doctor.name}</h3>
                    <p className="text-blue-600">{doctor.specialty}</p>
                    <p className="text-sm text-gray-500">{doctor.experience} years experience</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <Mail className="mr-2 h-4 w-4 text-gray-500" />
                      <span>{doctor.email}</span>
                    </div>
                    
                    {doctor.consultationFee && (
                      <div className="flex items-center text-sm">
                        <span className="mr-2">💰</span>
                        <span>Fee: {doctor.consultationFee.currency} {doctor.consultationFee.amount}</span>
                      </div>
                    )}
                  </div>

                  {doctor.locations && doctor.locations.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Practice Locations:</h4>
                        <div className="space-y-2">
                          {doctor.locations.map((location) => (
                            <div key={location._id} className="text-sm">
                              <div className="flex items-start">
                                <MapPin className="mr-1 h-4 w-4 text-gray-500 mt-0.5" />
                                <div>
                                  <p className="font-medium">{location.name}</p>
                                  <p className="text-gray-600">{location.city}</p>
                                  {location.phone && (
                                    <p className="text-gray-600 flex items-center">
                                      <Phone className="mr-1 h-3 w-3" />
                                      {location.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Appointment Details</CardTitle>
                  <CardDescription>
                    Please fill in your details to book an appointment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAppointmentSubmit)} className="space-y-6">
                      {/* Patient Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Patient Information</h3>
                        
                        <FormField
                          control={form.control}
                          name="patientName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter patient's full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input type="email" placeholder="Enter email address" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter phone number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <Separator />

                      {/* Appointment Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Appointment Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="appointmentDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Appointment Date</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="appointmentTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Appointment Time</FormLabel>
                                <FormControl>
                                  <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...field}
                                  >
                                    <option value="">Select time</option>
                                    {getTimeSlots().map((time) => (
                                      <option key={time} value={time}>
                                        {time}
                                      </option>
                                    ))}
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Appointment Type</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  className="flex flex-col space-y-2"
                                >
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="in-person" id="in-person" />
                                    <Label htmlFor="in-person">In-Person Visit</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="video" id="video" />
                                    <Label htmlFor="video">Video Consultation</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="phone" id="phone" />
                                    <Label htmlFor="phone">Phone Consultation</Label>
                                  </div>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {watchType === 'in-person' && doctor.locations && doctor.locations.length > 0 && (
                          <FormField
                            control={form.control}
                            name="locationId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Location</FormLabel>
                                <FormControl>
                                  <select 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    {...field}
                                  >
                                    <option value="">Select location</option>
                                    {doctor.locations.map((location) => (
                                      <option key={location._id} value={location._id}>
                                        {location.name} - {location.city}
                                      </option>
                                    ))}
                                  </select>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="reason"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Reason for Visit</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Please describe your symptoms or reason for the appointment"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      {/* Submit Button */}
                      <div className="flex justify-end space-x-4">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleBack}
                          disabled={isSubmitting}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Booking...
                            </>
                          ) : (
                            <>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              Book Appointment
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MedicalBookingPage; 