const express = require('express');
const ctrl = require('../controllers/jobController');
const { protect, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// --- Static paths first: Express matches in order, so `/saved` would otherwise
// --- be swallowed by the `/:id` route below.
router.get('/meta/filters', ctrl.getFilterMeta);
router.get('/featured', ctrl.getFeaturedJobs);
router.get('/saved', protect, ctrl.getSavedJobs);
router.get('/employer/mine', protect, authorize('employer', 'admin'), ctrl.getMyJobs);
router.get('/employer/stats', protect, authorize('employer', 'admin'), ctrl.getEmployerStats);

// Public listing & detail (optionalAuth adds isSaved/hasApplied for signed-in users).
router.get('/', optionalAuth, ctrl.listJobs);
router.get('/:id', optionalAuth, ctrl.getJob);

// Employer/admin mutations.
router.post('/', protect, authorize('employer', 'admin'), ctrl.createJob);
router.patch('/:id', protect, authorize('employer', 'admin'), ctrl.updateJob);
router.delete('/:id', protect, authorize('employer', 'admin'), ctrl.deleteJob);

// Saved jobs toggle (jobseekers primarily, but harmless for any signed-in user).
router.post('/:id/save', protect, ctrl.toggleSaveJob);

module.exports = router;
