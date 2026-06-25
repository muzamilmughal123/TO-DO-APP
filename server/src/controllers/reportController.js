const Task = require('../models/Task');
const User = require('../models/User');

/**
 * Export tasks list to CSV (Manager & Admin only)
 */
const exportTasksCSV = async (req, res) => {
  try {
    const query = { isDeleted: false };
    
    // If manager, they see all tasks. If regular user tried, it would block at route level.
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Set response headers for download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks-report.csv');

    // CSV Header row
    const headers = [
      'Task ID',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Status',
      'Assigned To Name',
      'Assigned To Email',
      'Created By Name',
      'Due Date',
      'AI Generated Summary',
      'Created At'
    ];

    // Helper to sanitize CSV text (escapes double quotes and surrounds with quotes if necessary)
    const cleanCSVField = (val) => {
      if (val === undefined || val === null) return '""';
      let strVal = String(val).replace(/"/g, '""'); // Escape quotes
      return `"${strVal}"`;
    };

    // Write header
    res.write(headers.join(',') + '\n');

    // Write records
    for (const task of tasks) {
      const row = [
        cleanCSVField(task._id),
        cleanCSVField(task.title),
        cleanCSVField(task.description),
        cleanCSVField(task.category),
        cleanCSVField(task.priority),
        cleanCSVField(task.status),
        cleanCSVField(task.assignedTo ? task.assignedTo.name : 'Unassigned'),
        cleanCSVField(task.assignedTo ? task.assignedTo.email : ''),
        cleanCSVField(task.createdBy ? task.createdBy.name : 'Unknown'),
        cleanCSVField(task.dueDate ? task.dueDate.toISOString().split('T')[0] : 'No Limit'),
        cleanCSVField(task.aiGeneratedSummary),
        cleanCSVField(task.createdAt.toISOString())
      ];
      res.write(row.join(',') + '\n');
    }

    res.end();
  } catch (error) {
    console.error('exportTasksCSV error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate CSV export',
    });
  }
};

/**
 * Retrieve aggregated analytics count matrices for charts (Dashboard)
 */
const getAnalytics = async (req, res) => {
  try {
    const query = { isDeleted: false };

    // Regular users are limited to tasks they own or are assigned to
    if (req.user.role === 'user') {
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id }
      ];
    }

    const tasks = await Task.find(query).populate('assignedTo', 'name avatar');

    // Initialize metrics
    const statusCounts = { Pending: 0, 'In-Progress': 0, Completed: 0, Archived: 0 };
    const priorityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    const categoryCounts = { Work: 0, Personal: 0, Urgent: 0, Meeting: 0, Other: 0 };
    const userWorkload = {}; // Maps username -> count

    tasks.forEach(task => {
      // Status aggregation
      if (statusCounts[task.status] !== undefined) {
        statusCounts[task.status]++;
      }
      
      // Priority aggregation
      if (priorityCounts[task.priority] !== undefined) {
        priorityCounts[task.priority]++;
      }

      // Category aggregation
      if (categoryCounts[task.category] !== undefined) {
        categoryCounts[task.category]++;
      }

      // Workload aggregation
      const assigneeName = task.assignedTo ? task.assignedTo.name : 'Unassigned';
      userWorkload[assigneeName] = (userWorkload[assigneeName] || 0) + 1;
    });

    // Formatting workload mapping for ChartJS (labels & values arrays)
    const workloadLabels = Object.keys(userWorkload);
    const workloadValues = Object.values(userWorkload);

    return res.json({
      success: true,
      data: {
        totalTasks: tasks.length,
        statusCounts,
        priorityCounts,
        categoryCounts,
        workload: {
          labels: workloadLabels,
          datasets: workloadValues,
        }
      },
      message: 'Analytics data calculated successfully',
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analytics data',
    });
  }
};

module.exports = {
  exportTasksCSV,
  getAnalytics,
};
