const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { calculateDistance } = require('../utils/geolocation');
const institution = require('../config/institution');

// @desc    Faculty login with location verification
// @route   POST /api/auth/faculty/login
// @access  Public
exports.facultyLogin = async (req, res) => {
  try {
    const { email, password, location } = req.body;

    // Check if user exists and is a teacher
    const user = await User.findOne({ email, role: 'teacher' });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify location is provided
    if (!location || !location.coordinates || location.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: 'Location data is required for faculty login',
        code: 'LOCATION_REQUIRED'
      });
    }

    // Get institution location from config
    const [institutionLng, institutionLat] = institution.location.coordinates;
    const maxDistance = institution.location.maxDistance;

    // Calculate distance from institution
    const distance = calculateDistance(
      location.coordinates[1], // latitude
      location.coordinates[0], // longitude
      institutionLat,
      institutionLng
    );

    if (distance > maxDistance) {
      return res.status(403).json({
        success: false,
        message: `You are ${Math.round(distance)}m away from the institution. ` +
                `Maximum allowed distance is ${institutionLocation.maxDistance}m.`,
        distance: Math.round(distance),
        code: 'LOCATION_OUT_OF_RANGE'
      });
    }

    // Update user's last known location and last login time
    user.lastLocation = {
      type: 'Point',
      coordinates: location.coordinates,
      timestamp: new Date(),
      accuracy: location.accuracy || 0
    };
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department
      },
      locationVerified: !!location
    });

  } catch (error) {
    console.error('Faculty login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get faculty profile with location history
// @route   GET /api/faculty/profile
// @access  Private/Faculty
exports.getFacultyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('department', 'name');

    if (!user || user.role !== 'faculty') {
      return res.status(404).json({
        success: false,
        message: 'Faculty profile not found'
      });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        lastLogin: user.lastLogin,
        lastLocation: user.lastLocation
      }
    });
  } catch (error) {
    console.error('Get faculty profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};
