const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Venue = require('../models/Venue');
const { authenticate, authorizeUserType } = require('../middleware/authMiddleware');

/**
 * @route   POST /api/venues
 * @desc    Create a new venue
 * @access  Private (venue-host only)
 */
router.post('/', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    const venueData = {
      ...req.body,
      venueHost: req.user._id // Associate the venue with the current venue host
    };
    
    const venue = await Venue.create(venueData);
    
    return res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: {
        venue
      }
    });
  } catch (error) {
    console.error('Error creating venue:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/venues
 * @desc    Get all public venues
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    // Get all active venues
    const venues = await Venue.find({ isActive: true });
    
    return res.status(200).json({
      success: true,
      data: {
        venues
      }
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/venues/my-venues
 * @desc    Get all venues for the current venue host
 * @access  Private (venue-host only)
 */
router.get('/my-venues', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    const venues = await Venue.find({ venueHost: req.user._id });
    
    return res.status(200).json({
      success: true,
      data: {
        venues
      }
    });
  } catch (error) {
    console.error('Error fetching venues:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/venues/:id
 * @desc    Get a venue by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: {
        venue
      }
    });
  } catch (error) {
    console.error('Error fetching venue:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/venues/:id
 * @desc    Update a venue
 * @access  Private (venue-host only)
 */
router.put('/:id', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Check if the venue belongs to the current venue host
    if (venue.venueHost.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this venue'
      });
    }
    
    // Update the venue
    const updatedVenue = await Venue.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    return res.status(200).json({
      success: true,
      message: 'Venue updated successfully',
      data: {
        venue: updatedVenue
      }
    });
  } catch (error) {
    console.error('Error updating venue:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/venues/:id
 * @desc    Delete a venue
 * @access  Private (venue-host only)
 */
router.delete('/:id', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Check if the venue belongs to the current venue host
    if (venue.venueHost.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this venue'
      });
    }
    
    // Delete the venue
    await Venue.findByIdAndDelete(req.params.id);
    
    return res.status(200).json({
      success: true,
      message: 'Venue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting venue:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 