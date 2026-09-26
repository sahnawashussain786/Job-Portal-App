const express = require('express');
const { apiLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.use(apiLimiter);

// Liveness probe — also useful to confirm a Vercel deploy picked up env vars.
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', require('./authRoutes'));
router.use('/jobs', require('./jobRoutes'));
router.use('/applications', require('./applicationRoutes'));
router.use('/companies', require('./companyRoutes'));
router.use('/uploads', require('./uploadRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
