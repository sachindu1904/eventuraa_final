const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  patientName: {
    type: String,
    required: true
  },
  patientContact: {
    email: String,
    phone: String
  },
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show', 'pending', 'urgent'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['in-person', 'video', 'phone'],
    required: true
  },
  reason: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DoctorLocation'
  },
  followUp: {
    isFollowUp: {
      type: Boolean,
      default: false
    },
    previousAppointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    }
  },
  prescription: {
    medicine: [String],
    instructions: String,
    issuedDate: Date
  },
  fee: {
    amount: Number,
    currency: { type: String, default: 'LKR' },
    isPaid: { type: Boolean, default: false },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'bank_transfer', 'online']
    },
    paymentDate: Date,
    transactionId: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'appointments' });

// Update the updatedAt timestamp on every save
AppointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a text index for searching appointments
AppointmentSchema.index({ 
  patientName: 'text', 
  reason: 'text',
  notes: 'text'
});

const Appointment = mongoose.model('Appointment', AppointmentSchema);

module.exports = Appointment; 