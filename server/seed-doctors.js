require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventuraa')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample data
const users = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: 'password123',
    role: 'doctor',
    phone: '+1-555-123-4567',
    profileImage: 'https://randomuser.me/api/portraits/women/68.jpg'
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@example.com',
    password: 'password123',
    role: 'doctor',
    phone: '+1-555-987-6543',
    profileImage: 'https://randomuser.me/api/portraits/men/22.jpg'
  },
  {
    name: 'John Smith',
    email: 'john.smith@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1-555-111-2222',
    profileImage: 'https://randomuser.me/api/portraits/men/32.jpg'
  },
  {
    name: 'Emma Wilson',
    email: 'emma.wilson@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1-555-333-4444',
    profileImage: 'https://randomuser.me/api/portraits/women/29.jpg'
  },
  {
    name: 'David Miller',
    email: 'david.miller@example.com',
    password: 'password123',
    role: 'user',
    phone: '+1-555-555-6666',
    profileImage: 'https://randomuser.me/api/portraits/men/42.jpg'
  }
];

const doctors = [
  {
    name: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    qualifications: [
      {
        degree: 'MD',
        institution: 'Johns Hopkins University',
        year: '2010'
      },
      {
        degree: 'Fellowship in Cardiology',
        institution: 'Mayo Clinic',
        year: '2015'
      }
    ],
    regNumber: 'MD-12345',
    experience: 12,
    hospital: 'City General Hospital',
    profileImage: 'https://randomuser.me/api/portraits/women/68.jpg',
    consultationFee: {
      amount: 150,
      currency: 'USD'
    },
    languages: ['English', 'Spanish'],
    practices: [
      {
        hospitalName: 'City General Hospital',
        address: '123 Main St',
        city: 'New York',
        country: 'USA'
      }
    ],
    availability: [
      {
        day: 'Monday',
        slots: [
          { startTime: '09:00', endTime: '12:00' },
          { startTime: '14:00', endTime: '17:00' }
        ]
      },
      {
        day: 'Wednesday',
        slots: [
          { startTime: '09:00', endTime: '12:00' },
          { startTime: '14:00', endTime: '17:00' }
        ]
      },
      {
        day: 'Friday',
        slots: [
          { startTime: '09:00', endTime: '12:00' }
        ]
      }
    ],
    verificationStatus: {
      isVerified: true,
      verificationDate: new Date('2023-01-15')
    },
    rating: {
      average: 4.8,
      count: 120
    }
  },
  {
    name: 'Dr. Michael Chen',
    specialty: 'Neurology',
    qualifications: [
      {
        degree: 'MD',
        institution: 'Stanford University',
        year: '2008'
      },
      {
        degree: 'Fellowship in Neurology',
        institution: 'UCSF Medical Center',
        year: '2013'
      }
    ],
    regNumber: 'MD-67890',
    experience: 15,
    hospital: 'Metropolitan Neurology Center',
    profileImage: 'https://randomuser.me/api/portraits/men/22.jpg',
    consultationFee: {
      amount: 180,
      currency: 'USD'
    },
    languages: ['English', 'Mandarin'],
    practices: [
      {
        hospitalName: 'Metropolitan Neurology Center',
        address: '456 Park Avenue',
        city: 'San Francisco',
        country: 'USA'
      }
    ],
    availability: [
      {
        day: 'Tuesday',
        slots: [
          { startTime: '10:00', endTime: '14:00' }
        ]
      },
      {
        day: 'Thursday',
        slots: [
          { startTime: '10:00', endTime: '14:00' }
        ]
      },
      {
        day: 'Saturday',
        slots: [
          { startTime: '09:00', endTime: '12:00' }
        ]
      }
    ],
    verificationStatus: {
      isVerified: true,
      verificationDate: new Date('2023-02-20')
    },
    rating: {
      average: 4.9,
      count: 95
    }
  }
];

// Function to generate sample appointments
const generateAppointments = (doctorId, patientIds) => {
  const appointments = [];
  const today = new Date();
  
  // Statuses for random selection
  const statuses = ['scheduled', 'completed', 'cancelled', 'no-show', 'urgent'];
  const types = ['video', 'in-person', 'phone'];
  const reasons = [
    'Annual checkup',
    'Follow-up appointment',
    'Consultation for headaches',
    'Chest pain and shortness of breath',
    'Medication review',
    'Dizzy spells and fatigue',
    'Back pain assessment',
    'High blood pressure monitoring',
    'Mental health consultation',
    'Post-surgery follow-up'
  ];
  
  // Create today's appointments (3-5)
  const todayCount = Math.floor(Math.random() * 3) + 3;
  for (let i = 0; i < todayCount; i++) {
    const patientId = patientIds[Math.floor(Math.random() * patientIds.length)];
    const patientUser = users.find(user => user.email === patientId);
    const hour = 9 + i;
    const status = i === 0 ? 'urgent' : statuses[Math.floor(Math.random() * statuses.length)];
    
    appointments.push({
      doctorId,
      userId: patientId,
      patientName: patientUser.name,
      appointmentDate: today,
      appointmentTime: `${hour}:00`,
      duration: 30,
      type: types[Math.floor(Math.random() * types.length)],
      status,
      reason: reasons[Math.floor(Math.random() * reasons.length)]
    });
  }
  
  // Create upcoming appointments (5-8)
  const upcomingCount = Math.floor(Math.random() * 4) + 5;
  for (let i = 0; i < upcomingCount; i++) {
    const patientId = patientIds[Math.floor(Math.random() * patientIds.length)];
    const patientUser = users.find(user => user.email === patientId);
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i + 1);
    const hour = 9 + Math.floor(Math.random() * 7);
    
    appointments.push({
      doctorId,
      userId: patientId,
      patientName: patientUser.name,
      appointmentDate: futureDate,
      appointmentTime: `${hour}:00`,
      duration: 30,
      type: types[Math.floor(Math.random() * types.length)],
      status: 'scheduled',
      reason: reasons[Math.floor(Math.random() * reasons.length)]
    });
  }
  
  // Create past appointments (3-5)
  const pastCount = Math.floor(Math.random() * 3) + 3;
  for (let i = 0; i < pastCount; i++) {
    const patientId = patientIds[Math.floor(Math.random() * patientIds.length)];
    const patientUser = users.find(user => user.email === patientId);
    const pastDate = new Date(today);
    pastDate.setDate(today.getDate() - (i + 1));
    const hour = 9 + Math.floor(Math.random() * 7);
    const status = ['completed', 'no-show'][Math.floor(Math.random() * 2)];
    
    appointments.push({
      doctorId,
      userId: patientId,
      patientName: patientUser.name,
      appointmentDate: pastDate,
      appointmentTime: `${hour}:00`,
      duration: 30,
      type: types[Math.floor(Math.random() * types.length)],
      status,
      reason: reasons[Math.floor(Math.random() * reasons.length)],
      notes: status === 'completed' ? 'Patient is improving, follow-up in 2 weeks.' : ''
    });
  }
  
  return appointments;
};

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Appointment.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create users
    const saltRounds = 10;
    const userPromises = users.map(async user => {
      const salt = await bcrypt.genSalt(saltRounds);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      return new User({
        ...user,
        password: hashedPassword
      }).save();
    });
    
    const createdUsers = await Promise.all(userPromises);
    console.log(`${createdUsers.length} users created`);
    
    // Create doctors
    const doctorUsers = createdUsers.filter(user => user.role === 'doctor');
    const patientUsers = createdUsers.filter(user => user.role === 'user');
    
    const doctorPromises = doctors.map((doctor, index) => {
      return new Doctor({
        ...doctor,
        userId: doctorUsers[index]._id
      }).save();
    });
    
    const createdDoctors = await Promise.all(doctorPromises);
    console.log(`${createdDoctors.length} doctors created`);
    
    // Create appointments
    const patientIds = patientUsers.map(user => user._id);
    
    let allAppointments = [];
    for (const doctor of createdDoctors) {
      const appointments = generateAppointments(doctor._id, patientIds);
      allAppointments = [...allAppointments, ...appointments];
    }
    
    await Appointment.insertMany(allAppointments);
    console.log(`${allAppointments.length} appointments created`);
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 