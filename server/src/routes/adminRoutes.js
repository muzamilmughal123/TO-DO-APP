const express = require('express');
const { getAllUsers, updateUserRoleAndStatus, getAuditLogs, createUser } = require('../controllers/adminController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.get('/users', verifyToken, authorizeRoles('admin'), getAllUsers);
router.post('/users', verifyToken, authorizeRoles('admin'), createUser);
router.put('/users/:id/role', verifyToken, authorizeRoles('admin'), updateUserRoleAndStatus);
router.get('/audit-logs', verifyToken, authorizeRoles('admin'), getAuditLogs);

module.exports = router;
