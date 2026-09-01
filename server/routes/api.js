const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const appController = require('../controllers/appController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// ----------------------------------------------------
// Auth Routes
// ----------------------------------------------------
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', protect, authController.getMe);

// ----------------------------------------------------
// User Directory (Coordinators)
// ----------------------------------------------------
router.get(
  '/users/staff-parents',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.getStaffAndParents
);
router.post(
  '/users/tutors',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.createTutor
);
router.patch(
  '/users/me/tutor-status',
  protect,
  restrictTo('tutor'),
  appController.updateTutorStatus
);

// ----------------------------------------------------
// Student Routes
// ----------------------------------------------------
router.get('/students', protect, appController.getStudents);
router.post(
  '/students',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.createStudent
);
router.get(
  '/students/:studentId/suggest-tutors',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.suggestTutorsForStudent
);
router.patch(
  '/students/:studentId/assign',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.assignStudent
);
router.patch(
  '/students/:studentId/level',
  protect,
  restrictTo('coordinator', 'school_admin', 'tutor'),
  appController.updateStudentLevels
);

// ----------------------------------------------------
// Tutor Session Logs
// ----------------------------------------------------
router.get('/session-logs', protect, appController.getSessionLogs);
router.post(
  '/session-logs',
  protect,
  restrictTo('tutor'),
  appController.createSessionLog
);

// ----------------------------------------------------
// Consent Form
// ----------------------------------------------------
router.get(
  '/consent/:studentId',
  protect,
  restrictTo('parent'),
  appController.getConsent
);
router.post(
  '/consent',
  protect,
  restrictTo('parent'),
  appController.submitConsent
);

// ----------------------------------------------------
// Parent Weekend Check-in
// ----------------------------------------------------
router.get('/weekend-checkins', protect, appController.getWeekendCheckIns);
router.post(
  '/weekend-checkins',
  protect,
  restrictTo('parent'),
  appController.submitWeekendCheckIn
);

// ----------------------------------------------------
// Session Guides (teaching activities per level)
// ----------------------------------------------------
router.get('/session-guides', protect, appController.getSessionGuides);
router.put(
  '/session-guides/:subject/:level',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.updateSessionGuide
);

// ----------------------------------------------------
// Teaching Materials Library
// ----------------------------------------------------
router.get('/teaching-materials', protect, appController.getTeachingMaterials);
router.post(
  '/teaching-materials',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.createTeachingMaterial
);

// ----------------------------------------------------
// Coordinator Dashboard Stats
// ----------------------------------------------------
router.get(
  '/stats',
  protect,
  restrictTo('coordinator', 'school_admin'),
  appController.getStats
);

module.exports = router;
