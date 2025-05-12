
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Lock, CreditCard, Shield, Info, User, ShieldCheck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DoctorLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [regNumber, setRegNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [currentTab, setCurrentTab] = useState('login');

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^\+94\s\d{2}\s\d{3}\s\d{4}$/;
    if (!emailRegex.test(value) && !phoneRegex.test(value) && value !== '') {
      setEmailError('Please enter a valid email or Sri Lankan phone number (+94 XX XXX XXXX)');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrPhone || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateEmail(emailOrPhone)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Mock authentication - replace with actual auth when implemented
      setTimeout(() => {
        toast.success('Successfully logged in!');
        navigate('/doctor-portal');
      }, 1500);
    } catch (error) {
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailOrPhone || !password || !regNumber) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!validateEmail(emailOrPhone)) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Mock signup - replace with actual auth when implemented
      setTimeout(() => {
        toast.success('Account created successfully! Verification email sent.');
        setCurrentTab('login');
      }, 1500);
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/lovable-uploads/dcfedfbc-2e9f-48f3-a0ae-3dc9746486c2.png')",
        }}
      />
      
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#1A1F2C]/70" />
      
      <div className="container-custom py-6 flex justify-between items-center relative z-10">
        <Link to="/medical" className="text-2xl font-bold text-white inline-flex">
          <span className="text-[#4CAF50]">Eventuraa</span>
          <span className="text-white">.MD</span>
        </Link>
      </div>
      
      <div className="flex-1 flex items-center justify-center px-4 py-10 relative z-10">
        <Card className="w-full max-w-md shadow-xl border-gray-100 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-2">
              <div className="bg-[#4CAF50]/10 p-3 rounded-full">
                <User className="h-6 w-6 text-[#4CAF50]" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800 font-display">Doctor Portal</CardTitle>
            <CardDescription className="text-gray-600">
              Access your doctor dashboard, patient communications, and more
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs 
              defaultValue="login" 
              value={currentTab}
              onValueChange={setCurrentTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emailOrPhone">Email or Phone</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        id="emailOrPhone" 
                        type="text" 
                        placeholder="e.g., doctor@email.com" 
                        className={`pl-10 ${emailError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                        value={emailOrPhone}
                        onChange={(e) => {
                          setEmailOrPhone(e.target.value);
                          if (e.target.value === '' || validateEmail(e.target.value)) {
                            setEmailError('');
                          }
                        }}
                        onBlur={() => validateEmail(emailOrPhone)}
                        autoFocus
                        required
                      />
                      {emailError && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500">
                          <Info className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                    {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link to="/forgot-password" className="text-sm text-[#4CAF50] hover:text-green-700 hover:underline">
                        Forgot Password?
                      </Link>
                    </div>
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
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox 
                      id="remember-me" 
                      checked={rememberMe} 
                      onCheckedChange={(checked) => setRememberMe(!!checked)}
                    />
                    <label 
                      htmlFor="remember-me"
                      className="text-sm text-gray-600 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Keep me logged in for 30 days
                    </label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#4CAF50] hover:bg-[#3d8b40] text-white font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Signing in...
                      </div>
                    ) : "Login to Doctor Portal"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
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
                    <p className="text-xs text-gray-500">
                      Your SLMC number will be verified during registration
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        id="signup-email" 
                        type="email" 
                        placeholder="e.g., doctor@email.com" 
                        className="pl-10"
                        value={emailOrPhone}
                        onChange={(e) => setEmailOrPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Create Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input 
                        id="signup-password" 
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
                    <p className="text-xs text-gray-500">
                      Must be at least 8 characters with a number and special character
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="terms" required />
                    <label 
                      htmlFor="terms"
                      className="text-sm text-gray-600"
                    >
                      I agree to the <a href="#" className="text-[#4CAF50] hover:underline">Terms of Service</a> and <a href="#" className="text-[#4CAF50] hover:underline">Privacy Policy</a>
                    </label>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-[#4CAF50] hover:bg-[#3d8b40] text-white font-medium" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating Account...
                      </div>
                    ) : "Create Doctor Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4 text-center">
            <div className="flex flex-col md:flex-row justify-center gap-3 md:gap-6 text-xs text-gray-500 pt-4">
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="h-3 w-3" />
                <span>Secure Login</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <ShieldCheck className="h-3 w-3" />
                <span>SLMC Verified Only</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <Lock className="h-3 w-3" />
                <span>Medical Data Encrypted</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DoctorLoginPage;
