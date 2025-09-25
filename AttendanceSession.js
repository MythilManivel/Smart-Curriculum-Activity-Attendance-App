const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  sessionCode: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number], // [longitude, latitude]
    name: String,
    radius: {
      type: Number,
      default: 5, // 5 meters radius
      min: 1,
      max: 100
    }
  },
  status: {
    type: String,
    enum: ['active', 'ended'],
    default: 'active'
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add method to check if location is within radius
attendanceSessionSchema.methods.isLocationWithinRadius = function(coordinates) {
  if (!this.location || !this.location.coordinates) return false;
  
  const [longitude, latitude] = coordinates;
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (this.location.coordinates[1] * Math.PI) / 180;
  const φ2 = (latitude * Math.PI) / 180;
  const Δφ = ((latitude - this.location.coordinates[1]) * Math.PI) / 180;
  const Δλ = ((longitude - this.location.coordinates[0]) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // in meters
  
  return distance <= (this.location.radius || 5); // Default to 5m if radius not set
};

// Index for geospatial queries
attendanceSessionSchema.index({ location: '2dsphere' });
// Index for session code for faster lookups
attendanceSessionSchema.index({ sessionCode: 1 }, { unique: true });
// Index for active sessions
attendanceSessionSchema.index({ status: 1, expiresAt: 1 });

// Middleware to update status based on expiration
attendanceSessionSchema.pre('save', function(next) {
  if (this.isModified('expiresAt') && new Date() > this.expiresAt) {
    this.status = 'ended';
  }
  next();
});

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
