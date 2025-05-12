const express = require('express');
const router = express.Router();
const { authenticate, authorizeUserType } = require('../middleware/authMiddleware');
const { uploadEventImages, processUploadedFiles, handleMulterError } = require('../middleware/uploadMiddleware');
const Organizer = require('../models/Organizer');
const Event = require('../models/Event');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');

/**
 * @route GET /api/organizer/profile
 * @desc Get organizer profile
 * @access Private (Organizer only)
 */
router.get('/profile', authenticate, authorizeUserType(['organizer']), async (req, res) => {
  try {
    // Get organizer from request (set by authenticate middleware)
    const organizer = req.user;

    res.status(200).json({
      success: true,
      message: 'Organizer profile retrieved successfully',
      data: {
        organizer
      }
    });
  } catch (error) {
    console.error('Get organizer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve organizer profile',
      error: error.message
    });
  }
});

/**
 * @route GET /api/organizer/dashboard-stats
 * @desc Get organizer dashboard statistics
 * @access Private (Organizer only)
 */
router.get('/dashboard-stats', authenticate, authorizeUserType(['organizer']), async (req, res) => {
  try {
    const organizerId = req.user._id;

    // Get events for this organizer
    const events = await Event.find({ organizer: organizerId });
    
    // Calculate stats
    const totalEvents = events.length;
    const activeEvents = events.filter(event => 
      new Date(event.date) >= new Date() && event.isActive
    ).length;
    
    // Calculate total attendees and revenue
    let totalAttendees = 0;
    let totalRevenue = 0;
    events.forEach(event => {
      totalAttendees += event.ticketsSold || 0;
      totalRevenue += (event.ticketsSold || 0) * (event.ticketPrice || 0);
    });

    // Get upcoming events
    const upcomingEvents = await Event.find({
      organizer: organizerId,
      date: { $gte: new Date() },
      isActive: true
    })
    .sort({ date: 1 })
    .limit(5)
    .select('_id title date ticketsSold location');

    // For recent activity, you would typically need a separate Activity model
    // but for now we'll just mock up some data based on events
    const recentActivity = events
      .slice(0, 5)
      .map(event => ({
        _id: event._id,
        type: 'event_created',
        description: `Event "${event.title}" was created`,
        date: event.createdAt
      }));

    res.status(200).json({
      success: true,
      message: 'Dashboard stats retrieved successfully',
      data: {
        totalEvents,
        activeEvents,
        totalAttendees,
        totalRevenue,
        upcomingEvents,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard statistics',
      error: error.message
    });
  }
});

/**
 * @route POST /api/organizer/events
 * @desc Create a new event
 * @access Private (Organizer only)
 */
router.post('/events', 
  authenticate, 
  authorizeUserType(['organizer']), 
  uploadEventImages,
  processUploadedFiles,
  async (req, res) => {
    try {
      const organizerId = req.user._id;
      
      console.log('Creating event with data:', {
        title: req.body.title,
        date: req.body.date,
        location: req.body.location ? req.body.location.name : 'N/A',
        category: req.body.category,
        imagesCount: req.processedImages.imageUrls.length,
        hasCoverImage: !!req.processedImages.coverImageUrl
      });
      
      // Ensure category is a string, not an array
      let category = req.body.category;
      if (Array.isArray(category)) {
        console.warn('Category is an array, using first value:', category);
        category = category[0];
      }
      
      // Create event with pending approval status and ensure images is an array
      const eventData = {
        ...req.body,
        category: category,
        organizer: organizerId,
        approvalStatus: 'pending',
        images: req.processedImages.imageUrls || [], // Ensure images is always an array
        coverImage: req.processedImages.coverImageUrl || ''
      };
      
      // Log the actual data being sent to MongoDB
      console.log('Event data being saved:', JSON.stringify({
        title: eventData.title,
        category: eventData.category,
        images: eventData.images,
        coverImage: eventData.coverImage,
      }));
      
      const event = await Event.create(eventData);
      console.log(`Event created with ID: ${event._id}`);
      
      res.status(201).json({
        success: true,
        message: 'Event created successfully and pending approval',
        data: {
          event
        }
      });
    } catch (error) {
      console.error('Create event error:', error);
      
      // Detailed error message for debugging
      let errorDetail = error.message;
      if (error.name === 'ValidationError') {
        errorDetail = Object.values(error.errors)
          .map(e => e.message)
          .join(', ');
      } else if (error.name === 'CastError') {
        errorDetail = `Invalid ${error.path}: ${error.value}`;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create event',
        error: errorDetail
      });
    }
});

/**
 * @route GET /api/organizer/events
 * @desc Get all events for the organizer
 * @access Private (Organizer only)
 */
router.get('/events', authenticate, authorizeUserType(['organizer']), async (req, res) => {
  try {
    const organizerId = req.user._id;
    
    // Get all events for this organizer
    const events = await Event.find({ organizer: organizerId })
      .sort({ createdAt: -1 }); // Most recent first
    
    res.status(200).json({
      success: true,
      message: 'Events retrieved successfully',
      data: {
        events
      }
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve events',
      error: error.message
    });
  }
});

/**
 * @route DELETE /api/organizer/events/:eventId
 * @desc Delete an event
 * @access Private (Organizer only)
 */
router.delete('/events/:eventId', authenticate, authorizeUserType(['organizer']), async (req, res) => {
  try {
    const organizerId = req.user._id;
    const eventId = req.params.eventId;
    
    // First check if the event exists and belongs to this organizer
    const event = await Event.findOne({ _id: eventId, organizer: organizerId });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you do not have permission to delete it'
      });
    }
    
    // Delete the event
    await Event.findByIdAndDelete(eventId);
    
    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: error.message
    });
  }
});

// Configure multer storage for profile pictures
const profilePicStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      const tempDir = path.join(__dirname, '../../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      cb(null, tempDir);
    } catch (err) {
      console.error('Error creating temp directory:', err);
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const fileExt = path.extname(file.originalname);
      const filename = 'profile-' + uniqueSuffix + fileExt;
      cb(null, filename);
    } catch (err) {
      console.error('Error generating filename:', err);
      cb(err);
    }
  }
});

// File filter for images
const imageFileFilter = (req, file, cb) => {
  try {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  } catch (err) {
    cb(err);
  }
};

// Configure profile picture upload middleware
const uploadProfilePic = multer({
  storage: profilePicStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('profilePicture');

// Helper function to upload file to cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    console.log(`Uploading profile picture to Cloudinary: ${filePath}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'eventuraa-profiles',
      use_filename: true
    });
    
    console.log(`Profile picture uploaded: ${result.secure_url}`);
    
    // Remove the local file after upload
    fs.unlinkSync(filePath);
    
    return result.secure_url;
  } catch (error) {
    console.error(`Error uploading to Cloudinary: ${error.message}`);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (unlinkError) {
        console.error(`Failed to clean up temp file: ${unlinkError.message}`);
      }
    }
    throw error;
  }
};

/**
 * @route POST /api/organizer/profile-picture
 * @desc Update organizer profile picture
 * @access Private (Organizer only)
 */
router.post('/profile-picture', authenticate, authorizeUserType(['organizer']), (req, res) => {
  uploadProfilePic(req, res, async (err) => {
    if (err) {
      console.error('Profile picture upload error:', err);
      return res.status(400).json({
        success: false,
        message: 'Failed to upload profile picture',
        error: err.message
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No profile picture provided'
        });
      }
      
      // Upload the file to Cloudinary
      const profilePicUrl = await uploadToCloudinary(req.file.path);
      
      // Update the organizer's logo field with the Cloudinary URL
      const organizerId = req.user._id;
      const updatedOrganizer = await Organizer.findByIdAndUpdate(
        organizerId,
        { logo: profilePicUrl },
        { new: true, runValidators: true }
      );
      
      if (!updatedOrganizer) {
        return res.status(404).json({
          success: false,
          message: 'Organizer not found'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Profile picture updated successfully',
        data: {
          logo: updatedOrganizer.logo
        }
      });
    } catch (error) {
      console.error('Profile picture update error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update profile picture',
        error: error.message
      });
    }
  });
});

module.exports = router; 