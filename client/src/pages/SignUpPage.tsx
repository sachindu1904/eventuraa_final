import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, User, Mail, Lock, UserPlus, Stethoscope, ShieldCheck, Building, Phone, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import api, { checkApiConnection, checkDatabaseConnection, ApiResponse, AuthResponse } from '@/utils/api-fetch';
import ConnectionStatus from '@/components/ConnectionStatus';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTos, setAgreeTos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userType, setUserType] = useState('user');
  
  // Doctor-specific fields
  const [regNumber, setRegNumber] = useState('');
  const [specialty, setSpecialty] = useState('');
  
  // Organizer-specific fields
  const [companyName, setCompanyName] = useState('');
  const [businessType, setBusinessType] = useState('');

  // Track API and DB connectivity
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  // Check connections on component mount
  useEffect(() => {
    const checkConnections = async () => {
      const apiStatus = await checkApiConnection();
      setApiConnected(apiStatus);
      
      if (apiStatus) {
        const dbStatus = await checkDatabaseConnection();
        setDbConnected(dbStatus);
      }
    };

    checkConnections();
  }, []);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Common validation
    if (!email || !password) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // User type specific validation
    if (userType === 'doctor' && (!regNumber || !specialty)) {
      toast.error('Doctors must provide registration number and specialty');
      return;
    }
    
    if (userType === 'organizer' && !companyName) {
      toast.error('Organizers must provide company name');
      return;
    }
    
    if (!agreeTos) {
      toast.error('Please agree to the Terms of Service');
      return;
    }

    // Check API and DB connectivity
    if (apiConnected === false) {
      toast.error('Cannot connect to server. Please check your internet connection and try again.');
      return;
    }
    
    if (dbConnected === false) {
      toast.error('Database connection issue. Please try again later or contact support.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Base user data for all account types
      const userData: Record<string, any> = {
        name,
        email,
        phone: phone || undefined, // Only include if provided
        password,
        userType
      };
      
      // Add user type specific data
      if (userType === 'doctor') {
        // Add doctor-specific fields
        userData.regNumber = regNumber;
        userData.specialty = specialty;
      } else if (userType === 'organizer') {
        // Add organizer-specific fields
        userData.companyName = companyName;
        userData.businessType = businessType || undefined;
      }
      
      console.log('Sending registration data:', JSON.stringify(userData));
      
      // Make API call using our utility with the correct type
      const response = await api.post<AuthResponse>('/auth/register', userData);
      
      console.log('Registration response:', response);
      
      if (response.success) {
        toast.success('Account created successfully!');
        
        // Save token if provided
        if (response.data?.token) {
          localStorage.setItem('token', response.data.token);
        }
        
        // Redirect based on user type
        if (userType === 'doctor') {
          navigate('/doctor-portal');
        } else if (userType === 'organizer') {
          navigate('/organizer-portal');
        } else {
          navigate('/');
        }
      } else {
        toast.error(response.message || 'Registration failed. Please try again.');
      }
    } catch (error) {
      // Error handling is now managed by the API interceptor
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Show connection status messages if there are issues
  useEffect(() => {
    if (apiConnected === false) {
      toast.error('Cannot connect to server. Check your internet connection.');
    } else if (dbConnected === false && apiConnected === true) {
      toast.error('Database connection issue. Registration might not work properly.');
    }
  }, [apiConnected, dbConnected]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100 flex flex-col">
      <div className="container-custom py-6">
        <Link to="/" className="text-2xl font-bold text-gray-800 inline-flex">
          Eventuraa
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <Card className="w-full max-w-md shadow-xl border-gray-100">
          <CardHeader className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold text-gray-800">Create an Account</CardTitle>
            <CardDescription className="text-gray-600">
              {userType === 'user' && "Sign up to start booking events and experiences"}
              {userType === 'organizer' && "Sign up to start creating and managing events"}
              {userType === 'doctor' && "Sign up to join our medical professional network"}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Show connection status when there are issues */}
            {(apiConnected === false || dbConnected === false) && (
              <ConnectionStatus className="mb-4" />
            )}
            
            <form onSubmit={handleSignUp} className="space-y-4">
              {/* User Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="userType">I am a</Label>
                <Tabs 
                  defaultValue="user" 
                  className="w-full" 
                  value={userType} 
                  onValueChange={setUserType}
                >
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="user" className="flex items-center justify-center">
                      <User className="h-4 w-4 mr-2" />
                      User
                    </TabsTrigger>
                    <TabsTrigger value="organizer" className="flex items-center justify-center">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Organizer
                    </TabsTrigger>
                    <TabsTrigger value="doctor" className="flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 mr-2" />
                      Doctor
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {userType === 'user' ? 'Full Name' : 'Contact Person Name'}
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder={userType === 'user' ? "John Doe" : "Contact Person Name"} 
                    className="pl-10"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Organizer-specific fields */}
              {userType === 'organizer' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company/Organization Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        id="companyName" 
                        type="text" 
                        placeholder="Your company or organization name" 
                        className="pl-10"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        id="businessType" 
                        type="text" 
                        placeholder="e.g., Event Management, Venue, etc." 
                        className="pl-10"
                        value={businessType}
                        onChange={(e) => setBusinessType(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Doctor-specific fields */}
              {userType === 'doctor' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="regNumber">SLMC Registration Number</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        id="regNumber" 
                        type="text" 
                        placeholder="e.g., SLMC 45632" 
                        className="pl-10"
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value)}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Your SLMC number will be verified during registration
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="specialty">Medical Specialty</Label>
                    <div className="relative">
                      <Stethoscope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        id="specialty" 
                        type="text" 
                        placeholder="e.g., Cardiology, General Medicine, etc." 
                        className="pl-10"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}
              
              {/* Email field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="your.email@example.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              
              {/* Phone number - show for user and organizer */}
              {(userType === 'user' || userType === 'organizer') && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="+94 XX XXX XXXX" 
                      className="pl-10"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              )}
              
              {/* Password field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>
              
              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="terms" 
                  checked={agreeTos} 
                  onCheckedChange={(checked) => setAgreeTos(!!checked)}
                />
                <label 
                  htmlFor="terms"
                  className="text-sm text-gray-600 leading-tight"
                >
                  I agree to the <Link to="/terms" className="text-purple-600 hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
                </label>
              </div>
              
              <Button 
                type="submit" 
                className={`w-full text-white font-medium ${
                  userType === 'doctor' 
                    ? 'bg-[#4CAF50] hover:bg-[#3d8b40]' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : 
                  userType === 'doctor' 
                    ? "Create Doctor Account" 
                    : userType === 'organizer' 
                      ? "Create Organizer Account" 
                      : "Create Account"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 text-center">
            <div className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/signin" className="text-purple-600 hover:text-purple-800 hover:underline font-medium">
                Sign in
              </Link>
            </div>
            
            <div className="relative flex items-center w-full">
              <div className="flex-grow border-t border-gray-200"></div>
              <div className="px-3 text-xs text-gray-500 uppercase">Or sign up with</div>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>
            
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1">
                Google
              </Button>
              <Button variant="outline" className="flex-1">
                Facebook
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignUpPage;
