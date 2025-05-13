const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const VenueHost = require('../models/VenueHost');
const { authenticate, authorizeUserType } = require('../middleware/authMiddleware');
const { uploadProfileImage, processProfileImage } = require('../middleware/uploadMiddleware');

/**
 * @route   GET /api/venue-host/profile
 * @desc    Get venue host profile
 * @access  Private (venue-host only)
 */
router.get('/profile', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    // req.user is already set by the authenticate middleware
    // and has been verified to be a venue-host by authorizeUserType
    
    // Return the venue host data without sensitive information
    return res.status(200).json({
      success: true,
      data: {
        venueHost: req.user
      }
    });
  } catch (error) {
    console.error('Error fetching venue host profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/venue-host/profile
 * @desc    Update venue host profile
 * @access  Private (venue-host only)
 */
router.put('/profile', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
  try {
    const allowedUpdates = [
      'name', 'phone', 'venueName', 'venueType', 'venueLocation', 
      'description', 'website', 'logo', 'coverImage', 'businessAddress'
    ];
    
    // Filter out fields that shouldn't be updated
    const updates = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = value;
      }
    }
    
    // Update the venue host profile
    const updatedVenueHost = await VenueHost.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!updatedVenueHost) {
      return res.status(404).json({
        success: false,
        message: 'Venue host not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        venueHost: updatedVenueHost
      }
    });
  } catch (error) {
    console.error('Error updating venue host profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/venue-host/profile/update-image
 * @desc    Update venue host profile image
 * @access  Private (venue-host only)
 */
router.put('/profile/update-image', 
  authenticate, 
  authorizeUserType(['venue-host']), 
  uploadProfileImage,
  processProfileImage,
  async (req, res) => {
    try {
      if (!req.profileImageUrl) {
        return res.status(400).json({
          success: false,
          message: 'No profile image was uploaded'
        });
      }
      
      // Update the venue host profile with the new image URL
      const updatedVenueHost = await VenueHost.findByIdAndUpdate(
        req.user._id,
        { $set: { profileImage: req.profileImageUrl } },
        { new: true, runValidators: true }
      );
      
      if (!updatedVenueHost) {
        return res.status(404).json({
          success: false,
          message: 'Venue host not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          profileImage: updatedVenueHost.profileImage
        }
      });
    } catch (error) {
      console.error('Error updating profile image:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
});

module.exports = router; 