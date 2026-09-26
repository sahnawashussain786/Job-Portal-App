const express = require('express');
const ctrl = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');
const { uploadImage, uploadResume } = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/config', protect, ctrl.getUploadConfig);

// `uploadImage.single('file')` must run before the controller so req.file exists.
router.post('/image', protect, uploadLimiter, uploadImage.single('file'), ctrl.uploadImage);
router.post('/resume', protect, authorize('jobseeker'), uploadLimiter, uploadResume.single('file'), ctrl.uploadResume);
router.delete('/resume', protect, ctrl.deleteResume);

module.exports = router;
