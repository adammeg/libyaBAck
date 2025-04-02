const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth-controllers');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Register route (admin only in production)
router.post('/register', requireAdmin, authController.register);

// Login route
router.post('/login', authController.login);

// Get current user info
router.get('/me', requireAuth, authController.getMe);

module.exports = router; 