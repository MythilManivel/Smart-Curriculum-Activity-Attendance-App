const express = require('express');
const router = express.Router();
const { 
  createSession, 
  markAttendance, 
  getSessionRecords,
  getTeacherSessions,
  getStudentHistory
} = require('../controllers/attendanceController');
const { protect, teacher, student } = require('../middleware/auth');

// Teacher routes
router.route('/sessions')
  .post(protect, teacher, createSession)
  .get(protect, teacher, getTeacherSessions);

router.get('/sessions/:sessionId/records', protect, teacher, getSessionRecords);

// Student routes
router.post('/mark', protect, student, markAttendance);
router.get('/student/history', protect, student, getStudentHistory);

module.exports = router;
