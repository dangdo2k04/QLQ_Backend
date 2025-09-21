const express = require('express');
const { getAdminDashboardStats, getDailyRevenue } = require('../controllers/adminController'); 
const { protect, authorize } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/dashboard', protect, authorize('admin'), getAdminDashboardStats);
router.get('/dashboard/daily-revenue', protect, authorize('admin'), getDailyRevenue);

module.exports = router;