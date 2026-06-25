const Task = require('../models/Task');
const User = require('../models/User');
const { getAiTaskSuggestions } = require('../services/aiService');
const { notifyUser, broadcast } = require('../services/socket');
const { logAction } = require('../utils/logger');

/**
 * Get all tasks with filtering, search, pagination, and sorting
 */
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignedTo, q, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

    const query = { isDeleted: false };

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    // Search query on title
    if (q) {
      query.title = { $regex: q, $options: 'i' };
    }

    // Role restrictions:
    // Regular users can only see tasks created by them OR assigned to them.
    // Managers and Admins can see all tasks.
    if (req.user.role === 'user') {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    // Pagination calculations
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Execute queries
    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .skip(skipNum)
      .limit(limitNum);

    return res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum),
        },
      },
      message: 'Tasks retrieved successfully',
    });
  } catch (error) {
    console.error('getTasks error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve tasks',
    });
  }
};

/**
 * Get a single task by ID
 */
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false })
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Auth check: Regular user must be creator or assignee
    if (
      req.user.role === 'user' &&
      task.createdBy._id.toString() !== req.user._id.toString() &&
      (!task.assignedTo || task.assignedTo._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this task',
      });
    }

    return res.json({
      success: true,
      data: task,
      message: 'Task retrieved successfully',
    });
  } catch (error) {
    console.error('getTaskById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve task details',
    });
  }
};

/**
 * Create Task (Triggers AI classification)
 */
const createTask = async (req, res) => {
  try {
    const { title, description, category, priority, status, assignedTo, dueDate, tags, attachments, aiGeneratedSummary, aiGenerate = true } = req.body;

    let finalCategory = category || 'Other';
    let finalPriority = priority || 'Medium';
    let aiSummary = aiGeneratedSummary || '';

    // Run AI analysis if triggered and no pre-filled summary exists
    if ((aiGenerate || !category || !priority) && !aiSummary) {
      const aiSuggestions = await getAiTaskSuggestions(title, description || '');
      finalCategory = category || aiSuggestions.category;
      finalPriority = priority || aiSuggestions.priority;
      aiSummary = aiSuggestions.aiGeneratedSummary;
    }

    const task = new Task({
      title,
      description: description || '',
      category: finalCategory,
      priority: finalPriority,
      status: status || 'Pending',
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null,
      tags: tags || [],
      attachments: attachments || [],
      aiGeneratedSummary: aiSummary,
    });

    await task.save();

    // Populate user references for response and sockets
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role');

    // Notify assigned user if assigned to someone else
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      notifyUser(task.assignedTo, 'task_assigned', {
        message: `New task "${task.title}" has been assigned to you by ${req.user.name}`,
        task: populatedTask,
      });
    }

    // Broadcast to dashboard listeners
    broadcast('task_created', populatedTask);

    // Audit logging
    await logAction(
      req.user._id,
      'CREATE_TASK',
      'Task',
      { taskId: task._id, title: task.title, category: task.category, priority: task.priority },
      req.ip
    );

    return res.status(201).json({
      success: true,
      data: populatedTask,
      message: 'Task created successfully',
    });
  } catch (error) {
    console.error('createTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
    });
  }
};

/**
 * Update Task
 */
const updateTask = async (req, res) => {
  try {
    const { title, description, category, priority, status, assignedTo, dueDate, tags, attachments } = req.body;

    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Auth check: Regular user must be creator or assignee
    if (
      req.user.role === 'user' &&
      task.createdBy.toString() !== req.user._id.toString() &&
      (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this task',
      });
    }

    const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;

    // Update fields
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (category !== undefined) task.category = category;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (tags !== undefined) task.tags = tags;
    if (attachments !== undefined) task.attachments = attachments;
    task.updatedAt = Date.now();

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role');

    // Notify assignee if assignee changed or if status/priority changes
    const currentAssignee = task.assignedTo ? task.assignedTo.toString() : null;
    
    if (currentAssignee && currentAssignee !== req.user._id.toString()) {
      if (currentAssignee !== previousAssignee) {
        notifyUser(task.assignedTo, 'task_assigned', {
          message: `Task "${task.title}" has been assigned to you by ${req.user.name}`,
          task: populatedTask,
        });
      } else {
        notifyUser(task.assignedTo, 'task_updated', {
          message: `Task "${task.title}" assigned to you has been updated by ${req.user.name}`,
          task: populatedTask,
        });
      }
    }

    // Notify previous assignee if they are unassigned
    if (previousAssignee && previousAssignee !== currentAssignee && previousAssignee !== req.user._id.toString()) {
      notifyUser(previousAssignee, 'task_unassigned', {
        message: `You have been unassigned from task "${task.title}" by ${req.user.name}`,
        taskId: task._id,
      });
    }

    // Broadcast change
    broadcast('task_updated', populatedTask);

    // Audit logging
    await logAction(
      req.user._id,
      'UPDATE_TASK',
      'Task',
      { taskId: task._id, title: task.title, status: task.status },
      req.ip
    );

    return res.json({
      success: true,
      data: populatedTask,
      message: 'Task updated successfully',
    });
  } catch (error) {
    console.error('updateTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
    });
  }
};

/**
 * Soft Delete Task (Admin/Manager restricted)
 */
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Perform soft delete
    task.isDeleted = true;
    task.updatedAt = Date.now();
    await task.save();

    // Broadcast deletion
    broadcast('task_deleted', { id: task._id });

    // Notify assignee if any
    if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
      notifyUser(task.assignedTo, 'task_deleted', {
        message: `Task "${task.title}" assigned to you has been deleted by ${req.user.name}`,
        taskId: task._id,
      });
    }

    // Audit Logging
    await logAction(
      req.user._id,
      'DELETE_TASK',
      'Task',
      { taskId: task._id, title: task.title },
      req.ip
    );

    return res.json({
      success: true,
      data: { id: task._id },
      message: 'Task soft-deleted successfully',
    });
  } catch (error) {
    console.error('deleteTask error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
    });
  }
};

/**
 * Trigger AI categorization and summary manually
 */
const regenerateAiSummary = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, isDeleted: false });
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    // Auth check
    if (
      req.user.role === 'user' &&
      task.createdBy.toString() !== req.user._id.toString() &&
      (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to request AI service on this task',
      });
    }

    // Run AI Suggestion
    const aiSuggestions = await getAiTaskSuggestions(task.title, task.description || '');
    
    task.category = aiSuggestions.category;
    task.priority = aiSuggestions.priority;
    task.aiGeneratedSummary = aiSuggestions.aiGeneratedSummary;
    task.updatedAt = Date.now();

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email role');

    // Broadcast update
    broadcast('task_updated', populatedTask);

    // Audit Logging
    await logAction(
      req.user._id,
      'REGENERATE_AI_SUMMARY',
      'Task',
      { taskId: task._id, title: task.title },
      req.ip
    );

    return res.json({
      success: true,
      data: populatedTask,
      message: 'AI summary and categorization updated successfully',
    });
  } catch (error) {
    console.error('regenerateAiSummary error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to regenerate AI summary',
    });
  }
};

module.exports = {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  regenerateAiSummary,
  getAiSuggest,
};

/**
 * AI Suggest only — returns category, priority, summary without saving a task
 */
async function getAiSuggest(req, res) {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required for AI suggestion',
      });
    }
    const aiSuggestions = await getAiTaskSuggestions(title, description || '');
    return res.json({
      success: true,
      data: aiSuggestions,
      message: 'AI suggestions generated successfully',
    });
  } catch (error) {
    console.error('getAiSuggest error:', error);
    return res.status(500).json({
      success: false,
      message: 'AI suggestion service failed',
    });
  }
}
