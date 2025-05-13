const TicketPurchase = require('../models/TicketPurchase');
const Event = require('../models/Event');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const mongoose = require('mongoose');

/**
 * Process a new ticket purchase
 */
exports.purchaseTickets = async (req, res) => {
  try {
    const { eventId, tickets, contactInfo, payment, totalAmount, serviceFee } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate request
    if (!eventId || !tickets || !tickets.length || !contactInfo || !payment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for purchase'
      });
    }

    // Get the event with its ticket types
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if the event is active and approved
    if (!event.isActive || event.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'This event is not available for ticket purchases'
      });
    }

    // Validate ticket quantities and update availability
    const ticketItems = [];
    let isAvailable = true;
    let errorMessage = '';

    // First, check if all requested tickets are available
    for (const ticket of tickets) {
      const { ticketType, quantity } = ticket;
      
      // Find the corresponding ticket type in the event
      const eventTicketType = event.ticketTypes.find(t => t.name === ticketType);
      
      if (!eventTicketType) {
        isAvailable = false;
        errorMessage = `Ticket type "${ticketType}" not found`;
        break;
      }
      
      if (eventTicketType.available < quantity) {
        isAvailable = false;
        errorMessage = `Not enough tickets available for "${ticketType}"`;
        break;
      }
    }

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }

    // Generate transaction ID
    const timestamp = new Date().getTime();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const transactionId = `TXN-${timestamp}-${randomPart}`;

    // Process ticket purchase
    // 1. Update ticket availability in the event
    for (const ticket of tickets) {
      const { ticketType, quantity, pricePerTicket } = ticket;
      
      // Update event ticket type availability
      const eventTicketTypeIndex = event.ticketTypes.findIndex(t => t.name === ticketType);
      event.ticketTypes[eventTicketTypeIndex].available -= quantity;
      event.ticketTypes[eventTicketTypeIndex].sold += quantity;
      
      // Create individual tickets with generated ticket numbers
      for (let i = 0; i < quantity; i++) {
        const ticketTimestamp = new Date().getTime();
        const ticketRandomPart = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const ticketIndex = (i + 1).toString().padStart(3, '0');
        const ticketNumber = `TCKT-${ticketTimestamp.toString().slice(-6)}-${ticketRandomPart}-${ticketIndex}`;
        
        ticketItems.push({
          ticketType,
          ticketNumber,
          price: pricePerTicket,
          attendeeInfo: {
            name: contactInfo.fullName,
            email: contactInfo.email,
            phone: contactInfo.phoneNumber
          }
        });
      }
    }

    // Update total tickets sold for the event
    event.ticketsSold += ticketItems.length;
    await event.save();

    // 2. Create the ticket purchase record
    const ticketPurchase = new TicketPurchase({
      event: eventId,
      user: userId,
      tickets: ticketItems,
      totalAmount,
      serviceFee,
      contactInfo,
      payment,
      transactionId
    });

    await ticketPurchase.save();

    // 3. Update the user's purchases
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.ticketPurchases.push(ticketPurchase._id);
    await user.save();

    // 4. Update the event's purchases
    event.purchases.push(ticketPurchase._id);
    await event.save();

    // 5. Update the organizer's sales data
    const organizer = await Organizer.findById(event.organizer);
    if (organizer) {
      organizer.eventTicketSales.purchases.push(ticketPurchase._id);
      organizer.eventTicketSales.totalSold += ticketItems.length;
      organizer.eventTicketSales.totalRevenue += (totalAmount - serviceFee); // Revenue without service fee
      await organizer.save();
    }

    // Return success response with purchase details
    return res.status(201).json({
      success: true,
      message: 'Ticket purchase successful',
      data: {
        bookingId: ticketPurchase._id,
        transactionId: ticketPurchase.transactionId,
        ticketCount: ticketItems.length,
        totalAmount,
        serviceFee,
        tickets: ticketPurchase.tickets.map(ticket => ({
          ticketNumber: ticket.ticketNumber,
          ticketType: ticket.ticketType,
          price: ticket.price
        }))
      }
    });

  } catch (error) {
    console.error('Error processing ticket purchase:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing the purchase',
      error: error.message
    });
  }
};

/**
 * Get ticket purchase by ID
 */
exports.getTicketPurchase = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user.id; // From auth middleware

    const purchase = await TicketPurchase.findById(purchaseId)
      .populate('event', 'title date time location coverImage')
      .exec();

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Ticket purchase not found'
      });
    }

    // Check if the requesting user is the owner of the purchase
    if (purchase.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this ticket purchase'
      });
    }

    return res.status(200).json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error('Error fetching ticket purchase:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching the ticket purchase',
      error: error.message
    });
  }
};

/**
 * Get all ticket purchases for a user
 */
exports.getUserTicketPurchases = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    const purchases = await TicketPurchase.find({ user: userId })
      .populate('event', 'title date time location coverImage')
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      success: true,
      data: purchases
    });

  } catch (error) {
    console.error('Error fetching user ticket purchases:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching ticket purchases',
      error: error.message
    });
  }
};

/**
 * Get all tickets for an event
 * Only accessible by the event organizer or admin
 */
exports.getEventTickets = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId).populate('organizer').exec();
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if the requesting user is the organizer or an admin
    const isOrganizer = event.organizer._id.toString() === req.user.organizerId;
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to event tickets'
      });
    }

    const purchases = await TicketPurchase.find({ event: eventId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .exec();

    return res.status(200).json({
      success: true,
      data: purchases
    });

  } catch (error) {
    console.error('Error fetching event tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching event tickets',
      error: error.message
    });
  }
}; 