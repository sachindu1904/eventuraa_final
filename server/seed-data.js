const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import all models
const Admin = require('./src/models/Admin');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Organizer = require('./src/models/Organizer');
const Event = require('./src/models/Event');
const Venue = require('./src/models/Venue');
const VenueHost = require('./src/models/VenueHost');
const Room = require('./src/models/Room');
const RoomType = require('./src/models/RoomType');
const Booking = require('./src/models/Booking');
const TicketPurchase = require('./src/models/TicketPurchase');
const Credentials = require('./src/models/Credentials');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to hash passwords
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Function to generate random date in the future
const futureDate = (daysAhead = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + Math.floor(Math.random() * daysAhead));
  return date;
};

// Function to generate random date in the past
const pastDate = (daysAgo = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

// Function to generate random number in a range
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Function to generate a unique booking reference
const generateBookingReference = () => {
  // Generate a random alphanumeric string
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  // Use current date as prefix (YYMMDD)
  const datePrefix = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  return `BK${datePrefix}${randomPart}`;
};

// Seed data
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Clear existing data
    await Promise.all([
      Admin.deleteMany({}),
      User.deleteMany({}),
      Doctor.deleteMany({}),
      Organizer.deleteMany({}),
      Event.deleteMany({}),
      Venue.deleteMany({}),
      VenueHost.deleteMany({}),
      Room.deleteMany({}),
      RoomType.deleteMany({}),
      Booking.deleteMany({}),
      TicketPurchase.deleteMany({}),
      Credentials.deleteMany({})
    ]);
    
    console.log('Cleared existing data');
    
    // Create admin (already done via create-admin.js)
    const adminPassword = await hashPassword('Admin123!');
    const admin = await Admin.create({
      name: 'Admin User',
      email: 'admin@eventuraa.lk',
      password: adminPassword,
      phone: '1234567890',
      role: 'superadmin',
      permissions: {
        manageUsers: true,
        manageOrganizers: true,
        manageDoctors: true,
        manageEvents: true,
        manageVenues: true,
        manageVenueHosts: true,
        manageContent: true,
        manageAdmins: true,
        viewReports: true,
        financialAccess: true
      },
      isActive: true
    });
    
    console.log('Created admin user');

    // Create users
    const userPassword = await hashPassword('Password123!');
    const users = await User.insertMany([
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: userPassword,
        phone: '0771234567',
        isActive: true,
        isVerified: true
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: userPassword,
        phone: '0777654321',
        isActive: true,
        isVerified: true
      },
      {
        name: 'Robert Johnson',
        email: 'robert@example.com',
        password: userPassword,
        phone: '0701122334',
        isActive: true,
        isVerified: true
      }
    ]);
    
    console.log('Created users');
    
    // Create doctors
    const doctorPassword = await hashPassword('Doctor123!');
    const doctors = await Doctor.insertMany([
      {
        name: 'Dr. Sarah Wilson',
        email: 'sarah@doctor.com',
        password: doctorPassword,
        phone: '0761234567',
        specialty: 'Cardiology',
        regNumber: 'SL-MED-1234',
        qualifications: [
          { degree: 'MBBS', institution: 'University of Colombo', year: 2005 },
          { degree: 'MD', institution: 'National Hospital Sri Lanka', year: 2010 },
          { degree: 'FRCP', institution: 'Royal College of Physicians UK', year: 2015 }
        ],
        experience: 10,
        bio: 'Experienced cardiologist specializing in preventive cardiology and cardiac rehabilitation.',
        specializations: ['Preventive Cardiology', 'Cardiac Rehabilitation', 'Echocardiography'],
        languages: ['English', 'Sinhala', 'Tamil'],
        practices: [
          {
            hospitalName: 'Asiri Hospital',
            address: {
              street: '181 Kirula Road',
              city: 'Colombo',
              district: 'Colombo',
              postalCode: '00500',
              country: 'Sri Lanka'
            },
            position: 'Senior Consultant',
            contactNumber: '0112862485',
            workingHours: [
              { day: 'Monday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Wednesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Friday', startTime: '09:00', endTime: '12:00', isAvailable: true }
            ]
          }
        ],
        consultationFee: {
          amount: 2500,
          currency: 'LKR'
        },
        isActive: true,
        verificationStatus: {
          isVerified: true,
          verificationDate: new Date()
        }
      },
      {
        name: 'Dr. Michael Brown',
        email: 'michael@doctor.com',
        password: doctorPassword,
        phone: '0762345678',
        specialty: 'Neurology',
        regNumber: 'SL-MED-2345',
        qualifications: [
          { degree: 'MBBS', institution: 'University of Peradeniya', year: 2000 },
          { degree: 'MD', institution: 'National Hospital Sri Lanka', year: 2005 },
          { degree: 'PhD', institution: 'Johns Hopkins University, USA', year: 2010 }
        ],
        experience: 15,
        bio: 'Specialized neurologist with extensive research experience in stroke prevention and treatment.',
        specializations: ['Stroke Treatment', 'Neurodegenerative Disorders', 'Headache Disorders'],
        languages: ['English', 'Sinhala'],
        practices: [
          {
            hospitalName: 'Nawaloka Hospital',
            address: {
              street: '23 Deshamanya H.K. Dharmadasa Mawatha',
              city: 'Colombo',
              district: 'Colombo',
              postalCode: '00200',
              country: 'Sri Lanka'
            },
            position: 'Head of Neurology',
            contactNumber: '0115577111',
            workingHours: [
              { day: 'Tuesday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Thursday', startTime: '09:00', endTime: '17:00', isAvailable: true },
              { day: 'Saturday', startTime: '09:00', endTime: '12:00', isAvailable: true }
            ]
          }
        ],
        consultationFee: {
          amount: 3000,
          currency: 'LKR'
        },
        isActive: true,
        verificationStatus: {
          isVerified: true,
          verificationDate: new Date()
        }
      }
    ]);
    
    console.log('Created doctors');
    
    // Create organizers
    const organizerPassword = await hashPassword('Organizer123!');
    const organizers = await Organizer.insertMany([
      {
        name: 'Malik Fernando',
        companyName: 'EventMasters SL',
        email: 'events@eventmasters.lk',
        password: organizerPassword,
        phone: '0114567890',
        businessAddress: {
          street: '123 Event Lane',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00300',
          country: 'Sri Lanka'
        },
        website: 'https://eventmasters.lk',
        businessType: 'Event Management',
        description: 'Leading event management company specializing in corporate and music events.',
        businessRegistrationNumber: 'BRN-123456',
        verificationStatus: {
          isVerified: true,
          verificationDate: new Date()
        },
        isActive: true
      },
      {
        name: 'Nimal Perera',
        companyName: 'Showtime Productions',
        email: 'info@showtime.lk',
        password: organizerPassword,
        phone: '0112345678',
        businessAddress: {
          street: '45 Show Street',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00500',
          country: 'Sri Lanka'
        },
        website: 'https://showtime.lk',
        businessType: 'Entertainment Production',
        description: 'Premier entertainment production company creating memorable experiences.',
        businessRegistrationNumber: 'BRN-789012',
        verificationStatus: {
          isVerified: true,
          verificationDate: new Date()
        },
        isActive: true
      }
    ]);
    
    console.log('Created organizers');
    
    // Create venue hosts
    const venueHostPassword = await hashPassword('VenueHost123!');
    const venueHosts = await VenueHost.insertMany([
      {
        name: 'Samantha Silva',
        email: 'bookings@lakeside.lk',
        password: venueHostPassword,
        phone: '0112233445',
        venueName: 'Lakeside Resorts',
        venueType: 'resort',
        venueLocation: 'Colombo',
        description: 'A luxurious lakeside resort offering premium accommodations and events facilities.',
        facilities: ['Swimming Pool', 'Conference Hall', 'Restaurant', 'Spa', 'Gym'],
        amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Parking'],
        capacity: {
          min: 10,
          max: 500
        },
        priceRange: {
          currency: 'LKR',
          min: 15000,
          max: 50000
        },
        businessAddress: {
          street: '78 Lake Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00800',
          country: 'Sri Lanka'
        },
        website: 'https://lakeside.lk',
        businessRegistrationNumber: 'BRN-345678',
        verificationStatus: {
          isVerified: true,
          verificationDate: new Date()
        },
        isActive: true
      },
      {
        name: 'David Fernando',
        email: 'reservations@beachfront.lk',
        password: venueHostPassword,
        phone: '0115566778',
        venueName: 'Beachfront Hotels',
        venueType: 'hotel',
        venueLocation: 'Negombo',
        description: 'Experience the beauty of the beach at our luxury hotel with excellent service.',
        facilities: ['Private Beach', 'Swimming Pool', 'Restaurant', 'Bar', 'Conference Room'],
        amenities: ['Free WiFi', 'Air Conditioning', 'Room Service', 'Parking', 'Airport Shuttle'],
        capacity: {
          min: 5,
          max: 300
        },
        priceRange: {
          currency: 'LKR',
          min: 18000,
          max: 60000
        },
        businessAddress: {
          street: '23 Beach Drive',
          city: 'Negombo',
          district: 'Gampaha',
          postalCode: '11500',
          country: 'Sri Lanka'
        },
        website: 'https://beachfront.lk',
        businessRegistrationNumber: 'BRN-567890',
        verificationStatus: {
          isVerified: true,
          verificationDate: new Date()
        },
        isActive: true
      }
    ]);
    
    console.log('Created venue hosts');
    
    // Create venues
    const venues = await Venue.insertMany([
      {
        name: 'Lakeside Resort & Spa',
        type: 'resort',
        location: 'Colombo',
        address: {
          street: '78 Lake Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00800',
          country: 'Sri Lanka'
        },
        venueHost: venueHosts[0]._id,
        description: 'A luxurious resort by the lake offering stunning views and modern amenities.',
        facilities: ['Swimming Pool', 'Spa', 'Restaurant', 'Free WiFi', 'Parking'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945',
            public_id: 'venue_1_img_1',
            caption: 'Resort Exterior',
            isMain: true
          },
          {
            url: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791',
            public_id: 'venue_1_img_2',
            caption: 'Resort Pool',
            isMain: false
          }
        ],
        approvalStatus: 'approved',
        capacity: {
          min: 10,
          max: 500
        },
        priceRange: {
          currency: 'LKR',
          min: 15000,
          max: 50000
        },
        isActive: true
      },
      {
        name: 'Beachfront Grand Hotel',
        type: 'hotel',
        location: 'Negombo',
        address: {
          street: '23 Beach Drive',
          city: 'Negombo',
          district: 'Gampaha',
          postalCode: '11500',
          country: 'Sri Lanka'
        },
        venueHost: venueHosts[1]._id,
        description: 'Experience the beauty of the beach at our luxury hotel with excellent service.',
        facilities: ['Beach Access', 'Swimming Pool', 'Restaurant', 'Bar', 'Gym', 'Parking'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4',
            public_id: 'venue_2_img_1',
            caption: 'Hotel Exterior',
            isMain: true
          },
          {
            url: 'https://images.unsplash.com/photo-1562790351-d273a961e0e9',
            public_id: 'venue_2_img_2',
            caption: 'Beach View',
            isMain: false
          }
        ],
        approvalStatus: 'approved',
        capacity: {
          min: 5,
          max: 300
        },
        priceRange: {
          currency: 'LKR',
          min: 18000,
          max: 60000
        },
        isActive: true
      }
    ]);
    
    console.log('Created venues');
    
    // Create room types
    const roomTypes = await RoomType.insertMany([
      {
        name: 'Deluxe Room',
        venue: venues[0]._id,
        description: 'Spacious room with lake view',
        pricePerNight: {
          currency: 'LKR',
          amount: 15000
        },
        capacity: 2,
        totalRooms: 10,
        amenities: ['Air Conditioning', 'TV', 'Mini Bar', 'Free WiFi'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427',
            public_id: 'room_type_1_img_1',
            caption: 'Deluxe Room Interior',
            isMain: true
          },
          {
            url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a',
            public_id: 'room_type_1_img_2',
            caption: 'Deluxe Room Bathroom',
            isMain: false
          }
        ]
      },
      {
        name: 'Executive Suite',
        venue: venues[0]._id,
        description: 'Luxury suite with separate living area',
        pricePerNight: {
          currency: 'LKR',
          amount: 25000
        },
        capacity: 4,
        totalRooms: 5,
        amenities: ['Air Conditioning', 'TV', 'Mini Bar', 'Free WiFi', 'Jacuzzi'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b',
            public_id: 'room_type_2_img_1',
            caption: 'Executive Suite Interior',
            isMain: true
          },
          {
            url: 'https://images.unsplash.com/photo-1564223296391-63e37a785d22',
            public_id: 'room_type_2_img_2',
            caption: 'Executive Suite Living Area',
            isMain: false
          }
        ]
      },
      {
        name: 'Beach View Room',
        venue: venues[1]._id,
        description: 'Room with beautiful beach view',
        pricePerNight: {
          currency: 'LKR',
          amount: 18000
        },
        capacity: 2,
        totalRooms: 10,
        amenities: ['Air Conditioning', 'TV', 'Mini Bar', 'Free WiFi', 'Balcony'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c',
            public_id: 'room_type_3_img_1',
            caption: 'Beach View Room Interior',
            isMain: true
          },
          {
            url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6',
            public_id: 'room_type_3_img_2',
            caption: 'Beach View Room Balcony',
            isMain: false
          }
        ]
      },
      {
        name: 'Family Suite',
        venue: venues[1]._id,
        description: 'Spacious suite for family stays',
        pricePerNight: {
          currency: 'LKR',
          amount: 30000
        },
        capacity: 6,
        totalRooms: 5,
        amenities: ['Air Conditioning', 'TV', 'Mini Bar', 'Free WiFi', 'Kitchen', 'Multiple Bathrooms'],
        images: [
          {
            url: 'https://images.unsplash.com/photo-1591088398332-8a7791972843',
            public_id: 'room_type_4_img_1',
            caption: 'Family Suite Interior',
            isMain: true
          },
          {
            url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461',
            public_id: 'room_type_4_img_2',
            caption: 'Family Suite Kitchen',
            isMain: false
          }
        ]
      }
    ]);
    
    console.log('Created room types');
    
    // Create rooms
    const rooms = [];
    
    // Create rooms for first room type (Deluxe Room)
    for (let i = 101; i <= 110; i++) {
      rooms.push({
        roomNumber: i.toString(),
        roomType: roomTypes[0]._id,
        venue: venues[0]._id,
        status: 'available'
      });
    }
    
    // Create rooms for second room type (Executive Suite)
    for (let i = 201; i <= 205; i++) {
      rooms.push({
        roomNumber: i.toString(),
        roomType: roomTypes[1]._id,
        venue: venues[0]._id,
        status: 'available'
      });
    }
    
    // Create rooms for third room type (Beach View Room)
    for (let i = 101; i <= 110; i++) {
      rooms.push({
        roomNumber: i.toString(),
        roomType: roomTypes[2]._id,
        venue: venues[1]._id,
        status: 'available'
      });
    }
    
    // Create rooms for fourth room type (Family Suite)
    for (let i = 201; i <= 205; i++) {
      rooms.push({
        roomNumber: i.toString(),
        roomType: roomTypes[3]._id,
        venue: venues[1]._id,
        status: 'available'
      });
    }
    
    await Room.insertMany(rooms);
    console.log('Created rooms');
    
    // Create events
    const events = await Event.insertMany([
      {
        title: 'Summer Music Festival',
        description: 'A three-day music festival featuring local and international artists.',
        date: futureDate(30),
        time: '16:00',
        duration: 8,
        eventType: 'festival',
        category: 'Music',
        location: {
          name: 'Colombo City Auditorium',
          address: '123 Event Street, Colombo 03',
          city: 'Colombo',
          district: 'Colombo',
          coordinates: {
            latitude: 6.914414,
            longitude: 79.861243
          }
        },
        organizer: organizers[0]._id,
        ticketPrice: 3500,
        ticketsAvailable: 850,
        ticketsSold: 150,
        images: [
          'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
          'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4'
        ],
        isActive: true,
        featured: true,
        approvalStatus: 'approved',
        hashtags: ['music', 'festival', 'summer', 'colombo']
      },
      {
        title: 'Tech Startup Conference',
        description: 'Connect with entrepreneurs, investors, and tech enthusiasts.',
        date: futureDate(45),
        time: '09:00',
        duration: 9,
        eventType: 'conference',
        category: 'Business',
        location: {
          name: 'BMICH',
          address: 'Bauddhaloka Mawatha, Colombo 07',
          city: 'Colombo',
          district: 'Colombo',
          coordinates: {
            latitude: 6.900971,
            longitude: 79.868164
          }
        },
        organizer: organizers[1]._id,
        ticketPrice: 5000,
        ticketsAvailable: 420,
        ticketsSold: 80,
        images: [
          'https://images.unsplash.com/photo-1505373877841-8d25f7d46678',
          'https://images.unsplash.com/photo-1515187029135-18ee286d815b'
        ],
        isActive: true,
        featured: true,
        approvalStatus: 'approved',
        hashtags: ['tech', 'startup', 'business', 'conference']
      },
      {
        title: 'Food & Culture Festival',
        description: 'Experience traditional Sri Lankan cuisine and cultural performances.',
        date: futureDate(15),
        time: '11:00',
        duration: 10,
        eventType: 'festival',
        category: 'Food & Drink',
        location: {
          name: 'Independence Square',
          address: 'Independence Square, Colombo 07',
          city: 'Colombo',
          district: 'Colombo',
          coordinates: {
            latitude: 6.906783,
            longitude: 79.868651
          }
        },
        organizer: organizers[0]._id,
        ticketPrice: 1500,
        ticketsAvailable: 1800,
        ticketsSold: 200,
        images: [
          'https://images.unsplash.com/photo-1555244162-803834f70033',
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836'
        ],
        isActive: true,
        featured: true,
        approvalStatus: 'approved',
        hashtags: ['food', 'culture', 'festival', 'srilanka']
      }
    ]);
    
    console.log('Created events');
    
    // Create bookings
    const bookings = await Booking.insertMany([
      {
        user: users[0]._id,
        venue: venues[0]._id,
        venueHost: venueHosts[0]._id,
        roomType: roomTypes[0]._id,
        checkInDate: futureDate(10),
        checkOutDate: futureDate(13),
        guests: 2,
        totalPrice: 45000,
        status: 'confirmed',
        contactInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '0771234567'
        },
        payment: {
          status: 'paid',
          method: 'credit_card',
          transactionId: 'txn_' + Math.random().toString(36).substring(2, 12),
          cardLastFour: '4242'
        },
        bookingReference: generateBookingReference(),
        specialRequests: 'Early check-in if possible'
      },
      {
        user: users[1]._id,
        venue: venues[1]._id,
        venueHost: venueHosts[1]._id,
        roomType: roomTypes[2]._id,
        checkInDate: futureDate(20),
        checkOutDate: futureDate(25),
        guests: 2,
        totalPrice: 90000,
        status: 'confirmed',
        contactInfo: {
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          phone: '0777654321'
        },
        payment: {
          status: 'paid',
          method: 'credit_card',
          transactionId: 'txn_' + Math.random().toString(36).substring(2, 12),
          cardLastFour: '1234'
        },
        bookingReference: generateBookingReference()
      }
    ]);
    
    console.log('Created bookings');
    
    // Create ticket purchases
    const ticketPurchases = await TicketPurchase.insertMany([
      {
        user: users[0]._id,
        event: events[0]._id,
        tickets: [
          {
            ticketNumber: 'TCKT-234567-12345-001',
            ticketType: 'General Admission',
            price: 3500,
            attendeeInfo: {
              name: 'John Doe',
              email: 'john@example.com',
              phone: '0771234567'
            }
          },
          {
            ticketNumber: 'TCKT-234567-12345-002',
            ticketType: 'General Admission',
            price: 3500,
            attendeeInfo: {
              name: 'Sarah Doe',
              email: 'sarah@example.com',
              phone: '0771234568'
            }
          }
        ],
        transactionId: 'TXN-' + Date.now() + '-0001',
        totalAmount: 7000,
        serviceFee: 350,
        purchaseDate: new Date(),
        status: 'confirmed',
        contactInfo: {
          fullName: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '0771234567'
        },
        payment: {
          method: 'credit_card',
          status: 'completed',
          details: {
            cardHolderName: 'John Doe',
            lastFourDigits: '4242'
          }
        }
      },
      {
        user: users[1]._id,
        event: events[1]._id,
        tickets: [
          {
            ticketNumber: 'TCKT-234568-12346-001',
            ticketType: 'Premium',
            price: 5000,
            attendeeInfo: {
              name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '0777654321'
            }
          }
        ],
        transactionId: 'TXN-' + Date.now() + '-0002',
        totalAmount: 5000,
        serviceFee: 250,
        purchaseDate: new Date(),
        status: 'confirmed',
        contactInfo: {
          fullName: 'Jane Smith',
          email: 'jane@example.com',
          phoneNumber: '0777654321'
        },
        payment: {
          method: 'credit_card',
          status: 'completed',
          details: {
            cardHolderName: 'Jane Smith',
            lastFourDigits: '1234'
          }
        }
      },
      {
        user: users[2]._id,
        event: events[2]._id,
        tickets: [
          {
            ticketNumber: 'TCKT-234569-12347-001',
            ticketType: 'Family Pack',
            price: 1500,
            attendeeInfo: {
              name: 'Robert Johnson',
              email: 'robert@example.com',
              phone: '0701122334'
            }
          },
          {
            ticketNumber: 'TCKT-234569-12347-002',
            ticketType: 'Family Pack',
            price: 1500,
            attendeeInfo: {
              name: 'Mary Johnson',
              email: 'mary@example.com',
              phone: '0701122335'
            }
          },
          {
            ticketNumber: 'TCKT-234569-12347-003',
            ticketType: 'Family Pack',
            price: 1500,
            attendeeInfo: {
              name: 'David Johnson',
              email: 'david@example.com',
              phone: '0701122336'
            }
          },
          {
            ticketNumber: 'TCKT-234569-12347-004',
            ticketType: 'Family Pack',
            price: 1500,
            attendeeInfo: {
              name: 'Lisa Johnson',
              email: 'lisa@example.com',
              phone: '0701122337'
            }
          }
        ],
        transactionId: 'TXN-' + Date.now() + '-0003',
        totalAmount: 6000,
        serviceFee: 300,
        purchaseDate: new Date(),
        status: 'confirmed',
        contactInfo: {
          fullName: 'Robert Johnson',
          email: 'robert@example.com',
          phoneNumber: '0701122334'
        },
        payment: {
          method: 'credit_card',
          status: 'completed',
          details: {
            cardHolderName: 'Robert Johnson',
            lastFourDigits: '5678'
          }
        }
      }
    ]);
    
    console.log('Created ticket purchases');
    
    // Update events with sold tickets
    await Event.updateOne(
      { _id: events[0]._id },
      { $inc: { ticketsSold: 2, ticketsAvailable: -2 } }
    );
    
    await Event.updateOne(
      { _id: events[1]._id },
      { $inc: { ticketsSold: 1, ticketsAvailable: -1 } }
    );
    
    await Event.updateOne(
      { _id: events[2]._id },
      { $inc: { ticketsSold: 4, ticketsAvailable: -4 } }
    );
    
    console.log('Updated event ticket counts');
    
    // Create credentials (if needed for separate auth system)
    await Credentials.insertMany([
      {
        email: 'admin@eventuraa.lk',
        password: adminPassword,
        userType: 'admin',
        userId: admin._id,
        userModel: 'Admin'
      },
      {
        email: 'john@example.com',
        password: userPassword,
        userType: 'user',
        userId: users[0]._id,
        userModel: 'User'
      },
      {
        email: 'jane@example.com',
        password: userPassword,
        userType: 'user',
        userId: users[1]._id,
        userModel: 'User'
      },
      {
        email: 'sarah@doctor.com',
        password: doctorPassword,
        userType: 'doctor',
        userId: doctors[0]._id,
        userModel: 'Doctor'
      },
      {
        email: 'events@eventmasters.lk',
        password: organizerPassword,
        userType: 'organizer',
        userId: organizers[0]._id,
        userModel: 'Organizer'
      },
      {
        email: 'bookings@lakeside.lk',
        password: venueHostPassword,
        userType: 'venue-host',
        userId: venueHosts[0]._id,
        userModel: 'VenueHost'
      }
    ]);
    
    console.log('Created credentials');
    
    console.log('===================================');
    console.log('Database seeding completed successfully!');
    console.log('===================================');
    console.log('Login credentials:');
    console.log('-----------------------------------');
    console.log('Admin:');
    console.log('Email: admin@eventuraa.lk');
    console.log('Password: Admin123!');
    console.log('-----------------------------------');
    console.log('User:');
    console.log('Email: john@example.com');
    console.log('Password: Password123!');
    console.log('-----------------------------------');
    console.log('Doctor:');
    console.log('Email: sarah@doctor.com');
    console.log('Password: Doctor123!');
    console.log('-----------------------------------');
    console.log('Organizer:');
    console.log('Email: events@eventmasters.lk');
    console.log('Password: Organizer123!');
    console.log('-----------------------------------');
    console.log('Venue Host:');
    console.log('Email: bookings@lakeside.lk');
    console.log('Password: VenueHost123!');
    console.log('===================================');
    
    // Disconnect from MongoDB
    mongoose.disconnect();
  } catch (error) {
    console.error('Seeding error:', error);
    mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 