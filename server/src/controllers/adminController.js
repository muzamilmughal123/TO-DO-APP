const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { logAction } = require('../utils/logger');

/**
 * Get all registered users (Admin only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json({
      success: true,
      data: users,
      message: 'Users list retrieved successfully',
    });
  } catch (error) {
    console.error('getAllUsers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve user list',
    });
  }
};

/**
 * Change User Role or Status (Admin only)
 */
const updateUserRoleAndStatus = async (req, res) => {
  try {
    const { role, isActive } = req.body;
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Protection: Prevent admin from deactivating themselves
    if (targetUserId === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account',
      });
    }

    // Log old details
    const previousDetails = { role: user.role, isActive: user.isActive };

    // Update
    if (role !== undefined) {
      if (!['user', 'manager', 'admin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role value',
        });
      }
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive = isActive;
    }

    await user.save();

    // Audit Logging
    await logAction(
      req.user._id,
      'ADMIN_UPDATE_USER',
      'User',
      { targetUserId: user._id, previousDetails, updatedDetails: { role: user.role, isActive: user.isActive } },
      req.ip
    );

    return res.json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      message: 'User role and status updated successfully',
    });
  } catch (error) {
    console.error('updateUserRoleAndStatus error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user parameters',
    });
  }
};

/**
 * Get all system Audit Logs (Admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    const total = await AuditLog.countDocuments();
    const logs = await AuditLog.find()
      .populate('userId', 'name email role avatar')
      .sort({ timestamp: -1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.json({
      success: true,
      data: {
        logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      message: 'Audit logs retrieved successfully',
    });
  } catch (error) {
    console.error('getAuditLogs error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve system audit logs',
    });
  }
};

/**
 * Create a new user (Admin only)
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    if (role && !['user', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    // If no password provided, generate a temporary password and email it to the user
    let tempPassword = password;
    if (!tempPassword) {
      tempPassword = require('crypto').randomBytes(6).toString('hex');
    }

    const newUser = new User({ name, email, password: tempPassword, role: role || 'user' });
    await newUser.save();

    // Audit log
    await logAction(req.user._id, 'ADMIN_CREATE_USER', 'User', { createdUserId: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }, req.ip);

    // Send invite email if password was not explicitly provided
    try {
      if (!password) {
        const { sendInviteEmail } = require('../services/emailService');
        await sendInviteEmail({ to: newUser.email, name: newUser.name, tempPassword });
      }
    } catch (err) {
      console.error('Failed to send invite email:', err);
      // Do not fail creation because of email failure; return success but include a warning
      return res.status(201).json({
        success: true,
        data: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, isActive: newUser.isActive },
        message: 'User created successfully, but invite email failed to send',
      });
    }

    return res.status(201).json({
      success: true,
      data: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, isActive: newUser.isActive },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('createUser error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create user' });
  }
};

module.exports = {
  getAllUsers,
  updateUserRoleAndStatus,
  getAuditLogs,
  createUser,
};
