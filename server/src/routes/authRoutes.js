const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Specific login routes for different user types
router.post('/login/user', (req, res) => {
  req.body.userType = 'user';
  authController.login(req, res);
});

router.post('/login/doctor', (req, res) => {
  req.body.userType = 'doctor';
  authController.login(req, res);
});

router.post('/login/organizer', (req, res) => {
  req.body.userType = 'organizer';
  authController.login(req, res);
});

router.post('/login/admin', (req, res) => {
  req.body.userType = 'admin';
  authController.login(req, res);
});

router.get('/verify-email/:token', authController.verifyEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

module.exports = router; 