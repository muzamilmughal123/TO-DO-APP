const AuditLog = require('../models/AuditLog');

/**
 * Log an administrative or user action to the AuditLog database collection
 * @param {string|null} userId - The user performing the action
 * @param {string} action - Action name (e.g. LOGIN, CREATE_TASK, UPDATE_TASK)
 * @param {string} resource - Target resource (e.g. User, Task)
 * @param {object} details - Any metadata or data diff details
 * @param {string} ipAddress - Client's IP address
 */
const logAction = async (userId, action, resource, details = {}, ipAddress = '') => {
  try {
    const log = new AuditLog({
      userId,
      action,
      resource,
      details,
      ipAddress,
    });
    await log.save();
  } catch (error) {
    console.error(`Audit logging failed: ${error.message}`);
  }
};

module.exports = { logAction };
