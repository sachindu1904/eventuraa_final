const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    trim: true
  },
  roomType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RoomType',
    required: true
  },
  floor: {
    type: Number
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available'
  },
  specialFeatures: [{
    type: String,
    trim: true
  }],
  isAccessible: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  lastMaintenanceDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'rooms' });

// Update the updatedAt timestamp on every save
RoomSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room; 