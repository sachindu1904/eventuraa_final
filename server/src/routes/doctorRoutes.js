const DoctorLocation = require('../models/DoctorLocation');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const router = require('express').Router();
const authMiddleware = require('../middleware/doctorAuthMiddleware');

/**
 * @route   GET /api/doctors/profile
 * @desc    Get the logged in doctor's profile with stats
 * @access  Private (Doctor only)
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // Doctor info is already attached by the middleware
    const doctor = req.doctor;
    
    // Get appointment stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count appointments for today
    const appointmentsToday = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Count urgent appointments for today
    const urgentAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      },
      status: 'urgent'
    });

    // Count unread messages (this is a placeholder - you would implement actual message counter)
    // In a real system, you'd have a messages collection with a read/unread status
    const unreadMessages = 3;

    // Get all active locations for this doctor
    const locations = await DoctorLocation.find({
      doctor: doctor._id,
      isActive: true
    }).sort({ isMainPractice: -1, createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: {
        doctor: {
          ...doctor.toObject(),
          appointmentsToday,
          urgentAppointments,
          unreadMessages,
          locations
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor profile
 * @access  Private (Doctor only)
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    // Doctor info is already attached by the middleware
    const doctor = req.doctor;
    
    const {
      name,
      phone,
      specialty,
      qualifications,
      experience,
      bio,
      languages,
      specializations,
      hospital,
      practices,
      consultationFee
    } = req.body;
    
    // Fields that can be updated
    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (specialty) doctor.specialty = specialty;
    if (experience) doctor.experience = experience;
    if (bio) doctor.bio = bio;
    if (languages) doctor.languages = languages;
    if (specializations) doctor.specializations = specializations;
    if (consultationFee) doctor.consultationFee = consultationFee;
    
    // Handle qualifications
    if (qualifications && Array.isArray(qualifications)) {
      doctor.qualifications = qualifications;
    }
    
    // Handle practices
    if (practices && Array.isArray(practices)) {
      doctor.practices = practices;
    } else if (hospital) {
      // If there's just a hospital field (simplified form), update the first practice or create one
      if (!doctor.practices || doctor.practices.length === 0) {
        doctor.practices = [{
          hospitalName: hospital,
          position: 'Doctor',
          address: {
            city: '',
            country: 'Sri Lanka'
          }
        }];
      } else {
        doctor.practices[0].hospitalName = hospital;
      }
    }
    
    // Save updated doctor
    await doctor.save();
    
    return res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: {
        doctor: doctor.toObject()
      }
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctors/appointments
 * @desc    Get appointments for the logged in doctor
 * @access  Private (Doctor only)
 */
router.get('/appointments', authMiddleware, async (req, res) => {
  try {
    // Doctor info is already attached by the middleware
    const doctorId = req.doctor._id;

    const { status, date, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query conditions
    const conditions = { doctorId };
    
    if (status) {
      conditions.status = status;
    }
    
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(queryDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      conditions.appointmentDate = {
        $gte: queryDate,
        $lt: nextDay
      };
    }

    // Get appointments
    const appointments = await Appointment.find(conditions)
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email profileImage')
      .populate('location', 'practiceName address')
      .lean();

    // Get total count for pagination
    const total = await Appointment.countDocuments(conditions);

    return res.status(200).json({
      success: true,
      data: {
        appointments,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/doctors/locations
 * @desc    Add a doctor's practice location
 * @access  Private (Doctor only)
 */
router.post('/locations', authMiddleware, async (req, res) => {
  try {
    // Doctor info is already attached by the middleware
    const doctorId = req.doctor._id;

    const { 
      name, 
      address, 
      city,
      state,
      zipCode,
      phone,
      coordinates
    } = req.body;

    // Validate required fields
    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Location name, address, and city are required'
      });
    }

    // Create new location
    const doctorLocation = new DoctorLocation({
      doctor: doctorId,
      name,
      address,
      city,
      state: state || '',
      zipCode: zipCode || '',
      phone: phone || '',
      coordinates: coordinates || null,
      isActive: true
    });

    await doctorLocation.save();

    return res.status(200).json({
      success: true,
      message: 'Location added successfully',
      data: doctorLocation
    });
  } catch (error) {
    console.error('Error adding doctor location:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/doctors/locations/:locationId
 * @desc    Update a doctor's practice location
 * @access  Private (Doctor only)
 */
router.put('/locations/:locationId', authMiddleware, async (req, res) => {
  try {
    // Doctor info is already attached by the middleware
    const doctorId = req.doctor._id;
    const { locationId } = req.params;
    
    const { 
      name, 
      address, 
      city,
      state,
      zipCode,
      phone,
      coordinates
    } = req.body;

    // Validate required fields
    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Location name, address, and city are required'
      });
    }

    // Find location and ensure it belongs to this doctor
    const doctorLocation = await DoctorLocation.findOne({
      _id: locationId,
      doctor: doctorId,
      isActive: true
    });

    if (!doctorLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or does not belong to this doctor'
      });
    }

    // Update fields
    doctorLocation.name = name;
    doctorLocation.address = address;
    doctorLocation.city = city;
    doctorLocation.state = state || '';
    doctorLocation.zipCode = zipCode || '';
    doctorLocation.phone = phone || '';
    doctorLocation.coordinates = coordinates || doctorLocation.coordinates;

    await doctorLocation.save();

    return res.status(200).json({
      success: true,
      message: 'Location updated successfully',
      data: doctorLocation
    });
  } catch (error) {
    console.error('Error updating doctor location:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctors/locations
 * @desc    Get all locations for a doctor
 * @access  Private (Doctor only)
 */
router.get('/locations', authMiddleware, async (req, res) => {
  try {
    // Doctor info is already attached by the middleware
    const doctorId = req.doctor._id;

    const locations = await DoctorLocation.find({ 
      doctor: doctorId,
      isActive: true
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching doctor locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/doctors/locations/:locationId
 * @desc    Delete (deactivate) a doctor's practice location
 * @access  Private (Doctor only)
 */
router.delete('/locations/:locationId', authMiddleware, async (req, res) => {
  try {
    // Doctor info is already attached by the middleware
    const doctorId = req.doctor._id;
    const { locationId } = req.params;

    // Find location and ensure it belongs to this doctor
    const doctorLocation = await DoctorLocation.findOne({
      _id: locationId,
      doctor: doctorId
    });

    if (!doctorLocation) {
      return res.status(404).json({
        success: false,
        message: 'Location not found or does not belong to this doctor'
      });
    }

    // Soft delete by marking as inactive
    doctorLocation.isActive = false;
    await doctorLocation.save();

    return res.status(200).json({
      success: true,
      message: 'Location deleted successfully',
      data: {
        locationId
      }
    });
  } catch (error) {
    console.error('Error deleting doctor location:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/doctors/:id/locations
 * @desc    Get public locations for a specific doctor
 * @access  Public
 */
router.get('/:id/locations', async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Get all active locations for this doctor
    const locations = await DoctorLocation.find({
      doctor: doctorId,
      isActive: true
    }).sort({ isMainPractice: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        locations
      }
    });
  } catch (error) {
    console.error('Error fetching doctor locations:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Public endpoint to find nearest doctors
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 50 } = req.query; // Default to 50km radius or show all
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    // Find all active doctors
    const doctors = await Doctor.find({ isActive: true });
    
    // Filter doctors by distance and calculate distance for each location
    const nearbyDoctors = [];
    
    for (const doctor of doctors) {
      // Get all active locations for this doctor
      const doctorLocations = await DoctorLocation.find({ 
        doctor: doctor._id, 
        isActive: true,
        coordinates: { $exists: true, $ne: null }
      });
      
      const nearbyLocations = doctorLocations
        .map(location => {
          if (!location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
            return null;
          }
          
          // Calculate distance using Haversine formula
          const distance = calculateDistance(
            latitude, longitude,
            location.coordinates.lat, location.coordinates.lng
          );
          
          // Only include locations within search radius (or all if radius is large)
          if (distance <= searchRadius) {
            return {
              ...location.toObject(),
              distance: distance
            };
          }
          return null;
        })
        .filter(location => location !== null)
        .sort((a, b) => a.distance - b.distance);
      
      if (nearbyLocations.length > 0) {
        nearbyDoctors.push({
          ...doctor.toObject(),
          locations: nearbyLocations,
          nearestDistance: nearbyLocations[0].distance
        });
      }
    }
    
    // Sort doctors by nearest location
    nearbyDoctors.sort((a, b) => a.nearestDistance - b.nearestDistance);
    
    res.status(200).json({
      success: true,
      data: {
        doctors: nearbyDoctors,
        searchRadius: searchRadius,
        searchCenter: { lat: latitude, lng: longitude },
        totalFound: nearbyDoctors.length
      }
    });
  } catch (error) {
    console.error('Error finding nearby doctors:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby doctors'
    });
  }
});

// Utility function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

/**
 * @route   POST /api/doctors/:doctorId/appointments
 * @desc    Book an appointment with a doctor
 * @access  Public (can be used by authenticated or non-authenticated users)
 */
router.post('/:doctorId/appointments', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const {
      patientName,
      patientContact,
      appointmentDate,
      appointmentTime,
      type,
      reason,
      locationId,
      userId
    } = req.body;

    // Validate required fields
    if (!patientName || !patientContact || !appointmentDate || !appointmentTime || !type || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Missing required appointment information'
      });
    }

    // Validate contact info
    if (!patientContact.email && !patientContact.phone) {
      return res.status(400).json({
        success: false,
        message: 'At least one contact method (email or phone) is required'
      });
    }

    // Validate appointment type
    const validTypes = ['in-person', 'video', 'phone'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment type. Must be in-person, video, or phone'
      });
    }

    // Check if doctor exists and is active
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!doctor.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is currently not accepting appointments'
      });
    }

    // Validate location if provided (for in-person appointments)
    let location = null;
    if (locationId) {
      location = await DoctorLocation.findOne({
        _id: locationId,
        doctor: doctorId,
        isActive: true
      });
      
      if (!location) {
        return res.status(404).json({
          success: false,
          message: 'Invalid location for this doctor'
        });
      }
    }

    // Parse and validate appointment date
    const appointmentDateTime = new Date(appointmentDate);
    if (isNaN(appointmentDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date format'
      });
    }

    // Check if appointment date is in the future
    const now = new Date();
    if (appointmentDateTime < now) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Check for conflicting appointments (same doctor, date, and time)
    const existingAppointment = await Appointment.findOne({
      doctorId: doctorId,
      appointmentDate: appointmentDateTime,
      appointmentTime: appointmentTime,
      status: { $nin: ['cancelled', 'no-show'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please choose a different time.'
      });
    }

    // Create the appointment
    const newAppointment = new Appointment({
      doctorId: doctorId,
      userId: userId || null, // Optional - can be null for non-registered users
      patientName: patientName,
      patientContact: {
        email: patientContact.email || null,
        phone: patientContact.phone || null
      },
      appointmentDate: appointmentDateTime,
      appointmentTime: appointmentTime,
      status: 'scheduled',
      type: type,
      reason: reason,
      location: locationId || null,
      fee: {
        amount: doctor.consultationFee?.amount || 0,
        currency: doctor.consultationFee?.currency || 'LKR',
        isPaid: false
      }
    });

    // Save the appointment
    await newAppointment.save();

    // Populate the appointment with doctor and location details for response
    const populatedAppointment = await Appointment.findById(newAppointment._id)
      .populate('doctorId', 'name specialty email')
      .populate('location', 'name address city phone');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        appointment: populatedAppointment
      }
    });

  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/doctors/appointments/:id/status
 * @desc    Update appointment status (for doctor's own appointments)
 * @access  Private (Doctor only)
 */
router.patch('/appointments/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;
    const doctorId = req.doctor._id;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    const allowedStatuses = ['scheduled', 'completed', 'cancelled', 'no-show', 'urgent'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctorId
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    appointment.status = status;
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment status',
      error: error.message
    });
  }
});

/**
 * @route   PATCH /api/doctors/appointments/:id/notes
 * @desc    Add notes to an appointment (for doctor's own appointments)
 * @access  Private (Doctor only)
 */
router.patch('/appointments/:id/notes', authMiddleware, async (req, res) => {
  try {
    const { notes } = req.body;
    const appointmentId = req.params.id;
    const doctorId = req.doctor._id;
    
    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required'
      });
    }
    
    const appointment = await Appointment.findOne({
      _id: appointmentId,
      doctorId: doctorId
    });
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    appointment.notes = notes;
    await appointment.save();
    
    res.json({
      success: true,
      message: 'Appointment notes updated successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Error updating appointment notes:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating appointment notes',
      error: error.message
    });
  }
});

module.exports = router; 