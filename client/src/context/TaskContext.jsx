import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import api from '../services/api';
import { useAuth } from './AuthContext';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

  // Pagination and query state
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
    q: '',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    order: 'desc',
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const params = { ...filters };
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });

      const res = await api.get('/tasks', { params });
      if (res.data && res.data.success) {
        setTasks(res.data.data.tasks);
        setPagination(res.data.data.pagination);
      }
    } catch (error) {
      console.error('Fetch tasks failed:', error);
      toast.error(error.response?.data?.message || 'Failed to retrieve tasks');
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  // Trigger fetch when filters or user changes
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create Task
  const createTask = async (taskData) => {
    try {
      const res = await api.post('/tasks', taskData);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Task created successfully');
        fetchTasks();
        return { success: true, task: res.data.data };
      }
      return { success: false };
    } catch (error) {
      console.error('Create task failed:', error);
      toast.error(error.response?.data?.message || 'Failed to create task');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Update Task
  const updateTask = async (taskId, updateData) => {
    try {
      const res = await api.put(`/tasks/${taskId}`, updateData);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Task updated successfully');
        fetchTasks();
        return { success: true, task: res.data.data };
      }
      return { success: false };
    } catch (error) {
      console.error('Update task failed:', error);
      toast.error(error.response?.data?.message || 'Failed to update task');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Soft Delete Task
  const deleteTask = async (taskId) => {
    try {
      const res = await api.delete(`/tasks/${taskId}`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Task deleted successfully');
        fetchTasks();
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error('Delete task failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete task');
      return { success: false, error: error.response?.data?.message };
    }
  };

  // Manually regenerate AI summary
  const regenerateAiSummary = async (taskId) => {
    try {
      const res = await api.post(`/tasks/${taskId}/ai-summary`);
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'AI Summary regenerated!');
        fetchTasks();
        return { success: true, task: res.data.data };
      }
      return { success: false };
    } catch (error) {
      console.error('AI summary regeneration failed:', error);
      toast.error(error.response?.data?.message || 'AI service error');
      return { success: false };
    }
  };

  // Socket.io connection setup and real-time syncing listener
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    // Register session
    newSocket.on('connect', () => {
      const uid = user._id || user.id;
      console.log('Socket connected, registering user session:', uid);
      newSocket.emit('register_user', uid);
    });

    // Real-time assignment alert
    newSocket.on('task_assigned', (data) => {
      toast.info(data.message, {
        position: 'top-right',
        autoClose: 5000,
      });
      fetchTasks();
    });

    // Real-time unassignment alert
    newSocket.on('task_unassigned', (data) => {
      toast.info(data.message, {
        position: 'top-right',
        autoClose: 5000,
      });
      fetchTasks();
    });

    // Real-time update notify
    newSocket.on('task_updated', (data) => {
      // Just check if this updated task is in our state and modify it
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === data._id ? { ...t, ...data } : t))
      );
      // Let's refetch to get updated populate fields & sorting
      fetchTasks();
    });

    newSocket.on('task_created', (data) => {
      fetchTasks();
    });

    newSocket.on('task_deleted', (data) => {
      fetchTasks();
    });

    return () => {
      if (newSocket) {
        newSocket.emit('unregister_user', user._id || user.id);
        newSocket.disconnect();
      }
    };
  }, [user, fetchTasks]);

  const updateFilters = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 })); // Reset to page 1 on filter change
  };

  const changePage = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        filters,
        pagination,
        createTask,
        updateTask,
        deleteTask,
        regenerateAiSummary,
        updateFilters,
        changePage,
        refreshTasks: fetchTasks,
        socket,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
