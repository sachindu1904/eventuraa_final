const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const auth = require('../middleware/auth');
const doctorAuth = require('../middleware/doctorAuth');

// Get doctor profile
router.get('/profile', auth, async (req, res) => {
  try {
    // Find the doctor associated with the authenticated user
    const doctor = await Doctor.findOne({ userId: req.user.id });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }
    
    // Count today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const appointmentsToday = await Appointment.countDocuments({
      doctorId: doctor._id,
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    // Count urgent appointments
    const urgentAppointments = await Appointment.countDocuments({
      doctorId: doctor._id,
      status: 'urgent'
    });
    
    // This would come from a messaging system in a real app
    // Mocking this value for now
    const unreadMessages = 3;
    
    // Return doctor profile with additional stats
    res.json({
      success: true,
      data: {
        ...doctor.toObject(),
        appointmentsToday,
        urgentAppointments,
        unreadMessages
      }
    });
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching doctor profile',
      error: error.message
    });
  }
});

// Get doctor appointments
router.get('/appointments', auth, doctorAuth, async (req, res) => {
  try {
    const { date, status, limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query
    const query = { doctorId: req.doctor._id };
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      
      query.appointmentDate = {
        $gte: startDate,
        $lt: endDate
      };
    }
    
    // Filter by status if provided
    if (status) {
      query.status = status;
    }
    
    // Get appointments with pagination
    const appointments = await Appointment.find(query)
      .populate('userId', 'name email profileImage')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Count total appointments matching the query
    const total = await Appointment.countDocuments(query);
    
    res.json({
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
    res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// Update appointment status
router.patch('/appointments/:id/status', auth, doctorAuth, async (req, res) => {
  try {
    const { status } = req.body;
    
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
      _id: req.params.id,
      doctorId: req.doctor._id
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

// Add notes to an appointment
router.patch('/appointments/:id/notes', auth, doctorAuth, async (req, res) => {
  try {
    const { notes } = req.body;
    
    if (!notes) {
      return res.status(400).json({
        success: false,
        message: 'Notes are required'
      });
    }
    
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctorId: req.doctor._id
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