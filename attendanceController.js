const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const User = require('../models/User');

// Maximum allowed distance in meters
const MAX_ALLOWED_DISTANCE = 50; // 50 meters

// @desc    Create a new attendance session
// @route   POST /api/attendance/sessions
// @access  Private/Teacher
exports.createSession = async (req, res) => {
  try {
    const { 
      subject, 
      location, 
      durationMinutes = 60, // Default 1 hour
      radius = 5 // Default 5 meters
    } = req.body;
    
    if (!location || !location.coordinates) {
      return res.status(400).json({ message: 'Location with coordinates is required' });
    }
    
    // Generate a unique session code
    const sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const session = new AttendanceSession({
      teacher: req.user.id,
      subject,
      sessionCode,
      expiresAt: new Date(Date.now() + durationMinutes * 60 * 1000),
      location: {
        type: 'Point',
        coordinates: [
          parseFloat(location.coordinates[0]), // longitude
          parseFloat(location.coordinates[1])  // latitude
        ],
        name: location.name || 'Class Location',
        radius: Math.min(parseInt(radius) || 5, 100) // Cap at 100m
      }
    });

    await session.save();

    // Create QR code data
    const qrData = {
      sessionId: session._id,
      sessionCode: session.sessionCode,
      subject: session.subject,
      expiresAt: session.expiresAt,
      location: session.location,
      timestamp: Date.now()
    };

    // Generate QR code as data URL
    const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), { 
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 1,
      scale: 8
    });

    // Prepare response
    const response = {
      success: true,
      session: {
        _id: session._id,
        subject: session.subject,
        sessionCode: session.sessionCode,
        expiresAt: session.expiresAt,
        location: session.location
      },
      qrCode: qrCode,
      qrData: qrData
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to create attendance session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Mark attendance for a student
// @route   POST /api/attendance/mark
// @access  Private/Student
exports.markAttendance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { sessionId, sessionCode, location } = req.body;
    const studentId = req.user.id;
    
    if (!location || !location.coordinates) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Location data is required'
      });
    }
    
    // Find the session
    const sessionQuery = sessionId 
      ? { _id: sessionId }
      : { sessionCode, status: 'active', expiresAt: { $gt: new Date() } };
      
    const attendanceSession = await AttendanceSession.findOne(sessionQuery).session(session);
    
    if (!attendanceSession) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Session not found or expired'
      });
    }
    
    // Check if student has already marked attendance
    const existingRecord = await AttendanceRecord.findOne({
      session: attendanceSession._id,
      student: studentId
    }).session(session);
    
    if (existingRecord) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this session'
      });
    }
    
    // Verify location
    const studentCoords = [
      parseFloat(location.coordinates[0]), // longitude
      parseFloat(location.coordinates[1])  // latitude
    ];
    
    const isWithinRadius = attendanceSession.isLocationWithinRadius(studentCoords);
    const distance = calculateDistance(
      attendanceSession.location.coordinates[1], // lat1
      attendanceSession.location.coordinates[0], // lon1
      studentCoords[1], // lat2
      studentCoords[0]  // lon2
    );
    
    // Create attendance record
    const attendanceRecord = new AttendanceRecord({
      student: studentId,
      session: attendanceSession._id,
      location: {
        type: 'Point',
        coordinates: studentCoords,
        name: 'Student Location',
        accuracy: location.accuracy || 0,
        distance: Math.round(distance * 100) / 100 // Round to 2 decimal places
      },
      status: isWithinRadius ? 'present' : 'out_of_range',
      verified: isWithinRadius,
      deviceInfo: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        platform: req.useragent?.platform,
        os: req.useragent?.os,
        browser: req.useragent?.browser
      }
    });
    
    await attendanceRecord.save({ session });
    
    // Update session stats if needed
    await AttendanceSession.updateOne(
      { _id: attendanceSession._id },
      { $inc: { attendanceCount: 1 } },
      { session }
    );
    
    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      data: {
        attendance: attendanceRecord,
        session: attendanceSession,
        isLocationVerified: isWithinRadius,
        distance: Math.round(distance * 100) / 100,
        maxAllowedDistance: attendanceSession.location.radius || 5
      },
      message: isWithinRadius 
        ? 'Attendance marked successfully!' 
        : 'You are not within the allowed distance to mark attendance'
    });
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    
    console.error('Mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get attendance records for a session
// @route   GET /api/attendance/sessions/:sessionId/records
// @access  Private/Teacher
exports.getSessionRecords = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // Verify the session belongs to the teacher
    const session = await AttendanceSession.findOne({
      _id: sessionId,
      teacher: req.user.id
    });
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or access denied'
      });
    }
    
    // Get all attendance records for this session
    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('student', 'name email rollNumber')
      .sort({ markedAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        session,
        records,
        total: records.length
      }
    });
    
  } catch (error) {
    console.error('Get session records error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get session records',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all sessions for a teacher
// @route   GET /api/attendance/teacher/sessions
// @access  Private/Teacher
exports.getTeacherSessions = async (req, res) => {
  try {
    const { status = 'active' } = req.query;
    const query = { teacher: req.user.id };
    
    if (status === 'active') {
      query.status = 'active';
      query.expiresAt = { $gt: new Date() };
    } else if (status === 'past') {
      query.$or = [
        { status: 'ended' },
        { expiresAt: { $lte: new Date() } }
      ];
    }
    
    const sessions = await AttendanceSession.find(query)
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.status(200).json({
      success: true,
      data: sessions,
      count: sessions.length
    });
    
  } catch (error) {
    console.error('Get teacher sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get teacher sessions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/history
// @access  Private/Student
exports.getStudentHistory = async (req, res) => {
  try {
    const { startDate, endDate, subject } = req.query;
    const query = { student: req.user.id };
    
    // Add date range filter if provided
    if (startDate || endDate) {
      query.markedAt = {};
      if (startDate) query.markedAt.$gte = new Date(startDate);
      if (endDate) query.markedAt.$lte = new Date(endDate);
    }
    
    // Add subject filter if provided
    if (subject) {
      const sessions = await AttendanceSession.find({
        subject: new RegExp(subject, 'i')
      }).select('_id');
      
      query.session = { $in: sessions.map(s => s._id) };
    }
    
    const records = await AttendanceRecord.find(query)
      .populate({
        path: 'session',
        select: 'subject sessionCode expiresAt',
        populate: {
          path: 'teacher',
          select: 'name email'
        }
      })
      .sort({ markedAt: -1 });
    
    res.status(200).json({
      success: true,
      data: records,
      count: records.length
    });
    
  } catch (error) {
    console.error('Get student history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180; // Convert to radians
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}
// @route   GET /api/attendance/sessions/:sessionId/records
// @access  Private/Teacher
exports.getSessionRecords = async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify the session belongs to the teacher
    const session = await AttendanceSession.findOne({
      _id: sessionId,
      teacher: req.user.id
    });

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    const records = await AttendanceRecord.find({ session: sessionId })
      .populate('student', 'name email studentId')
      .sort({ markedAt: -1 });

    res.json({
      session,
      records,
      total: records.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sessions for a teacher
// @route   GET /api/attendance/sessions/teacher
// @access  Private/Teacher
exports.getTeacherSessions = async (req, res) => {
  try {
    const sessions = await AttendanceSession.find({ teacher: req.user.id })
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance history for a student
// @route   GET /api/attendance/student/history
// @access  Private/Student
exports.getStudentHistory = async (req, res) => {
  try {
    const records = await AttendanceRecord.find({ student: req.user.id })
      .populate('session', 'subject createdAt expiresAt')
      .sort({ markedAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate distance between two points in meters (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
