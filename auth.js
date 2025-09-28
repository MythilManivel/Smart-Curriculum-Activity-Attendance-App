const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getUserProfile, 
  updateUserProfile 
} = require('../controllers/authController');
const { facultyLogin, getFacultyProfile } = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/auth');
const { validateFacultyLogin } = require('../middleware/validators/facultyValidator');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/faculty/login', validateFacultyLogin, facultyLogin);

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Faculty protected routes (using 'teacher' role)
router.get('/faculty/profile', protect, authorize('teacher'), getFacultyProfile);

module.exports = router;
