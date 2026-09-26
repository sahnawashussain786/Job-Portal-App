const express = require('express');
const ctrl = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Every route here requires an admin — apply the guard once for the whole router.
router.use(protect, authorize('admin'));

router.get('/stats', ctrl.getStats);

router.get('/users', ctrl.listUsers);
router.patch('/users/:id', ctrl.updateUser);
router.delete('/users/:id', ctrl.deleteUser);

router.get('/jobs', ctrl.listAllJobs);
router.patch('/jobs/:id', ctrl.moderateJob);
router.delete('/jobs/:id', ctrl.deleteJobAsAdmin);

module.exports = router;
