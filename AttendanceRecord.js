const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point']
    },
    coordinates: [Number], // [longitude, latitude]
    name: String,
    accuracy: Number, // Accuracy of the location in meters
    distance: Number  // Distance from session location in meters
  },
  status: {
    type: String,
    enum: ['present', 'late', 'absent', 'out_of_range'],
    default: 'present'
  },
  verified: {
    type: Boolean,
    default: false
  },
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    platform: String,
    os: String,
    browser: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to prevent duplicate attendance
attendanceRecordSchema.index({ student: 1, session: 1 }, { unique: true });

// Indexes for faster lookups
attendanceRecordSchema.index({ session: 1, student: 1 });
attendanceRecordSchema.index({ student: 1, markedAt: -1 });
attendanceRecordSchema.index({ 'location.coordinates': '2dsphere' });

// Virtual for student details
attendanceRecordSchema.virtual('studentDetails', {
  ref: 'User',
  localField: 'student',
  foreignField: '_id',
  justOne: true
});

// Virtual for session details
attendanceRecordSchema.virtual('sessionDetails', {
  ref: 'AttendanceSession',
  localField: 'session',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included in toObject and toJSON
attendanceRecordSchema.set('toObject', { virtuals: true });
attendanceRecordSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
