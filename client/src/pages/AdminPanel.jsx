import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  ShieldAlert, 
  Users, 
  Terminal, 
  Check, 
  UserMinus, 
  UserCheck, 
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Eye
} from 'lucide-react';
import { toast } from 'react-toastify';

const AdminPanel = () => {
  const { user } = useAuth();
  
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logPagination, setLogPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [logPage, setLogPage] = useState(1);
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [inspectLog, setInspectLog] = useState(null);

  // Fetch users list and audit logs
  useEffect(() => {
    const fetchAdminData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'users') {
          const res = await api.get('/admin/users');
          if (res.data && res.data.success) {
            setUsersList(res.data.data);
          }
        } else {
          const res = await api.get('/admin/audit-logs', { params: { page: logPage, limit: 15 } });
          if (res.data && res.data.success) {
            setAuditLogs(res.data.data.logs);
            setLogPagination(res.data.data.pagination);
          }
        }
      } catch (error) {
        console.error('Failed to load admin data:', error);
        toast.error('Failed to fetch administration panels');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [activeTab, logPage]);

  // Handle changing user role
  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      const res = await api.put(`/admin/users/${targetUserId}/role`, { role: newRole });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'User role updated successfully');
        // Update local state list
        setUsersList(prev => prev.map(u => u._id === targetUserId ? { ...u, role: newRole } : u));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to modify role');
    }
  };

  // Create a new user (Admin)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin/users', newUserForm);
      if (res.data && res.data.success) {
        toast.success('User created successfully');
        setUsersList(prev => [res.data.data, ...prev]);
        setNewUserForm({ name: '', email: '', password: '', role: 'user' });
      }
    } catch (error) {
      console.error('Create user failed:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  // Toggle user activation status (Active/Deactivated)
  const handleToggleStatus = async (targetUserId, currentStatus) => {
    try {
      const targetStatus = !currentStatus;
      const res = await api.put(`/admin/users/${targetUserId}/role`, { isActive: targetStatus });
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'User status updated');
        // Update local state list
        setUsersList(prev => prev.map(u => u._id === targetUserId ? { ...u, isActive: targetStatus } : u));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Action rejected');
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-200">Access Denied</h3>
        <p className="text-sm mt-1 text-slate-500">Only system administrators are allowed to view this panel.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Administration Control Center</h2>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
          Manage system configurations, user permissions, and query the audit trial logs.
        </p>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => { setActiveTab('users'); setLogPage(1); }}
          className={`pb-3 flex items-center gap-2 text-sm font-semibold border-b-2 transition-colors duration-150 ${activeTab === 'users' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Users className="w-4 h-4" />
          <span>User Profiles ({usersList.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('logs'); }}
          className={`pb-3 flex items-center gap-2 text-sm font-semibold border-b-2 transition-colors duration-150 ${activeTab === 'logs' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Terminal className="w-4 h-4" />
          <span>Security Audit Trail</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="skeleton-shimmer h-80 rounded-2xl"></div>
      ) : activeTab === 'users' ? (
        
        /* Users Management Table */
        <div className="glass-card p-4 mb-4 rounded-xl">
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400">Name</label>
              <input value={newUserForm.name} onChange={(e) => setNewUserForm(prev => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-100" placeholder="Full name" required />
            </div>
            <div>
              <label className="text-xs text-slate-400">Email</label>
              <input value={newUserForm.email} onChange={(e) => setNewUserForm(prev => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-100" placeholder="email@example.com" required />
            </div>
            <div>
              <label className="text-xs text-slate-400">Password (optional)</label>
              <input value={newUserForm.password} onChange={(e) => setNewUserForm(prev => ({ ...prev, password: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-100" placeholder="password (leave blank for invite)" />
            </div>
            <div>
              <label className="text-xs text-slate-400">Role</label>
              <select value={newUserForm.role} onChange={(e) => setNewUserForm(prev => ({ ...prev, role: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-slate-100">
                <option value="user">User</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="md:col-span-4 flex gap-2">
              <button type="submit" className="btn-primary px-4 py-2 rounded-lg bg-blue-600">Create User</button>
            </div>
          </form>
        </div>
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-6">User Name</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">System Role</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Permissions Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {usersList.map((targetUser) => (
                  <tr key={targetUser._id || targetUser.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                    
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img
                        src={targetUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${targetUser.name}`}
                        alt={targetUser.name}
                        className="w-8 h-8 rounded-full border border-slate-200"
                      />
                      <span className="font-semibold">{targetUser.name}</span>
                    </td>

                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                      {targetUser.email}
                    </td>

                    <td className="py-4 px-6">
                        <select
                        value={targetUser.role}
                        onChange={(e) => handleRoleChange(targetUser._id || targetUser.id, e.target.value)}
                        disabled={(targetUser._id || targetUser.id) === (user._id || user.id)} // Don't let active admin modify own role
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-xs font-medium focus:outline-none cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${targetUser.isActive ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400'}`}>
                        {targetUser.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleToggleStatus(targetUser._id || targetUser.id, targetUser.isActive)}
                        disabled={(targetUser._id || targetUser.id) === (user._id || user.id)} // Don't let active admin deactivate themselves
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all active:scale-[0.98] ${targetUser.isActive ? 'border-rose-200 dark:border-rose-950/40 bg-rose-50/30 dark:bg-rose-950/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60' : 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/30 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/60'}`}
                      >
                        {targetUser.isActive ? (
                          <>
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (
        
        /* Security Audit Trail Logs List */
        <div className="space-y-4">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 text-xs font-bold text-slate-500 uppercase">
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-5">Action</th>
                    <th className="py-3.5 px-5">Resource</th>
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-5">IP Address</th>
                    <th className="py-3.5 px-5 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                  {auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/10 transition-colors">
                      <td className="py-3.5 px-5 text-slate-400">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[9px] ${
                          log.action.includes('REGISTER') || log.action.includes('LOGIN') ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400' :
                          log.action.includes('CREATE') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400' :
                          log.action.includes('UPDATE') ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400' :
                          'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        }`}>
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3.5 px-5 text-slate-500">
                        {log.resource}
                      </td>

                      <td className="py-3.5 px-5">
                        {log.userId ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-350">{log.userId.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Guest</span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-slate-400 font-mono">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setInspectLog(log)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-blue-500 inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Logs Pagination controls */}
          {logPagination && logPagination.pages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Log Page <span className="font-bold text-slate-600 dark:text-slate-300">{logPagination.page}</span> of <span className="font-bold text-slate-600 dark:text-slate-300">{logPagination.pages}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogPage(prev => Math.max(prev - 1, 1))}
                  disabled={logPage === 1}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4.5 h-4.5" />
                </button>
                <button
                  onClick={() => setLogPage(prev => Math.min(prev + 1, logPagination.pages))}
                  disabled={logPage === logPagination.pages}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                >
                  <ChevronRight className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Log Details Inspector modal dialog */}
      {inspectLog && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <button
              onClick={() => setInspectLog(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-200"
            >
              Close
            </button>
            <h3 className="text-base font-bold mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-500" />
              <span>Inspect Audit Transaction</span>
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold py-2 border-b border-slate-100 dark:border-slate-800">
                <div>Action: <span className="text-slate-400">{inspectLog.action}</span></div>
                <div>Resource: <span className="text-slate-400">{inspectLog.resource}</span></div>
                <div>IP Address: <span className="text-slate-400">{inspectLog.ipAddress}</span></div>
                <div>User: <span className="text-slate-400">{inspectLog.userId ? inspectLog.userId.name : 'Guest'}</span></div>
              </div>
              <div className="space-y-1.5">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Payload / State details</span>
                <pre className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border border-slate-200/50 dark:border-slate-800/60 rounded-xl text-[10px] text-slate-600 dark:text-slate-350 font-mono overflow-auto max-h-48">
                  {JSON.stringify(inspectLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
