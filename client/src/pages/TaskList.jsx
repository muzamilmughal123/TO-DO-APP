import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  Plus, 
  Search, 
  Grid, 
  List, 
  Calendar, 
  Sparkles, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  User,
  Tag,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  X,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';

const TaskList = () => {
  const { user } = useAuth();
  const { 
    tasks, 
    loading, 
    filters, 
    pagination, 
    createTask, 
    updateTask, 
    deleteTask, 
    regenerateAiSummary,
    updateFilters, 
    changePage 
  } = useTasks();

  const location = useLocation();
  const navigate = useNavigate();

  // Dialog / Modal Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  
  // Form input fields
  const [formMode, setFormMode] = useState('create'); // 'create' or 'edit'
  const [formFields, setFormFields] = useState({
    title: '',
    description: '',
    category: 'Work',
    priority: 'Medium',
    status: 'Pending',
    assignedTo: '',
    dueDate: '',
    tags: '',
    aiGeneratedSummary: '',
    aiGenerate: true,
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [systemUsers, setSystemUsers] = useState([]);
  const [viewLayout, setViewLayout] = useState('grid'); // 'grid' or 'list'

  // Fetch registered users list so tasks can be assigned to actual team members
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/auth/team');
        if (res.data && res.data.success) {
          setSystemUsers(res.data.data);
        }
      } catch (error) {
        console.error('Failed to retrieve team members:', error);
        setSystemUsers([user]);
      }
    };
    if (user) fetchUsers();
  }, [user]);

  // Handle URL parameters for direct details view or creation dialog
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const createTrigger = queryParams.get('create');
    const taskIdTrigger = queryParams.get('id');

    if (createTrigger === 'true') {
      openCreateModal();
    } else if (taskIdTrigger) {
      fetchAndOpenTask(taskIdTrigger);
    }
  }, [location.search, tasks]);

  const fetchAndOpenTask = async (taskId) => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      if (res.data && res.data.success) {
        setSelectedTask(res.data.data);
        setIsViewOpen(true);
      }
    } catch (e) {
      console.error(e);
      toast.error('Task details could not be loaded');
    }
  };

  // Open Modal Forms
  const openCreateModal = () => {
    setFormMode('create');
    setFormFields({
      title: '',
      description: '',
      category: 'Work',
      priority: 'Medium',
      status: 'Pending',
      assignedTo: '',
      dueDate: '',
      tags: '',
      aiGeneratedSummary: '',
      aiGenerate: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setFormMode('edit');
    setSelectedTask(task);
    setFormFields({
      title: task.title,
      description: task.description || '',
      category: task.category,
      priority: task.priority,
      status: task.status,
      assignedTo: task.assignedTo ? task.assignedTo._id : '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      tags: task.tags ? task.tags.join(', ') : '',
      aiGeneratedSummary: task.aiGeneratedSummary || '',
      aiGenerate: false,
    });
    setIsModalOpen(true);
  };

  // Trigger AI analysis inside modal form before saving
  const handleTriggerFormAI = async () => {
    if (!formFields.title) {
      toast.warning('Please enter a task title first to run AI');
      return;
    }
    setAiGenerating(true);
    toast.info('AI is analyzing your input...', { autoClose: 1500 });

    try {
      // Call the dedicated AI suggest endpoint (does NOT create a task)
      const res = await api.post('/tasks/ai-suggest', {
        title: formFields.title,
        description: formFields.description,
      });

      if (res.data && res.data.success) {
        const { category, priority, aiGeneratedSummary } = res.data.data;
        setFormFields((prev) => ({
          ...prev,
          category: category || prev.category,
          priority: priority || prev.priority,
          aiGeneratedSummary: aiGeneratedSummary || prev.aiGeneratedSummary,
        }));
        toast.success(`AI suggested: ${category} / ${priority}`);
      }
    } catch (e) {
      // Client-side heuristic fallback when backend is unreachable
      console.warn('AI endpoint unreachable, using client heuristic:', e.message);
      const content = `${formFields.title.toLowerCase()} ${(formFields.description || '').toLowerCase()}`;
      let suggestedCategory = 'Work';
      let suggestedPriority = 'Medium';

      if (content.includes('meeting') || content.includes('call') || content.includes('discuss')) suggestedCategory = 'Meeting';
      else if (content.includes('buy') || content.includes('shop') || content.includes('personal')) suggestedCategory = 'Personal';
      else if (content.includes('urgent') || content.includes('asap') || content.includes('emergency')) suggestedCategory = 'Urgent';

      if (content.includes('urgent') || content.includes('critical') || content.includes('blocker')) suggestedPriority = 'Critical';
      else if (content.includes('high') || content.includes('important') || content.includes('deadline')) suggestedPriority = 'High';
      else if (content.includes('low') || content.includes('backlog') || content.includes('whenever')) suggestedPriority = 'Low';

      setFormFields((prev) => ({
        ...prev,
        category: suggestedCategory,
        priority: suggestedPriority,
        aiGeneratedSummary: `Keep track of: "${formFields.title}"`,
      }));
      toast.success(`Heuristic AI: ${suggestedCategory} / ${suggestedPriority}`);
    } finally {
      setAiGenerating(false);
    }
  };

  // Save Modal Form (handles CREATE & EDIT submissions)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!formFields.title) {
      toast.warning('Title is required');
      return;
    }

    const payload = {
      ...formFields,
      tags: formFields.tags ? formFields.tags.split(',').map((t) => t.trim()).filter((t) => t !== '') : [],
      assignedTo: formFields.assignedTo || null,
      dueDate: formFields.dueDate || null,
    };

    let result;
    if (formMode === 'create') {
      result = await createTask(payload);
    } else {
      result = await updateTask(selectedTask._id, payload);
    }

    if (result.success) {
      setIsModalOpen(false);
      navigate('/tasks'); // Reset URL
    }
  };

  // Delete task click
  const handleDeleteClick = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      const result = await deleteTask(taskId);
      if (result.success) {
        setIsViewOpen(false);
      }
    }
  };

  // Handle manual AI summary regeneration
  const handleRegenAISummary = async (taskId) => {
    setAiGenerating(true);
    const result = await regenerateAiSummary(taskId);
    setAiGenerating(false);
    if (result.success) {
      setSelectedTask(result.task);
    }
  };

  // Filter input listeners
  const handleSearchChange = (e) => {
    updateFilters({ q: e.target.value });
  };

  const handleFilterSelect = (name, value) => {
    updateFilters({ [name]: value });
  };

  const closeModals = () => {
    setIsModalOpen(false);
    setIsViewOpen(false);
    navigate('/tasks'); // Clear query strings
  };

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Task Board</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            Monitor and distribute task workloads inside your team.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Layout Toggle buttons */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/40 dark:border-slate-700/50">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'grid' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewLayout === 'list' ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button onClick={openCreateModal} className="btn-primary py-2 px-4 shadow-sm text-xs font-bold">
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Query Filters Bar Panel */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 items-center">
        
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={filters.q}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm placeholder-slate-400"
          />
        </div>

        {/* Filters Dropdowns */}
        <div className="grid grid-cols-2 md:flex items-center gap-3 w-full md:w-auto">
          
          <select
            value={filters.status}
            onChange={(e) => handleFilterSelect('status', e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In-Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={filters.priority}
            onChange={(e) => handleFilterSelect('priority', e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <select
            value={filters.assignedTo}
            onChange={(e) => handleFilterSelect('assignedTo', e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none text-xs text-slate-600 dark:text-slate-300 font-medium cursor-pointer col-span-2 md:col-auto"
          >
            <option value="">All Assignees</option>
            {systemUsers.map((u) => (
              <option key={u._id} value={u._id}>{u.name}</option>
            ))}
          </select>
          
        </div>

      </div>

      {/* Main Grid/List Tasks Layout Container */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-shimmer h-48 rounded-2xl"></div>
          ))}
        </div>
      ) : tasks.length > 0 ? (
        viewLayout === 'grid' ? (
          /* Grid View Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div
                key={task._id}
                className="glass-card p-5 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent Priority Colored line on side */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  task.priority === 'Critical' ? 'bg-red-500' :
                  task.priority === 'High' ? 'bg-orange-500' :
                  task.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-300'
                }`} />

                {/* Card Top Title & Details */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold text-[10px] tracking-wide">
                      {task.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                      task.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                      task.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                      task.priority === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <h3 
                    onClick={() => navigate(`/tasks?id=${task._id}`)}
                    className="font-bold text-base line-clamp-1 group-hover:text-blue-500 transition-colors cursor-pointer"
                  >
                    {task.title}
                  </h3>

                  <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[2.5rem]">
                    {task.aiGeneratedSummary || task.description || 'No description provided'}
                  </p>

                  {/* Tags */}
                  {task.tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((t, idx) => (
                        <span key={idx} className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-semibold">
                          <Tag className="w-2.5 h-2.5" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Bottom Assignee & Date */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {task.assignedTo ? (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={task.assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignedTo.name}`}
                          alt={task.assignedTo.name}
                          className="w-6 h-6 rounded-full object-cover border border-slate-200"
                        />
                        <span className="text-[11px] font-medium text-slate-500">{task.assignedTo.name.split(' ')[0]}</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </span>
                    )}

                    {/* Actions Panel */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => openEditModal(task)}
                        className="p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        title="Edit Task"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {(user.role === 'admin' || user.role === 'manager') && (
                        <button
                          onClick={() => handleDeleteClick(task._id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View Layout */
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-bold text-slate-500 uppercase">
                    <th className="py-3 px-4">Task</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Assignee</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 px-4 font-semibold cursor-pointer hover:text-blue-500" onClick={() => navigate(`/tasks?id=${task._id}`)}>
                        {task.title}
                      </td>
                      <td className="py-4 px-4 text-xs font-semibold text-slate-500">
                        {task.category}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          task.priority === 'Critical' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' :
                          task.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400' :
                          task.priority === 'Medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          task.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                          task.status === 'In-Progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                          task.status === 'Archived' ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400' :
                          'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                        }`}>
                          {task.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium">
                        {task.assignedTo ? task.assignedTo.name : 'Unassigned'}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-500">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Limit'}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => navigate(`/tasks?id=${task._id}`)} className="p-1 text-slate-400 hover:text-slate-200">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => openEditModal(task)} className="p-1 text-slate-400 hover:text-blue-500">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {(user.role === 'admin' || user.role === 'manager') && (
                            <button onClick={() => handleDeleteClick(task._id)} className="p-1 text-slate-400 hover:text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-slate-400 text-sm font-semibold">
          <AlertCircle className="w-12 h-12 text-slate-300 mb-3 animate-bounce" />
          <span className="text-base text-slate-500 dark:text-slate-400">No tasks match your filter parameters</span>
          <button onClick={() => updateFilters({ status: '', priority: '', assignedTo: '', q: '' })} className="mt-3 text-blue-500 hover:underline text-xs">
            Clear Filters
          </button>
        </div>
      )}

      {/* Pagination Bar Row Controls */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-400">
            Showing Page <span className="font-bold text-slate-600 dark:text-slate-300">{pagination.page}</span> of <span className="font-bold text-slate-600 dark:text-slate-300">{pagination.pages}</span> ({pagination.total} total items)
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => changePage(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => changePage(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL DIALOG ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative">
            
            <button onClick={closeModals} className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              <span>{formMode === 'create' ? 'Create New Task' : 'Edit Task Settings'}</span>
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Task Title</label>
                <input
                  type="text"
                  placeholder="Review code architecture..."
                  value={formFields.title}
                  onChange={(e) => setFormFields({ ...formFields, title: e.target.value })}
                  className="glass-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description (Details)</label>
                <textarea
                  placeholder="Task specifications..."
                  value={formFields.description}
                  onChange={(e) => setFormFields({ ...formFields, description: e.target.value })}
                  className="glass-input h-20 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleTriggerFormAI}
                  disabled={aiGenerating}
                  className="flex-1 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  {aiGenerating ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generate with AI</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category</label>
                  <select
                    value={formFields.category}
                    onChange={(e) => setFormFields({ ...formFields, category: e.target.value })}
                    className="glass-input py-2 text-xs"
                  >
                    <option value="Work">Work</option>
                    <option value="Personal">Personal</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={formFields.priority}
                    onChange={(e) => setFormFields({ ...formFields, priority: e.target.value })}
                    className="glass-input py-2 text-xs"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {formFields.aiGeneratedSummary && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    AI Summary
                  </label>
                  <textarea
                    value={formFields.aiGeneratedSummary}
                    onChange={(e) => setFormFields({ ...formFields, aiGeneratedSummary: e.target.value })}
                    className="glass-input h-16 resize-none text-xs italic"
                    readOnly={false}
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Assigned To</label>
                  <select
                    value={formFields.assignedTo}
                    onChange={(e) => setFormFields({ ...formFields, assignedTo: e.target.value })}
                    className="glass-input py-2 text-xs"
                  >
                    <option value="">Unassigned</option>
                    {systemUsers.map((u) => (
                      <option key={u._id} value={u._id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formFields.dueDate}
                    onChange={(e) => setFormFields({ ...formFields, dueDate: e.target.value })}
                    className="glass-input py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tags (Comma Separated)</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="marketing, seo, sprint-1"
                    value={formFields.tags}
                    onChange={(e) => setFormFields({ ...formFields, tags: e.target.value })}
                    className="glass-input pl-9"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={closeModals} className="btn-secondary flex-1 py-2.5 text-sm">
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1 py-2.5 text-sm">
                  {formMode === 'create' ? 'Create Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== VIEW DETAILS MODAL DIALOG ==================== */}
      {isViewOpen && selectedTask && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-3xl shadow-2xl p-6 relative overflow-hidden">
            
            <button onClick={closeModals} className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>

            {/* Task metadata heading */}
            <div className="space-y-4">
              <div className="flex gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 font-bold text-xs">
                  {selectedTask.category}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedTask.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                  selectedTask.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400' :
                  selectedTask.priority === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                  'bg-slate-100 text-slate-800 dark:bg-slate-850 dark:text-slate-400'
                }`}>
                  {selectedTask.priority}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedTask.status === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' :
                  'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
                }`}>
                  {selectedTask.status}
                </span>
              </div>

              <h3 className="text-2xl font-bold">{selectedTask.title}</h3>

              <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 dark:border-slate-800 text-xs">
                <div className="space-y-1.5">
                  <span className="block font-bold text-slate-400 uppercase tracking-wider">Assignee</span>
                  {selectedTask.assignedTo ? (
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedTask.assignedTo.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedTask.assignedTo.name}`}
                        alt={selectedTask.assignedTo.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTask.assignedTo.name}</span>
                    </div>
                  ) : (
                    <span className="text-slate-500 italic">Unassigned</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="block font-bold text-slate-400 uppercase tracking-wider">Created By</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {selectedTask.createdBy ? selectedTask.createdBy.name : 'System'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Description</span>
                <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-950/30 p-4 rounded-2xl border border-slate-200/40 dark:border-slate-800/40">
                  {selectedTask.description || 'No detailed specifications added.'}
                </p>
              </div>

              {/* AI Generated Summary Widget */}
              <div className="space-y-2 relative overflow-hidden bg-gradient-to-tr from-blue-50/50 to-indigo-50/40 dark:from-slate-900/60 dark:to-indigo-950/20 p-4 rounded-2xl border border-blue-100/50 dark:border-blue-900/30">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 animate-pulse fill-blue-500/20" />
                    AI-Generated Summary
                  </span>
                  
                  <button
                    onClick={() => handleRegenAISummary(selectedTask._id)}
                    disabled={aiGenerating}
                    className="p-1 hover:bg-blue-100/60 dark:hover:bg-slate-800 rounded-lg text-blue-500 transition-colors"
                    title="Regenerate AI suggestions"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${aiGenerating ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 italic leading-relaxed mt-1.5">
                  {selectedTask.aiGeneratedSummary || '"Provide a title and description, then run AI to automatically generate details for this task."'}
                </p>
              </div>

              {/* Task Details Tags */}
              {selectedTask.tags && selectedTask.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedTask.tags.map((t, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-500 font-semibold border border-slate-200/40 dark:border-slate-700/30">
                      <Tag className="w-3 h-3" />
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* View dialog bottom buttons */}
              <div className="flex gap-3 mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                {(user.role === 'admin' || user.role === 'manager') && (
                  <button onClick={() => handleDeleteClick(selectedTask._id)} className="btn-danger py-2.5 px-4 text-sm flex-1">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                )}
                <button onClick={() => openEditModal(selectedTask)} className="btn-secondary py-2.5 px-4 text-sm flex-1">
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Settings</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TaskList;
