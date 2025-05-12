require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const API_URL = 'http://localhost:5000'; // Change if your server runs on a different port

// Test credentials
const credentials = {
  email: 'admin@eventuraa.lk',
  password: 'admin123'
};

async function verifyPendingRoute() {
  try {
    console.log('Verifying pending events route...');
    
    // Step 1: Login to get token
    console.log('\nStep 1: Logging in as admin...');
    let response = await axios.post(`${API_URL}/api/auth/login/admin`, credentials);
    
    if (!response.data.success) {
      throw new Error('Login failed: ' + response.data.message);
    }
    
    const token = response.data.data.token;
    console.log('Login successful, got token');
    
    // Step 2: Try to access the pending events endpoint
    console.log('\nStep 2: Accessing pending events endpoint...');
    try {
      response = await axios.get(`${API_URL}/api/admin/events/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(response.data, null, 2));
      
      if (response.data.success) {
        console.log('\nPending events route is working correctly!');
        console.log(`Found ${response.data.data.events.length} pending events`);
      } else {
        console.log('\nEndpoint returned success: false');
        console.log('Error message:', response.data.message);
      }
    } catch (error) {
      console.error('\nError accessing pending events endpoint:');
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
        console.error('Response data:', error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received. Is the server running?');
      } else {
        // Something happened in setting up the request
        console.error('Error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Verification error:', error);
  }
}

verifyPendingRoute(); 