const mongoose = require('mongoose');

const RoomTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  venue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Venue',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  capacity: {
    type: Number,
    required: true
  },
  pricePerNight: {
    currency: { type: String, default: 'LKR' },
    amount: Number
  },
  amenities: [{
    type: String,
    trim: true
  }],
  images: [{
    url: String,
    public_id: String,
    caption: String,
    isMain: { type: Boolean, default: false }
  }],
  totalRooms: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { collection: 'roomTypes' });

// Update the updatedAt timestamp on every save
RoomTypeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const RoomType = mongoose.model('RoomType', RoomTypeSchema);

module.exports = RoomType; 