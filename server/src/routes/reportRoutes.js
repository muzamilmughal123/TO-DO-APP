const express = require('express');
const { exportTasksCSV, getAnalytics } = require('../controllers/reportController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/export/csv', verifyToken, authorizeRoles('admin', 'manager'), exportTasksCSV);
router.get('/analytics', verifyToken, getAnalytics);

module.exports = router;
