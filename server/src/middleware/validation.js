const { check, validationResult } = require('express-validator');

// Error checker runner
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({ field: err.path || err.param, message: err.msg })),
    });
  }
  next();
};

const registerValidation = [
  check('name', 'Name is required').notEmpty().trim(),
  check('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
  check('password', 'Password must be at least 6 characters long').isLength({ min: 6 }),
  validateRequest,
];

const loginValidation = [
  check('email', 'Please provide a valid email address').isEmail().normalizeEmail(),
  check('password', 'Password is required').exists(),
  validateRequest,
];

const taskValidation = [
  check('title', 'Task title is required').notEmpty().trim(),
  check('category', 'Category must be one of Work, Personal, Urgent, Meeting, Other')
    .optional()
    .isIn(['Work', 'Personal', 'Urgent', 'Meeting', 'Other']),
  check('priority', 'Priority must be one of Low, Medium, High, Critical')
    .optional()
    .isIn(['Low', 'Medium', 'High', 'Critical']),
  check('status', 'Status must be one of Pending, In-Progress, Completed, Archived')
    .optional()
    .isIn(['Pending', 'In-Progress', 'Completed', 'Archived']),
  check('dueDate', 'Due date must be a valid date format')
    .optional({ checkFalsy: true })
    .isISO8601(),
  validateRequest,
];

module.exports = {
  registerValidation,
  loginValidation,
  taskValidation,
};
