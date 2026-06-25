const express = require('express');
const {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  regenerateAiSummary,
  getAiSuggest,
} = require('../controllers/taskController');
const { verifyToken, authorizeRoles } = require('../middleware/auth');
const { taskValidation } = require('../middleware/validation');

const router = express.Router();

// IMPORTANT: Static paths must come BEFORE dynamic /:id paths
router.get('/', verifyToken, getTasks);
router.post('/ai-suggest', verifyToken, getAiSuggest); // Static route FIRST
router.post('/', verifyToken, taskValidation, createTask);
router.get('/:id', verifyToken, getTaskById);
router.put('/:id', verifyToken, taskValidation, updateTask);
router.delete('/:id', verifyToken, authorizeRoles('admin', 'manager'), deleteTask);
router.post('/:id/ai-summary', verifyToken, regenerateAiSummary);

module.exports = router;
