const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 30, // minutes
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'in-person', 'phone'],
    default: 'video'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'urgent'],
    default: 'scheduled'
  },
  reason: {
    type: String,
    required: true
  },
  notes: {
    type: String
  },
  prescription: {
    medicines: [{
      name: String,
      dosage: String,
      duration: String,
      instructions: String
    }],
    instructions: String,
    issuedAt: Date
  },
  followUp: {
    recommended: {
      type: Boolean,
      default: false
    },
    date: Date
  },
  fee: {
    amount: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentMethod: String,
    paymentDate: Date
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
appointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
appointmentSchema.index({ userId: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1 });

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment; 