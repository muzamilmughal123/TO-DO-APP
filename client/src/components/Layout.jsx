import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { toast } from 'react-toastify';
import { 
  LayoutDashboard, 
  CheckSquare, 
  ShieldAlert, 
  Moon, 
  Sun, 
  LogOut, 
  Download,
  User
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logoutUser } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleExportCSV = async () => {
    try {
      // Direct link to download report CSV file
      const token = localStorage.getItem('accessToken');
      const response = await api.get('/reports/export/csv', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `tasks-report-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      toast.success('CSV Report downloaded!');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      toast.error('CSV Export failed or unauthorized');
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/tasks', icon: CheckSquare },
  ];

  if (user && user.role === 'admin') {
    menuItems.push({ name: 'Admin Panel', path: '/admin', icon: ShieldAlert });
  }

  const isLinkActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 glass-panel border-r border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between py-6 px-4 md:sticky md:top-0 md:h-screen z-10">
        <div className="flex flex-col gap-8">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-md shadow-blue-500/20">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Antigravity AI
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 -mt-1 font-semibold tracking-wider uppercase">
                Task Manager
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-150 ${
                    active
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Actions */}
        <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          
          {/* Theme & Export CSV Button Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex-1 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Dark/Light Mode"
            >
              {darkMode ? (
                <Sun className="w-5 h-5 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="w-5 h-5 text-indigo-600" />
              )}
            </button>
            
            {(user.role === 'admin' || user.role === 'manager') && (
              <button
                onClick={handleExportCSV}
                className="flex-1 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-emerald-600 dark:text-emerald-400"
                title="Export Tasks CSV"
              >
                <Download className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Profile Card */}
          <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-slate-900/40 p-3 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border border-blue-500/20"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm truncate">{user.name}</h4>
              <p className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider -mt-0.5">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
};

export default Layout;
