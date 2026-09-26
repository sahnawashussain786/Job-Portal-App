const express = require('express');
const ctrl = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);

router.get('/me', protect, ctrl.getMe);
router.patch('/me', protect, ctrl.updateMe);
router.patch('/password', protect, ctrl.changePassword);
router.delete('/me', protect, ctrl.deleteMe);

module.exports = router;
