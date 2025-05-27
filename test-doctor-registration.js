const fetch = require('node-fetch');

const testDoctorRegistration = async () => {
  try {
    console.log('Testing doctor registration...');
    
    const userData = {
      name: "Dr. Nimal Test",
      email: "nimal.test@gmail.com",
      password: "Nimal123$",
      userType: "doctor",
      regNumber: "TEST-12345",
      specialty: "general"
    };
    
    console.log('Sending registration data:', userData);
    
    const response = await fetch('http://localhost:5001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });
    
    const result = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', result);
    
    if (response.ok) {
      console.log('✅ Doctor registration successful!');
    } else {
      console.log('❌ Doctor registration failed:', result.message);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
};

testDoctorRegistration(); 