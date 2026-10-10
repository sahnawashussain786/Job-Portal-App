const express = require('express');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);

// Defend against GET requests (e.g. bots, prefetch, malformed clients).
// Login is a state-changing operation and must be POST; responding with a
// clear message is more useful than a generic 404 when something hits this
// endpoint with the wrong method.
router.get('/login', (_req, res) => {
  res.status(405).json({
    success: false,
    message: 'Use POST /api/auth/login to sign in. Send { email, password }.',
  });
});

router.get('/me', protect, ctrl.getMe);
router.patch('/me', protect, ctrl.updateMe);
router.patch('/password', protect, ctrl.changePassword);
router.delete('/me', protect, ctrl.deleteMe);

module.exports = router;
