require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Event = require('../src/models/Event');
const Organizer = require('../src/models/Organizer');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/eventuraa';

async function connectDB() {
  try {
    console.log('Connecting to MongoDB:', MONGO_URI);
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
}

async function seedEventData() {
  try {
    // First, check if we have any organizers in the database
    const organizers = await Organizer.find().limit(5);
    
    if (organizers.length === 0) {
      console.error('No organizers found. Please run seed-test-data.js first.');
      return;
    }

    // Check if events already exist
    const eventCount = await Event.countDocuments();
    
    if (eventCount > 0) {
      console.log(`${eventCount} events already exist`);
    } else {
      // Create sample events
      const events = [
        {
          title: 'Tech Conference 2023',
          description: 'The biggest tech conference in Sri Lanka featuring the latest technologies and industry experts.',
          date: new Date('2023-12-15'),
          time: '09:00 AM',
          location: {
            name: 'BMICH',
            address: 'Bauddhaloka Mawatha',
            city: 'Colombo',
            district: 'Colombo',
            coordinates: {
              latitude: 6.9102,
              longitude: 79.8636
            }
          },
          eventType: 'Conference',
          category: 'Technology',
          approvalStatus: 'approved',
          ticketTypes: [
            {
              name: 'Standard',
              price: 2500,
              quantity: 500,
              available: 450,
              description: 'Standard access to all conference halls and workshops',
              benefits: ['Conference access', 'Workshop access', 'Lunch included']
            },
            {
              name: 'VIP',
              price: 5000,
              quantity: 100,
              available: 85,
              description: 'VIP access with special benefits',
              benefits: ['Priority seating', 'Networking dinner', 'Speaker meet & greet']
            }
          ],
          ticketPrice: 2500,
          ticketsAvailable: 600,
          ticketsSold: 65,
          images: ['/event-images/tech-conf-1.jpg', '/event-images/tech-conf-2.jpg'],
          coverImage: '/event-images/tech-conf-cover.jpg',
          organizer: organizers[0]._id,
          featured: true,
          isActive: true,
          hashtags: ['tech', 'conference', 'innovation', 'srilanka']
        },
        {
          title: 'Health and Wellness Expo',
          description: 'A comprehensive health and wellness exhibition featuring medical professionals, yoga instructors, and wellness product vendors.',
          date: new Date('2023-11-20'),
          time: '10:00 AM',
          location: {
            name: 'Nelum Pokuna Theatre',
            address: 'Nelum Pokuna Mawatha',
            city: 'Colombo',
            district: 'Colombo',
            coordinates: {
              latitude: 6.9102,
              longitude: 79.8636
            }
          },
          eventType: 'Expo',
          category: 'Health',
          approvalStatus: 'approved',
          ticketTypes: [
            {
              name: 'Regular',
              price: 1500,
              quantity: 300,
              available: 240,
              description: 'Regular entry to the expo',
              benefits: ['Exhibition access', 'Free health checkup']
            }
          ],
          ticketPrice: 1500,
          ticketsAvailable: 300,
          ticketsSold: 60,
          images: ['/event-images/health-expo-1.jpg', '/event-images/health-expo-2.jpg'],
          coverImage: '/event-images/health-expo-cover.jpg',
          organizer: organizers[1]._id,
          featured: false,
          isActive: true,
          hashtags: ['health', 'wellness', 'yoga', 'meditation']
        },
        {
          title: 'Annual Food Festival',
          description: 'A celebration of Sri Lankan cuisine with street food, cooking demonstrations, and competitions.',
          date: new Date('2023-12-02'),
          time: '11:00 AM',
          location: {
            name: 'Viharamahadevi Park',
            address: 'Viharamahadevi Park',
            city: 'Colombo',
            district: 'Colombo',
            coordinates: {
              latitude: 6.9155,
              longitude: 79.8572
            }
          },
          eventType: 'Festival',
          category: 'Food & Drinks',
          approvalStatus: 'approved',
          ticketTypes: [
            {
              name: 'Entry',
              price: 1000,
              quantity: 1000,
              available: 800,
              description: 'Entry ticket to the food festival',
              benefits: ['Entry to festival grounds', 'Free water bottle']
            },
            {
              name: 'Food Pass',
              price: 2500,
              quantity: 300,
              available: 270,
              description: 'Entry plus food vouchers',
              benefits: ['Entry to festival grounds', 'Food vouchers worth Rs.2000']
            }
          ],
          ticketPrice: 1000,
          ticketsAvailable: 1300,
          ticketsSold: 230,
          images: ['/event-images/food-fest-1.jpg', '/event-images/food-fest-2.jpg'],
          coverImage: '/event-images/food-fest-cover.jpg',
          organizer: organizers[2]._id,
          featured: true,
          isActive: true,
          hashtags: ['food', 'festival', 'cuisine', 'colombo']
        },
        {
          title: 'Music Concert - Stars of Lanka',
          description: 'A night of exceptional music featuring the top musicians of Sri Lanka.',
          date: new Date('2023-12-25'),
          time: '06:00 PM',
          location: {
            name: 'Sugathadasa Stadium',
            address: 'Sugathadasa Stadium',
            city: 'Colombo',
            district: 'Colombo',
            coordinates: {
              latitude: 6.9259,
              longitude: 79.8775
            }
          },
          eventType: 'Concert',
          category: 'Music',
          approvalStatus: 'approved',
          ticketTypes: [
            {
              name: 'General',
              price: 3000,
              quantity: 800,
              available: 550,
              description: 'General admission',
              benefits: ['Standing area access']
            },
            {
              name: 'Gold',
              price: 5000,
              quantity: 400,
              available: 300,
              description: 'Gold seating',
              benefits: ['Seated area', 'Better view']
            },
            {
              name: 'Platinum',
              price: 8000,
              quantity: 200,
              available: 180,
              description: 'Premium seating',
              benefits: ['Premium seating', 'Exclusive merchandise', 'Meet & greet']
            }
          ],
          ticketPrice: 3000,
          ticketsAvailable: 1400,
          ticketsSold: 370,
          images: ['/event-images/concert-1.jpg', '/event-images/concert-2.jpg'],
          coverImage: '/event-images/concert-cover.jpg',
          organizer: organizers[4]._id,
          featured: true,
          isActive: true,
          hashtags: ['music', 'concert', 'livemusic', 'srilanka']
        },
        {
          title: 'Business Leadership Summit',
          description: 'A summit for business leaders to discuss strategies, innovations, and the future of business in Sri Lanka.',
          date: new Date('2023-11-30'),
          time: '08:30 AM',
          location: {
            name: 'Shangri-La Hotel',
            address: 'Galle Face',
            city: 'Colombo',
            district: 'Colombo',
            coordinates: {
              latitude: 6.9269,
              longitude: 79.8481
            }
          },
          eventType: 'Summit',
          category: 'Business',
          approvalStatus: 'approved',
          ticketTypes: [
            {
              name: 'Professional',
              price: 5000,
              quantity: 300,
              available: 220,
              description: 'Professional ticket',
              benefits: ['Conference access', 'Lunch and refreshments', 'Digital materials']
            },
            {
              name: 'Executive',
              price: 10000,
              quantity: 100,
              available: 85,
              description: 'Executive ticket',
              benefits: ['Conference access', 'Lunch and refreshments', 'Physical materials', 'Networking dinner']
            }
          ],
          ticketPrice: 5000,
          ticketsAvailable: 400,
          ticketsSold: 95,
          images: ['/event-images/business-summit-1.jpg', '/event-images/business-summit-2.jpg'],
          coverImage: '/event-images/business-summit-cover.jpg',
          organizer: organizers[3]._id,
          featured: false,
          isActive: true,
          hashtags: ['business', 'leadership', 'entrepreneurship', 'summit']
        },
        {
          title: 'Colombo Art Exhibition',
          description: 'An exhibition showcasing the finest art pieces from renowned and upcoming Sri Lankan artists.',
          date: new Date('2023-12-10'),
          time: '10:00 AM',
          location: {
            name: 'Lionel Wendt Art Centre',
            address: 'Guildford Crescent',
            city: 'Colombo',
            district: 'Colombo',
            coordinates: {
              latitude: 6.9119,
              longitude: 79.8562
            }
          },
          eventType: 'Exhibition',
          category: 'Art & Culture',
          approvalStatus: 'pending',
          ticketTypes: [
            {
              name: 'Standard',
              price: 1200,
              quantity: 200,
              available: 180,
              description: 'Standard entry ticket',
              benefits: ['Exhibition access', 'Exhibition catalog']
            }
          ],
          ticketPrice: 1200,
          ticketsAvailable: 200,
          ticketsSold: 20,
          images: ['/event-images/art-exhibition-1.jpg', '/event-images/art-exhibition-2.jpg'],
          coverImage: '/event-images/art-exhibition-cover.jpg',
          organizer: organizers[0]._id,
          featured: false,
          isActive: true,
          hashtags: ['art', 'exhibition', 'culture', 'colombo']
        }
      ];
      
      await Event.insertMany(events);
      console.log(`Created ${events.length} sample events`);
    }
    
    console.log('Event data seeding completed');
  } catch (error) {
    console.error('Error seeding event data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

connectDB().then(() => {
  seedEventData();
}); 