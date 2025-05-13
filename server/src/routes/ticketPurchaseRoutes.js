const express = require('express');
const router = express.Router();
const ticketPurchaseController = require('../controllers/ticketPurchaseController');
const { protect } = require('../middleware/authMiddleware');

// Purchase tickets
router.post('/purchase', protect, ticketPurchaseController.purchaseTickets);

// Get user's ticket purchases
router.get('/my-purchases', protect, ticketPurchaseController.getUserTicketPurchases);

// Get tickets for an event (organizer/admin only)
router.get('/event/:eventId', protect, ticketPurchaseController.getEventTickets);

// Get specific ticket purchase - this must come after more specific routes
router.get('/:purchaseId', protect, ticketPurchaseController.getTicketPurchase);

module.exports = router; 