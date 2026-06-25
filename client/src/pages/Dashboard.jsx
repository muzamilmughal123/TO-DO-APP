import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';
import api from '../services/api';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import { 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Users,
  Briefcase
} from 'lucide-react';
import { toast } from 'react-toastify';

// Register ChartJS modules
ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const { refreshTasks } = useTasks();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState(null);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Dashboard-specific analytics and upcoming deadlines
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, tasksRes] = await Promise.all([
          api.get('/reports/analytics'),
          api.get('/tasks', { params: { limit: 5, sortBy: 'dueDate', order: 'asc', status: 'Pending' } })
        ]);

        if (analyticsRes.data && analyticsRes.data.success) {
          setAnalytics(analyticsRes.data.data);
        }
        if (tasksRes.data && tasksRes.data.success) {
          setUpcomingTasks(tasksRes.data.data.tasks);
        }
      } catch (error) {
        console.error('Dashboard loading failed:', error);
        toast.error('Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // Also trigger refetching in TaskContext so list updates
    refreshTasks();
  }, [refreshTasks]);

  // Loading Skeletons layout (glassmorphic shimmer)
  if (loading || !analytics) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Formatting Pie Chart (Status Distribution)
  const statusChartData = {
    labels: Object.keys(analytics.statusCounts),
    datasets: [
      {
        data: Object.values(analytics.statusCounts),
        backgroundColor: [
          'rgba(234, 179, 8, 0.75)',  // Yellow - Pending
          'rgba(59, 130, 246, 0.75)',  // Blue - In Progress
          'rgba(34, 197, 94, 0.75)',  // Green - Completed
          'rgba(148, 163, 184, 0.75)', // Slate - Archived
        ],
        borderColor: [
          'rgb(234, 179, 8)',
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(148, 163, 184)',
        ],
        borderWidth: 1.5,
      },
    ],
  };

  // Formatting Bar Chart (Priority distribution)
  const priorityChartData = {
    labels: Object.keys(analytics.priorityCounts),
    datasets: [
      {
        label: 'Tasks Count',
        data: Object.values(analytics.priorityCounts),
        backgroundColor: [
          'rgba(148, 163, 184, 0.7)', // Slate - Low
          'rgba(59, 130, 246, 0.7)',  // Blue - Medium
          'rgba(249, 115, 22, 0.7)',  // Orange - High
          'rgba(239, 68, 68, 0.7)',   // Red - Critical
        ],
        borderColor: [
          'rgb(148, 163, 184)',
          'rgb(59, 130, 246)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
        ],
        borderWidth: 1.5,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.body.classList.contains('dark') ? '#f1f5f9' : '#0f172a',
          font: { family: 'Inter' }
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-gradient-to-tr from-slate-900 via-slate-900 to-indigo-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800/30">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
        
        <div className="space-y-2 z-10">
          <h2 className="text-3xl font-extrabold flex items-center gap-2">
            <span>Hi, {user.name}</span>
            <Sparkles className="w-6 h-6 text-yellow-400 fill-yellow-400 animate-bounce" />
          </h2>
          <p className="text-slate-300 max-w-xl text-sm font-medium">
            Welcome to your intelligent control panel. Below is a real-time overview of tasks, priorities, and deadlines compiled by your AI Assistant.
          </p>
        </div>

        <button
          onClick={() => navigate('/tasks?create=true')}
          className="btn-primary bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 shadow-md shadow-blue-500/20 text-sm font-bold z-10 self-start md:self-center"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Task</span>
        </button>
      </div>

      {/* Numerical Stats Widgets Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Tasks</p>
            <h3 className="text-3xl font-extrabold mt-1">{analytics.totalTasks}</h3>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Status</p>
            <h3 className="text-3xl font-extrabold text-amber-500 mt-1">
              {analytics.statusCounts.Pending || 0}
            </h3>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Completed Tasks</p>
            <h3 className="text-3xl font-extrabold text-emerald-500 mt-1">
              {analytics.statusCounts.Completed || 0}
            </h3>
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Active Categories</p>
            <h3 className="text-3xl font-extrabold text-indigo-500 mt-1">
              {Object.keys(analytics.categoryCounts).filter(k => analytics.categoryCounts[k] > 0).length}
            </h3>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Dynamic Graphic Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Status Pie Chart */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Status Distribution</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tasks segmented by processing stage.</p>
          </div>
          <div className="h-64 relative mt-6 flex justify-center">
            {analytics.totalTasks > 0 ? (
              <Pie data={statusChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center text-slate-400 text-sm font-semibold">
                No task data compiled yet
              </div>
            )}
          </div>
        </div>

        {/* Priority Bar Chart */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold">Priority Breakdown</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tasks aggregated by severity weights.</p>
          </div>
          <div className="h-64 relative mt-6">
            {analytics.totalTasks > 0 ? (
              <Bar data={priorityChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center text-slate-400 text-sm font-semibold">
                No task data compiled yet
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Upcoming deadlines container */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold">Upcoming Deadlines</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Urgent pending tasks requiring prompt attention.</p>
          </div>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors"
          >
            View All Tasks
          </button>
        </div>

        {upcomingTasks.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {upcomingTasks.map((task) => (
              <div
                key={task._id}
                onClick={() => navigate(`/tasks?id=${task._id}`)}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/35 px-2 rounded-xl transition-colors duration-150"
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 w-2.5 h-2.5 rounded-full ${
                    task.priority === 'Critical' ? 'bg-red-500' :
                    task.priority === 'High' ? 'bg-orange-500' :
                    task.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-400'
                  }`} />
                  <div>
                    <h4 className="font-semibold text-sm hover:text-blue-500 transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1 max-w-xl">
                      {task.aiGeneratedSummary || task.description || 'No description added'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium self-start sm:self-center">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {task.category}
                  </span>
                  
                  {task.dueDate && (
                    <span className="flex items-center gap-1 text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                    </span>
                  )}

                  <span className={`px-2.5 py-1 rounded-full font-bold tracking-wider uppercase text-[10px] ${
                    task.priority === 'Critical' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                    task.priority === 'High' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-400' :
                    task.priority === 'Medium' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                    'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-sm font-semibold">
            <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
            <span>No urgent tasks scheduled right now!</span>
          </div>
        )}
      </div>

    </div>
  );
};

export default Dashboard;
