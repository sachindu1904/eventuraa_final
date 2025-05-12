import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import EventPage from "./pages/EventPage";
import EventDetailPage from "./pages/EventDetailPage";
import NightlifePage from "./pages/NightlifePage";
import NightlifeDetail from "./pages/NightlifeDetail";
import HotelListPage from "./pages/HotelListPage";
import HotelDetailPage from "./pages/HotelDetailPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import MedicalPage from "./pages/MedicalPage";
import DoctorLoginPage from "./pages/DoctorLoginPage";
import DoctorPortal from "./pages/DoctorPortal";
import OrganizerLoginPage from "./pages/OrganizerLoginPage";
import OrganizerPortal from "./pages/OrganizerPortal";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import HiddenGemsPage from "./pages/HiddenGemsPage";
import HiddenGemsOwnerLoginPage from "./pages/HiddenGemsOwnerLoginPage";
import HiddenGemsOwnerPortal from "./pages/HiddenGemsOwnerPortal";
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
          <Route path="/nightlife" element={<NightlifePage />} />
          <Route path="/nightlife/:venueId" element={<NightlifeDetail />} />
          <Route path="/hotels" element={<HotelListPage />} />
          <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
          <Route path="/medical" element={<MedicalPage />} />
          <Route path="/doctor-login" element={<DoctorLoginPage />} />
          <Route path="/doctor-portal" element={<DoctorPortal />} />
          <Route path="/organizer-login" element={<OrganizerLoginPage />} />
          <Route path="/organizer-portal/*" element={<OrganizerPortal />} />
          <Route path="/admin-login" element={<AdminLoginPage />} />
          <Route path="/admin-dashboard/*" element={<AdminDashboardPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/hidden-gems" element={<HiddenGemsPage />} />
          <Route path="/hidden-gems-owner-login" element={<HiddenGemsOwnerLoginPage />} />
          <Route path="/hidden-gems-owner-portal/*" element={<HiddenGemsOwnerPortal />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
