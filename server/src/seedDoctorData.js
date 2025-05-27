const mongoose = require('mongoose');
const Doctor = require('./models/Doctor');
const User = require('./models/User');
const Appointment = require('./models/Appointment');
const DoctorLocation = require('./models/DoctorLocation');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedDoctorData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB successfully');

    // Create sample users (patients)
    console.log('Creating sample users...');
    const users = await createSampleUsers();
    console.log(`Created ${users.length} users`);

    // Create sample doctors
    console.log('Creating sample doctors...');
    const doctors = await createSampleDoctors();
    console.log(`Created ${doctors.length} doctors`);

    // Create locations for doctors
    console.log('Creating doctor locations...');
    await createDoctorLocations(doctors);
    console.log('Created doctor locations');

    // Create sample appointments
    console.log('Creating sample appointments...');
    await createSampleAppointments(doctors, users);
    console.log('Created sample appointments');

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

const createSampleUsers = async () => {
  // Check if users already exist
  const existingUsers = await User.countDocuments();
  if (existingUsers > 0) {
    console.log(`Found ${existingUsers} existing users, skipping creation`);
    return User.find().limit(5);
  }

  const sampleUsers = [
    {
      name: 'John Smith',
      email: 'john@example.com',
      phone: '0771234567',
      dateOfBirth: new Date('1985-05-15'),
      gender: 'male',
      address: {
        street: '123 Main St',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
        country: 'Sri Lanka'
      },
      medicalProfile: {
        exists: true,
        allergies: ['Penicillin'],
        conditions: ['Hypertension'],
        bloodType: 'O+'
      }
    },
    {
      name: 'Mary Johnson',
      email: 'mary@example.com',
      phone: '0772345678',
      dateOfBirth: new Date('1990-10-20'),
      gender: 'female',
      address: {
        street: '456 Oak Ave',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
        country: 'Sri Lanka'
      },
      medicalProfile: {
        exists: true,
        allergies: ['Sulfa drugs'],
        conditions: ['Diabetes'],
        bloodType: 'A+'
      }
    },
    {
      name: 'Raj Patel',
      email: 'raj@example.com',
      phone: '0773456789',
      dateOfBirth: new Date('1978-03-12'),
      gender: 'male',
      address: {
        street: '789 Pine St',
        city: 'Galle',
        district: 'Galle',
        postalCode: '80000',
        country: 'Sri Lanka'
      },
      medicalProfile: {
        exists: true,
        allergies: [],
        conditions: ['Asthma'],
        bloodType: 'B-'
      }
    },
    {
      name: 'Sarah Lee',
      email: 'sarah@example.com',
      phone: '0774567890',
      dateOfBirth: new Date('1992-07-30'),
      gender: 'female',
      address: {
        street: '101 River Rd',
        city: 'Negombo',
        district: 'Gampaha',
        postalCode: '11500',
        country: 'Sri Lanka'
      },
      medicalProfile: {
        exists: true,
        allergies: ['Latex'],
        conditions: [],
        bloodType: 'AB+'
      }
    },
    {
      name: 'Mohammed Khan',
      email: 'mohammed@example.com',
      phone: '0775678901',
      dateOfBirth: new Date('1983-12-05'),
      gender: 'male',
      address: {
        street: '202 Beach Blvd',
        city: 'Batticaloa',
        district: 'Batticaloa',
        postalCode: '30000',
        country: 'Sri Lanka'
      },
      medicalProfile: {
        exists: true,
        allergies: ['Shellfish'],
        conditions: ['Hypertension', 'Cholesterol'],
        bloodType: 'O-'
      }
    }
  ];

  return User.insertMany(sampleUsers);
};

const createSampleDoctors = async () => {
  // Check if doctors already exist
  const existingDoctors = await Doctor.countDocuments();
  if (existingDoctors > 0) {
    console.log(`Found ${existingDoctors} existing doctors, skipping creation`);
    return Doctor.find().limit(5);
  }

  const sampleDoctors = [
    {
      name: 'Dr. Anusha Perera',
      email: 'anusha@doctor.com',
      phone: '0761234567',
      regNumber: 'SLMC-12345',
      specialty: 'Cardiology',
      qualifications: [
        { degree: 'MBBS', institution: 'University of Colombo', year: 2005 },
        { degree: 'MD', institution: 'National Hospital Sri Lanka', year: 2010 },
        { degree: 'FRCP', institution: 'Royal College of Physicians UK', year: 2015 }
      ],
      experience: 15,
      profileImage: '/lovable-uploads/c0345ab3-5c66-4001-8dca-4164369fc2cf.png',
      bio: 'Experienced cardiologist specializing in preventive cardiology and cardiac rehabilitation.',
      verificationStatus: {
        isVerified: true,
        verificationDate: new Date()
      },
      specializations: ['Preventive Cardiology', 'Heart Failure Management', 'Interventional Cardiology'],
      languages: ['English', 'Sinhala', 'Tamil'],
      consultationFee: {
        amount: 4000,
        currency: 'LKR'
      },
      isAvailableForOnlineConsultation: true,
      onlineConsultationHours: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Friday', startTime: '09:00', endTime: '12:00', isAvailable: true }
      ],
      isActive: true
    },
    {
      name: 'Dr. Naveen Silva',
      email: 'naveen@doctor.com',
      phone: '0762345678',
      regNumber: 'SLMC-23456',
      specialty: 'Dermatology',
      qualifications: [
        { degree: 'MBBS', institution: 'University of Peradeniya', year: 2008 },
        { degree: 'MD', institution: 'General Hospital Kandy', year: 2013 }
      ],
      experience: 12,
      profileImage: '/lovable-uploads/c0345ab3-5c66-4001-8dca-4164369fc2cf.png',
      bio: 'Specialized in treating skin conditions including eczema, psoriasis, and skin cancer.',
      verificationStatus: {
        isVerified: true,
        verificationDate: new Date()
      },
      specializations: ['Cosmetic Dermatology', 'Pediatric Dermatology', 'Skin Cancer'],
      languages: ['English', 'Sinhala'],
      consultationFee: {
        amount: 3500,
        currency: 'LKR'
      },
      isAvailableForOnlineConsultation: true,
      onlineConsultationHours: [
        { day: 'Tuesday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Thursday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Saturday', startTime: '10:00', endTime: '13:00', isAvailable: true }
      ],
      isActive: true
    },
    {
      name: 'Dr. Malini Fernando',
      email: 'malini@doctor.com',
      phone: '0763456789',
      regNumber: 'SLMC-34567',
      specialty: 'Pediatrics',
      qualifications: [
        { degree: 'MBBS', institution: 'University of Sri Jayewardenepura', year: 2009 },
        { degree: 'MD', institution: 'Lady Ridgeway Hospital', year: 2014 },
        { degree: 'DCH', institution: 'Royal College of Pediatrics UK', year: 2016 }
      ],
      experience: 11,
      profileImage: '/lovable-uploads/c0345ab3-5c66-4001-8dca-4164369fc2cf.png',
      bio: 'Dedicated to providing compassionate care for children from birth through adolescence.',
      verificationStatus: {
        isVerified: true,
        verificationDate: new Date()
      },
      specializations: ['Newborn Care', 'Childhood Development', 'Adolescent Medicine'],
      languages: ['English', 'Sinhala', 'Tamil'],
      consultationFee: {
        amount: 3000,
        currency: 'LKR'
      },
      isAvailableForOnlineConsultation: true,
      onlineConsultationHours: [
        { day: 'Monday', startTime: '08:30', endTime: '16:30', isAvailable: true },
        { day: 'Tuesday', startTime: '08:30', endTime: '16:30', isAvailable: true },
        { day: 'Thursday', startTime: '08:30', endTime: '16:30', isAvailable: true }
      ],
      isActive: true
    },
    {
      name: 'Dr. Ruwan Jayasinghe',
      email: 'ruwan@doctor.com',
      phone: '0764567890',
      regNumber: 'SLMC-45678',
      specialty: 'Orthopedics',
      qualifications: [
        { degree: 'MBBS', institution: 'University of Kelaniya', year: 2006 },
        { degree: 'MS', institution: 'National Hospital Sri Lanka', year: 2011 },
        { degree: 'FRCS', institution: 'Royal College of Surgeons Edinburgh', year: 2014 }
      ],
      experience: 14,
      profileImage: '/lovable-uploads/c0345ab3-5c66-4001-8dca-4164369fc2cf.png',
      bio: 'Specializes in joint replacement, sports injuries, and minimally invasive surgeries.',
      verificationStatus: {
        isVerified: true,
        verificationDate: new Date()
      },
      specializations: ['Joint Replacement', 'Sports Medicine', 'Trauma Care'],
      languages: ['English', 'Sinhala'],
      consultationFee: {
        amount: 4500,
        currency: 'LKR'
      },
      isAvailableForOnlineConsultation: false,
      isActive: true
    },
    {
      name: 'Dr. Samanthi Wijekoon',
      email: 'samanthi@doctor.com',
      phone: '0765678901',
      regNumber: 'SLMC-56789',
      specialty: 'Psychiatry',
      qualifications: [
        { degree: 'MBBS', institution: 'University of Colombo', year: 2007 },
        { degree: 'MD', institution: 'National Institute of Mental Health', year: 2012 },
        { degree: 'MRCPsych', institution: 'Royal College of Psychiatrists UK', year: 2015 }
      ],
      experience: 13,
      profileImage: '/lovable-uploads/c0345ab3-5c66-4001-8dca-4164369fc2cf.png',
      bio: 'Dedicated to mental health treatment with a holistic approach to patient care.',
      verificationStatus: {
        isVerified: true,
        verificationDate: new Date()
      },
      specializations: ['Adult Psychiatry', 'Mood Disorders', 'Cognitive Behavioral Therapy'],
      languages: ['English', 'Sinhala'],
      consultationFee: {
        amount: 4000,
        currency: 'LKR'
      },
      isAvailableForOnlineConsultation: true,
      onlineConsultationHours: [
        { day: 'Wednesday', startTime: '14:00', endTime: '20:00', isAvailable: true },
        { day: 'Friday', startTime: '14:00', endTime: '20:00', isAvailable: true },
        { day: 'Saturday', startTime: '09:00', endTime: '15:00', isAvailable: true }
      ],
      isActive: true
    }
  ];

  return Doctor.insertMany(sampleDoctors);
};

const createDoctorLocations = async (doctors) => {
  // Check if locations already exist
  const existingLocations = await DoctorLocation.countDocuments();
  if (existingLocations > 0) {
    console.log(`Found ${existingLocations} existing locations, skipping creation`);
    return;
  }

  if (!doctors || doctors.length === 0) {
    console.log('No doctors found to create locations for');
    return;
  }

  const locationData = [];

  // Doctor 1 - Cardiologist (if exists)
  if (doctors[0]) {
    locationData.push({
      doctor: doctors[0]._id,
      practiceName: 'Asiri Hospital',
      address: {
        street: '181 Kirula Road',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00500',
        country: 'Sri Lanka'
      },
      coordinates: {
        lat: 6.9037,
        lng: 79.8729
      },
      contactNumber: '0112862485',
      isMainPractice: true,
      workingHours: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Friday', startTime: '09:00', endTime: '12:00', isAvailable: true }
      ]
    });

    locationData.push({
      doctor: doctors[0]._id,
      practiceName: 'Nawaloka Hospital',
      address: {
        street: '23 Deshamanya H K Dharmadasa Mawatha',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00200',
        country: 'Sri Lanka'
      },
      coordinates: {
        lat: 6.9175,
        lng: 79.8528
      },
      contactNumber: '0112304444',
      isMainPractice: false,
      workingHours: [
        { day: 'Tuesday', startTime: '13:00', endTime: '18:00', isAvailable: true },
        { day: 'Thursday', startTime: '13:00', endTime: '18:00', isAvailable: true },
        { day: 'Saturday', startTime: '09:00', endTime: '13:00', isAvailable: true }
      ]
    });
  }

  // Doctor 2 - Dermatologist (if exists)
  if (doctors[1]) {
    locationData.push({
      doctor: doctors[1]._id,
      practiceName: 'Lanka Hospital',
      address: {
        street: '578 Elvitigala Mawatha',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00500',
        country: 'Sri Lanka'
      },
      coordinates: {
        lat: 6.9119,
        lng: 79.8689
      },
      contactNumber: '0115430000',
      isMainPractice: true,
      workingHours: [
        { day: 'Tuesday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Thursday', startTime: '10:00', endTime: '18:00', isAvailable: true },
        { day: 'Saturday', startTime: '10:00', endTime: '13:00', isAvailable: true }
      ]
    });
  }

  // Doctor 3 - Pediatrician (if exists)
  if (doctors[2]) {
    locationData.push({
      doctor: doctors[2]._id,
      practiceName: 'Durdans Hospital',
      address: {
        street: '3 Alfred Place',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00300',
        country: 'Sri Lanka'
      },
      coordinates: {
        lat: 6.9077,
        lng: 79.8641
      },
      contactNumber: '0112140000',
      isMainPractice: true,
      workingHours: [
        { day: 'Monday', startTime: '08:30', endTime: '16:30', isAvailable: true },
        { day: 'Tuesday', startTime: '08:30', endTime: '16:30', isAvailable: true },
        { day: 'Thursday', startTime: '08:30', endTime: '16:30', isAvailable: true }
      ]
    });
  }

  // Doctor 4 - Orthopedics (if exists)
  if (doctors[3]) {
    locationData.push({
      doctor: doctors[3]._id,
      practiceName: 'Hemas Hospital',
      address: {
        street: '389 Negombo Road',
        city: 'Wattala',
        district: 'Gampaha',
        postalCode: '11300',
        country: 'Sri Lanka'
      },
      coordinates: {
        lat: 6.9908,
        lng: 79.8828
      },
      contactNumber: '0117888888',
      isMainPractice: true,
      workingHours: [
        { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
        { day: 'Friday', startTime: '09:00', endTime: '17:00', isAvailable: true }
      ]
    });
  }

  // Doctor 5 - Psychiatrist (if exists)
  if (doctors[4]) {
    locationData.push({
      doctor: doctors[4]._id,
      practiceName: 'Ninewells Hospital',
      address: {
        street: '55/1 Kirimandala Mawatha',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00500',
        country: 'Sri Lanka'
      },
      coordinates: {
        lat: 6.9013,
        lng: 79.8808
      },
      contactNumber: '0116588888',
      isMainPractice: true,
      workingHours: [
        { day: 'Wednesday', startTime: '14:00', endTime: '20:00', isAvailable: true },
        { day: 'Friday', startTime: '14:00', endTime: '20:00', isAvailable: true },
        { day: 'Saturday', startTime: '09:00', endTime: '15:00', isAvailable: true }
      ]
    });
  }

  if (locationData.length > 0) {
    await DoctorLocation.insertMany(locationData);
    console.log(`Added ${locationData.length} doctor locations`);
  } else {
    console.log('No locations to add');
  }
};

const createSampleAppointments = async (doctors, users) => {
  // Check if appointments already exist
  const existingAppointments = await Appointment.countDocuments();
  if (existingAppointments > 0) {
    console.log(`Found ${existingAppointments} existing appointments, skipping creation`);
    return;
  }

  if (!doctors || doctors.length === 0 || !users || users.length === 0) {
    console.log('No doctors or users found to create appointments for');
    return;
  }

  // Get locations
  const locations = await DoctorLocation.find({ 
    doctor: { $in: doctors.map(d => d._id) },
    isMainPractice: true
  });
  
  const locationMap = {};
  locations.forEach(loc => {
    if (loc.doctor) {
      locationMap[loc.doctor.toString()] = loc._id;
    }
  });

  if (Object.keys(locationMap).length === 0) {
    console.log('No doctor locations found to create appointments for');
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const appointmentsData = [];

  // Create some appointments for today for the first doctor (Cardiologist)
  if (doctors[0] && users[0] && users[1] && users[2] && users[3] && users[4] && locationMap[doctors[0]._id.toString()]) {
    appointmentsData.push(
      {
        doctorId: doctors[0]._id,
        userId: users[0]._id,
        patientName: users[0].name,
        patientContact: {
          email: users[0].email,
          phone: users[0].phone
        },
        appointmentDate: today,
        appointmentTime: '09:30',
        status: 'scheduled',
        type: 'in-person',
        reason: 'Annual heart checkup',
        location: locationMap[doctors[0]._id.toString()],
        fee: {
          amount: doctors[0].consultationFee?.amount || 2500,
          currency: doctors[0].consultationFee?.currency || 'LKR',
          isPaid: true,
          paymentMethod: 'card',
          paymentDate: new Date(today.getTime() - 86400000) // yesterday
        }
      },
      {
        doctorId: doctors[0]._id,
        userId: users[1]._id,
        patientName: users[1].name,
        patientContact: {
          email: users[1].email,
          phone: users[1].phone
        },
        appointmentDate: today,
        appointmentTime: '11:00',
        status: 'scheduled',
        type: 'in-person',
        reason: 'Chest pain and shortness of breath',
        location: locationMap[doctors[0]._id.toString()],
        fee: {
          amount: doctors[0].consultationFee?.amount || 2500,
          currency: doctors[0].consultationFee?.currency || 'LKR',
          isPaid: true,
          paymentMethod: 'cash',
          paymentDate: today
        }
      },
      {
        doctorId: doctors[0]._id,
        userId: users[2]._id,
        patientName: users[2].name,
        patientContact: {
          email: users[2].email,
          phone: users[2].phone
        },
        appointmentDate: today,
        appointmentTime: '14:30',
        status: 'urgent',
        type: 'in-person',
        reason: 'Severe chest pain and abnormal ECG',
        location: locationMap[doctors[0]._id.toString()],
        fee: {
          amount: doctors[0].consultationFee?.amount || 2500,
          currency: doctors[0].consultationFee?.currency || 'LKR',
          isPaid: false
        }
      },
      {
        doctorId: doctors[0]._id,
        userId: users[3]._id,
        patientName: users[3].name,
        patientContact: {
          email: users[3].email,
          phone: users[3].phone
        },
        appointmentDate: today,
        appointmentTime: '16:00',
        status: 'scheduled',
        type: 'video',
        reason: 'Follow-up after medication change',
        fee: {
          amount: doctors[0].consultationFee?.amount || 2500,
          currency: doctors[0].consultationFee?.currency || 'LKR',
          isPaid: true,
          paymentMethod: 'card',
          paymentDate: new Date(today.getTime() - 86400000) // yesterday
        }
      },
      {
        doctorId: doctors[0]._id,
        userId: users[4]._id,
        patientName: users[4].name,
        patientContact: {
          email: users[4].email,
          phone: users[4].phone
        },
        appointmentDate: today,
        appointmentTime: '16:30',
        status: 'urgent',
        type: 'in-person',
        reason: 'High blood pressure and dizziness',
        location: locationMap[doctors[0]._id.toString()],
        fee: {
          amount: doctors[0].consultationFee?.amount || 2500,
          currency: doctors[0].consultationFee?.currency || 'LKR',
          isPaid: false
        }
      }
    );
  }

  // Create appointments for tomorrow for doctors 1 and 2
  if (doctors[0] && doctors[1] && users[1] && users[2] && 
      locationMap[doctors[0]._id.toString()] && locationMap[doctors[1]?._id?.toString()]) {
    
    appointmentsData.push(
      {
        doctorId: doctors[0]._id,
        userId: users[1]._id,
        patientName: users[1].name,
        patientContact: {
          email: users[1].email,
          phone: users[1].phone
        },
        appointmentDate: tomorrow,
        appointmentTime: '10:00',
        status: 'scheduled',
        type: 'in-person',
        reason: 'Routine checkup',
        location: locationMap[doctors[0]._id.toString()],
        fee: {
          amount: doctors[0].consultationFee?.amount || 2500,
          currency: doctors[0].consultationFee?.currency || 'LKR',
          isPaid: true,
          paymentMethod: 'card',
          paymentDate: today
        }
      }
    );
    
    if (doctors[1] && locationMap[doctors[1]._id.toString()]) {
      appointmentsData.push({
        doctorId: doctors[1]._id,
        userId: users[2]._id,
        patientName: users[2].name,
        patientContact: {
          email: users[2].email,
          phone: users[2].phone
        },
        appointmentDate: tomorrow,
        appointmentTime: '11:30',
        status: 'scheduled',
        type: 'in-person',
        reason: 'Skin rash examination',
        location: locationMap[doctors[1]._id.toString()],
        fee: {
          amount: doctors[1].consultationFee?.amount || 3500,
          currency: doctors[1].consultationFee?.currency || 'LKR',
          isPaid: true,
          paymentMethod: 'online',
          paymentDate: today
        }
      });
    }
  }

  // Create a few more appointments for other doctors
  if (doctors[2] && users[3] && locationMap[doctors[2]?._id?.toString()]) {
    appointmentsData.push({
      doctorId: doctors[2]._id,
      userId: users[3]._id,
      patientName: users[3].name,
      patientContact: {
        email: users[3].email,
        phone: users[3].phone
      },
      appointmentDate: dayAfterTomorrow,
      appointmentTime: '09:00',
      status: 'scheduled',
      type: 'in-person',
      reason: 'Child vaccination',
      location: locationMap[doctors[2]._id.toString()],
      fee: {
        amount: doctors[2].consultationFee?.amount || 3000,
        currency: doctors[2].consultationFee?.currency || 'LKR',
        isPaid: true,
        paymentMethod: 'card',
        paymentDate: today
      }
    });
  }
  
  if (doctors[3] && users[4] && locationMap[doctors[3]?._id?.toString()]) {
    appointmentsData.push({
      doctorId: doctors[3]._id,
      userId: users[4]._id,
      patientName: users[4].name,
      patientContact: {
        email: users[4].email,
        phone: users[4].phone
      },
      appointmentDate: nextWeek,
      appointmentTime: '14:00',
      status: 'scheduled',
      type: 'in-person',
      reason: 'Knee pain evaluation',
      location: locationMap[doctors[3]._id.toString()],
      fee: {
        amount: doctors[3].consultationFee?.amount || 4500,
        currency: doctors[3].consultationFee?.currency || 'LKR',
        isPaid: false
      }
    });
  }
  
  if (doctors[4] && users[0]) {
    appointmentsData.push({
      doctorId: doctors[4]._id,
      userId: users[0]._id,
      patientName: users[0].name,
      patientContact: {
        email: users[0].email,
        phone: users[0].phone
      },
      appointmentDate: nextWeek,
      appointmentTime: '15:30',
      status: 'scheduled',
      type: 'video',
      reason: 'Anxiety and sleep issues',
      fee: {
        amount: doctors[4].consultationFee?.amount || 4000,
        currency: doctors[4].consultationFee?.currency || 'LKR',
        isPaid: true,
        paymentMethod: 'card',
        paymentDate: today
      }
    });
  }

  if (appointmentsData.length > 0) {
    await Appointment.insertMany(appointmentsData);
    console.log(`Added ${appointmentsData.length} appointments`);
  } else {
    console.log('No appointments to add');
  }
};

seedDoctorData(); 