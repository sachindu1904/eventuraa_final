const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Venue = require('../models/Venue');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const { authenticate, authorizeUserType } = require('../middleware/authMiddleware');
const { uploadVenueImages, processVenueImages } = require('../middleware/uploadMiddleware');

/**
 * @route   POST /api/venues
 * @desc    Create a new venue
 * @access  Private (venue-host only)
 */
router.post('/', authenticate, authorizeUserType(['venue-host']), uploadVenueImages, processVenueImages, async (req, res) => {
  try {
    // Extract venue data, excluding roomTypes and roomTypesJSON
    const { roomTypes, roomTypesJSON, ...venueData } = req.body;
    
    // Add venue host and images
    venueData.venueHost = req.user._id;
    
    // Add images if they exist
    if (req.processedVenueImages && req.processedVenueImages.length > 0) {
      venueData.images = req.processedVenueImages;
    }
    
    // Log the full request body for debugging
    console.log('Full request body keys:', Object.keys(req.body));
    
    // Create venue first (without transactions)
    console.log('Creating venue with data:', JSON.stringify(venueData, null, 2));
    const venue = await Venue.create(venueData);
    const venueId = venue._id;
    console.log('Created venue:', venueId);
    
    // Process room types if they exist
    let createdRoomTypes = [];
    let roomTypesArray = [];
    
    // First try to parse roomTypesJSON if available
    if (roomTypesJSON) {
      try {
        console.log('Parsing roomTypesJSON:', roomTypesJSON);
        const parsed = JSON.parse(roomTypesJSON);
        if (Array.isArray(parsed) && parsed.length > 0) {
          roomTypesArray = parsed;
          console.log(`Parsed ${roomTypesArray.length} room types from roomTypesJSON`);
        }
      } catch (e) {
        console.error('Failed to parse roomTypesJSON:', e);
      }
    }
    
    // If no room types from JSON, try to extract from form data
    if (roomTypesArray.length === 0) {
      // Check the req.body for roomTypes data with array indices
      const roomTypeIndices = new Set();
      for (const key in req.body) {
        if (key.startsWith('roomTypes[') && key.includes('][')) {
          const match = key.match(/roomTypes\[(\d+)\]/);
          if (match && match[1]) {
            roomTypeIndices.add(parseInt(match[1]));
          }
        }
      }
      
      if (roomTypeIndices.size > 0) {
        console.log(`Found ${roomTypeIndices.size} room types in request body with format roomTypes[n][field]`);
        
        roomTypesArray = Array.from(roomTypeIndices).map(index => {
          const roomType = {};
          
          // Extract all properties for this room type
          for (const key in req.body) {
            const match = key.match(new RegExp(`roomTypes\\[${index}\\]\\[(.+)\\]`));
            if (match && match[1]) {
              const prop = match[1];
              roomType[prop] = req.body[key];
            }
          }
          
          return roomType;
        });
      }
    }
    
    // Process extracted room types
    if (roomTypesArray.length > 0) {
      console.log(`Processing ${roomTypesArray.length} room types`);
      
      for (let i = 0; i < roomTypesArray.length; i++) {
        const roomTypeData = roomTypesArray[i];
        console.log(`Processing room type ${i}:`, roomTypeData);
        
        try {
          // Skip if required fields are missing
          if (!roomTypeData.name || !roomTypeData.capacity || !roomTypeData.totalRooms) {
            console.warn(`Skipping room type ${i} due to missing required fields`);
            continue;
          }
          
          // Get images for this room type
          const roomTypeImages = req.processedRoomTypeImages ? 
            req.processedRoomTypeImages.filter(img => img.roomTypeIndex === i) : [];
          
          console.log(`Found ${roomTypeImages.length} images for room type ${i}`);
          
          // Format amenities array
          let amenities = [];
          if (roomTypeData.amenities) {
            if (Array.isArray(roomTypeData.amenities)) {
              amenities = roomTypeData.amenities;
            } else if (typeof roomTypeData.amenities === 'string') {
              amenities = roomTypeData.amenities.split(',').map(item => item.trim());
            }
          }
          
          // Create room type
          const roomTypeObj = {
            name: roomTypeData.name,
            venue: venueId,
            description: roomTypeData.description || '',
            capacity: parseInt(roomTypeData.capacity) || 1,
            pricePerNight: {
              currency: 'LKR',
              amount: parseInt(roomTypeData.pricePerNight) || 0
            },
            amenities: amenities,
            totalRooms: parseInt(roomTypeData.totalRooms) || 0,
            // Find images for this room type - match by index
            images: roomTypeImages.map(img => ({
              url: img.url,
              public_id: img.public_id,
              caption: '',
              isMain: false
            }))
          };
          
          const roomType = await RoomType.create(roomTypeObj);
          const roomTypeId = roomType._id;
          console.log(`Created room type: ${roomTypeId}`);
          createdRoomTypes.push(roomType);
          
          // Create individual rooms based on totalRooms
          const totalRooms = parseInt(roomTypeData.totalRooms) || 0;
          const roomsToCreate = [];
          
          for (let j = 1; j <= totalRooms; j++) {
            roomsToCreate.push({
              roomNumber: `${roomTypeData.name.substring(0, 3).toUpperCase()}-${j.toString().padStart(3, '0')}`,
              roomType: roomTypeId,
              status: 'available'
            });
          }
          
          if (roomsToCreate.length > 0) {
            const rooms = await Room.create(roomsToCreate);
            console.log(`Created ${rooms.length} rooms for room type ${roomTypeId}`);
          }
        } catch (roomTypeError) {
          console.error(`Error creating room type ${i}:`, roomTypeError);
          // Continue with other room types even if one fails
        }
      }
    } else {
      console.log('No room types data received or processed');
    }
    
    return res.status(201).json({
      success: true,
      message: 'Venue created successfully with room types and rooms',
      data: {
        venue: venue,
        roomTypes: createdRoomTypes
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
    // Get all active and approved venues
    const venues = await Venue.find({ 
      isActive: true,
      approvalStatus: 'approved'
    });
    
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
    // Find the venue
    const venue = await Venue.findById(req.params.id);
    
    if (!venue) {
      return res.status(404).json({
        success: false,
        message: 'Venue not found'
      });
    }
    
    // Get room types associated with this venue
    const roomTypes = await RoomType.find({ venue: req.params.id });
    
    // Get room details for each room type
    const roomTypesWithRooms = await Promise.all(
      roomTypes.map(async (roomType) => {
        // Count available rooms
        const availableRoomsCount = await Room.countDocuments({ 
          roomType: roomType._id,
          status: 'available'
        });
        
        // Return room type data with available count
        return {
          ...roomType.toObject(),
          availableRooms: availableRoomsCount
        };
      })
    );
    
    return res.status(200).json({
      success: true,
      data: {
        venue,
        roomTypes: roomTypesWithRooms
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

/**
 * @route   POST /api/venues/:id/images
 * @desc    Add images to an existing venue
 * @access  Private (venue-host only)
 */
router.post('/:id/images', authenticate, authorizeUserType(['venue-host']), uploadVenueImages, processVenueImages, async (req, res) => {
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
    
    // Add new images if they exist
    if (req.processedVenueImages && req.processedVenueImages.length > 0) {
      // Update venue with new images
      const updatedVenue = await Venue.findByIdAndUpdate(
        req.params.id,
        { $push: { images: { $each: req.processedVenueImages } } },
        { new: true, runValidators: true }
      );
      
      return res.status(200).json({
        success: true,
        message: 'Venue images added successfully',
        data: {
          venue: updatedVenue
        }
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No images were uploaded'
      });
    }
  } catch (error) {
    console.error('Error adding venue images:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/venues/:id/images/:imageId
 * @desc    Delete a venue image
 * @access  Private (venue-host only)
 */
router.delete('/:id/images/:imageId', authenticate, authorizeUserType(['venue-host']), async (req, res) => {
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
    
    // Find the image to delete
    const imageToDelete = venue.images.id(req.params.imageId);
    
    if (!imageToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Delete the image from Cloudinary if it has a public_id
    if (imageToDelete.public_id) {
      try {
        const { cloudinary } = require('../config/cloudinary');
        await cloudinary.uploader.destroy(imageToDelete.public_id);
        console.log(`Deleted image from Cloudinary: ${imageToDelete.public_id}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with the process even if Cloudinary delete fails
      }
    }
    
    // Remove the image from the venue
    venue.images = venue.images.filter(image => image._id.toString() !== req.params.imageId);
    await venue.save();
    
    return res.status(200).json({
      success: true,
      message: 'Venue image deleted successfully',
      data: {
        venue
      }
    });
  } catch (error) {
    console.error('Error deleting venue image:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 