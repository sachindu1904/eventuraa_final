import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EventPage from "./pages/EventPage";
import EventDetailPage from "./pages/EventDetailPage";
import TicketCheckoutPage from "./pages/TicketCheckoutPage";
import TicketConfirmationPage from "./pages/TicketConfirmationPage";
import NightlifePage from "./pages/NightlifePage";
import NightlifeDetail from "./pages/NightlifeDetail";
import HotelListPage from "./pages/HotelListPage";
import HotelDetailPage from "./pages/HotelDetailPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import MedicalPage from "./pages/MedicalPage";
import MedicalBookingPage from "./pages/MedicalBookingPage";
import DoctorLoginPage from "./pages/DoctorLoginPage";
import DoctorPortal from "./pages/DoctorPortal";
import FindDoctors from "./pages/FindDoctors";
import OrganizerLoginPage from "./pages/OrganizerLoginPage";
import OrganizerPortal from "./pages/OrganizerPortal";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import HiddenGemsPage from "./pages/HiddenGemsPage";
import HiddenGemsOwnerLoginPage from "./pages/HiddenGemsOwnerLoginPage";
import HiddenGemsOwnerPortal from "./pages/HiddenGemsOwnerPortal";
import VenueHostPortal from "./pages/VenueHostPortal";
import AddVenuePage from "./pages/AddVenuePage";
import VenueDetailPage from "./pages/VenueDetailPage";
import VenueListPage from "./pages/VenueListPage";
import RestaurantListPage from "./pages/RestaurantListPage";
import BookingPage from "./pages/BookingPage";
import BookingConfirmationPage from "./pages/BookingConfirmationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/events" element={<EventPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/events/:eventId/checkout" element={<TicketCheckoutPage />} />
          <Route path="/bookings/:purchaseId" element={<TicketConfirmationPage />} />
          <Route path="/my-bookings" element={<TicketConfirmationPage />} />
          <Route path="/nightlife" element={<NightlifePage />} />
          <Route path="/nightlife/:venueId" element={<NightlifeDetail />} />
          <Route path="/hotels" element={<HotelListPage />} />
          <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
          <Route path="/restaurants" element={<RestaurantListPage />} />
          <Route path="/medical" element={<MedicalPage />} />
          <Route path="/medical/book/:doctorId" element={<MedicalBookingPage />} />
          <Route path="/doctor-login" element={<DoctorLoginPage />} />
          <Route path="/doctor-portal" element={<DoctorPortal />} />
          <Route path="/find-doctors" element={<FindDoctors />} />
          <Route path="/organizer-login" element={<OrganizerLoginPage />} />
          <Route path="/organizer-portal/*" element={<OrganizerPortal />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin-dashboard/*" element={<AdminDashboardPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/venue-host-portal" element={<VenueHostPortal />} />
          <Route path="/venue-host/add-venue" element={<AddVenuePage />} />
          <Route path="/venues" element={<VenueListPage />} />
          <Route path="/venues/:venueId" element={<VenueDetailPage />} />
          <Route path="/booking/:venueId/:roomTypeId" element={<BookingPage />} />
          <Route path="/book/:venueId/:roomTypeId" element={<BookingPage />} />
          <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmationPage />} />
          <Route path="/hidden-gems" element={<HiddenGemsPage />} />
          <Route path="/hidden-gems-owner-login" element={<HiddenGemsOwnerLoginPage />} />
          <Route path="/hidden-gems-owner-portal/*" element={<HiddenGemsOwnerPortal />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
