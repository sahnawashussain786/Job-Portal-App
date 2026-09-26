const express = require('express');
const ctrl = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Static paths before parameterised ones.
router.get('/mine', protect, ctrl.getMyApplications);
router.get('/stats', protect, ctrl.getApplicantStats);
router.get('/job/:jobId', protect, authorize('employer', 'admin'), ctrl.getJobApplications);

router.post('/:jobId', protect, authorize('jobseeker'), ctrl.applyToJob);
router.post('/:id/withdraw', protect, authorize('jobseeker'), ctrl.withdrawApplication);

router.get('/:id', protect, ctrl.getApplication);
router.patch('/:id/status', protect, authorize('employer', 'admin'), ctrl.updateApplicationStatus);
router.delete('/:id', protect, ctrl.deleteApplication);

module.exports = router;
