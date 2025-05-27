const { default: fetch } = require('node-fetch');

async function testAppointmentBooking() {
  try {
    // Use specific doctor ID that we know exists
    const doctorId = '68304349bcce29c59ff744a0'; // This is the doctor ID from server logs
    console.log(`Using doctor ID: ${doctorId}`);
    
    // Book an appointment with a future date
    console.log('\n1. Booking appointment...');
    const appointmentData = {
      patientName: 'Test Patient - Medical Booking',
      patientContact: {
        email: 'testpatient@example.com',
        phone: '+94771234567'
      },
      appointmentDate: '2025-05-25', // Tomorrow's date
      appointmentTime: '15:30', // Changed time to avoid conflict
      type: 'video',
      reason: 'Follow-up consultation for previous treatment',
      locationId: null, // No location needed for video call
      userId: null
    };
    
    const bookingResponse = await fetch(`http://localhost:5001/api/doctors/${doctorId}/appointments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData),
    });
    
    const bookingResult = await bookingResponse.json();
    
    if (bookingResult.success) {
      console.log('✅ Appointment booked successfully!');
      console.log('Appointment ID:', bookingResult.data.appointment._id);
      console.log('Patient:', bookingResult.data.appointment.patientName);
      console.log('Date:', bookingResult.data.appointment.appointmentDate);
      console.log('Time:', bookingResult.data.appointment.appointmentTime);
      console.log('Type:', bookingResult.data.appointment.type);
      console.log('Status:', bookingResult.data.appointment.status);
      
      // Try to fetch all appointments for this doctor to verify it's saved
      console.log('\n2. Verifying appointment was saved...');
      
      // Get the doctor token from login
      const loginResponse = await fetch('http://localhost:5001/api/auth/login/doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'doc3@gmail.com',
          password: 'password123'
        }),
      });
      
      const loginResult = await loginResponse.json();
      
      if (loginResult.success) {
        const token = loginResult.data.token;
        
        // Fetch appointments
        const appointmentsResponse = await fetch('http://localhost:5001/api/doctors/appointments?limit=50', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        const appointmentsResult = await appointmentsResponse.json();
        
        if (appointmentsResult.success) {
          console.log(`✅ Found ${appointmentsResult.data.appointments.length} appointments for doctor`);
          appointmentsResult.data.appointments.forEach((apt, index) => {
            console.log(`${index + 1}. ${apt.patientName} - ${apt.appointmentDate} at ${apt.appointmentTime} (${apt.status})`);
          });
        } else {
          console.log('❌ Failed to fetch appointments:', appointmentsResult.message);
        }
      } else {
        console.log('❌ Failed to login doctor for verification');
      }
      
    } else {
      console.error('❌ Appointment booking failed:', bookingResult.message);
    }
    
  } catch (error) {
    console.error('Error testing appointment booking:', error.message);
  }
}

// Run the test
testAppointmentBooking(); 