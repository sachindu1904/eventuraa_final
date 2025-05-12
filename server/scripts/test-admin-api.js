require('dotenv').config({ path: '../.env' });
const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:5000/api';
let token = '';

async function loginAsAdmin() {
  try {
    console.log('Logging in as admin...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@eventuraa.lk',
      password: 'admin123',
      userType: 'admin'
    });
    
    if (response.data.success && response.data.data.token) {
      token = response.data.data.token;
      console.log('Successfully logged in as admin');
      return true;
    } else {
      console.error('Login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testAdminProfile() {
  try {
    console.log('\nTesting admin profile endpoint...');
    const response = await axios.get(`${API_URL}/admin/profile`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Profile response success:', response.data.success);
    console.log('Admin data:', response.data.data?.admin);
    return true;
  } catch (error) {
    console.error('Profile error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testAdminUsers() {
  try {
    console.log('\nTesting admin users endpoint...');
    const response = await axios.get(`${API_URL}/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Users response success:', response.data.success);
    console.log('Number of users:', response.data.data?.users?.length || 0);
    if (response.data.data?.users?.length > 0) {
      console.log('First user:', response.data.data.users[0]);
    }
    return true;
  } catch (error) {
    console.error('Users error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testAdminOrganizers() {
  try {
    console.log('\nTesting admin organizers endpoint...');
    const response = await axios.get(`${API_URL}/admin/organizers`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Organizers response success:', response.data.success);
    console.log('Number of organizers:', response.data.data?.organizers?.length || 0);
    if (response.data.data?.organizers?.length > 0) {
      console.log('First organizer:', response.data.data.organizers[0]);
    }
    return true;
  } catch (error) {
    console.error('Organizers error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testAdminDoctors() {
  try {
    console.log('\nTesting admin doctors endpoint...');
    const response = await axios.get(`${API_URL}/admin/doctors`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Doctors response success:', response.data.success);
    console.log('Number of doctors:', response.data.data?.doctors?.length || 0);
    if (response.data.data?.doctors?.length > 0) {
      console.log('First doctor:', response.data.data.doctors[0]);
    }
    return true;
  } catch (error) {
    console.error('Doctors error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function runTests() {
  console.log('Starting admin API tests...');
  
  const loggedIn = await loginAsAdmin();
  if (!loggedIn) {
    console.error('Login failed. Cannot proceed with tests.');
    return;
  }
  
  await testAdminProfile();
  await testAdminUsers();
  await testAdminOrganizers();
  await testAdminDoctors();
  
  console.log('\nAll tests completed.');
}

runTests();