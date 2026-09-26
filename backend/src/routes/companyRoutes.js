const express = require('express');
const ctrl = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', ctrl.listCompanies);

router.get('/mine', protect, authorize('employer', 'admin'), ctrl.getMyCompany);
router.post('/', protect, authorize('employer', 'admin'), ctrl.createCompany);
router.patch('/mine', protect, authorize('employer', 'admin'), ctrl.updateMyCompany);
router.delete('/mine', protect, authorize('employer', 'admin'), ctrl.deleteMyCompany);

// Keep the catch-all last so it doesn't shadow the paths above.
router.get('/:idOrSlug', ctrl.getCompany);

module.exports = router;
