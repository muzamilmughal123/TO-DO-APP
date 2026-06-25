import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

const Login = () => {
  const { loginUser, googleLogin } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.warning('Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await loginUser(formData.email, formData.password);
    setLoading(false);

    if (result.success) {
      toast.success(result.message);
      navigate('/');
    } else {
      toast.error(result.message);
    }
  };

  // Triggers premium mock Google Authentication workflow
  const handleGoogleLoginMock = async () => {
    setGoogleLoading(true);
    toast.info('Initiating mock Google sign-in...', { autoClose: 1500 });
    
    setTimeout(async () => {
      const mockGoogleUser = {
        email: 'manager.team@google.com',
        name: 'Alex Johnson',
        googleId: 'g_10283928472918',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      };

      const result = await googleLogin(mockGoogleUser);
      setGoogleLoading(false);

      if (result.success) {
        toast.success('Signed in via Google successfully!');
        navigate('/');
      } else {
        toast.error('Google Sign-in failed.');
      }
    }, 1800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-100 px-4 relative overflow-hidden">
      
      {/* Background Neon Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] animate-pulse delay-700"></div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-950/60 border border-slate-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10">
        
        {/* Title */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-3">
            <span className="text-white font-extrabold text-xl">A</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="text-slate-400 text-sm mt-1 text-center">
            Sign in to manage tasks powered by Artificial Intelligence.
          </p>
        </div>

        {/* Credentials form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/80 transition-all text-slate-100 placeholder-slate-500"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="w-5 h-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/80 transition-all text-slate-100 placeholder-slate-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary py-3 flex justify-center items-center font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg hover:from-blue-500 hover:to-indigo-500 transition-all duration-200"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider separator - TEMPORARILY DISABLED */}
        {/* <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-950 px-3 text-slate-500 font-medium">Or continue with</span>
          </div>
        </div> */}

        {/* Google OAuth action - TEMPORARILY DISABLED */}
        {/* <button
          onClick={handleGoogleLoginMock}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/80 transition-colors font-medium text-sm text-slate-200"
        >
          {googleLoading ? (
            <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.24 1 3.2 3.65 1.13 7.57l3.87 3C6 7.8 8.78 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.45 12.3c0-.82-.07-1.6-.2-2.3H12v4.4h6.43c-.28 1.48-1.12 2.74-2.38 3.58l3.69 2.87c2.16-2 3.71-4.94 3.71-8.55z"
                />
                <path
                  fill="#FBBC05"
                  d="M5 10.57c-.24-.72-.37-1.48-.37-2.27s.13-1.55.37-2.27l-3.87-3C.41 4.54 0 6.22 0 8.3s.41 3.76 1.13 5.27l3.87-3z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.69-2.87c-1.02.68-2.33 1.09-4.27 1.09-3.22 0-6-2.76-7-5.53l-3.87 3C3.2 20.35 7.24 23 12 23z"
                />
              </svg>
              <span>Sign in with Google (Mock)</span>
            </>
          )}
        </button> */}

        {/* Route footer */}
        <p className="mt-8 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold underline-offset-4 hover:underline transition-colors">
            Register now
          </Link>
        </p>

        {/* Demo Credentials Box */}
        <div className="mt-6 bg-slate-900/30 border border-slate-800/40 p-3.5 rounded-2xl flex flex-col gap-1 text-[11px] text-slate-400">
          <p className="font-bold text-slate-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Quick Demo Accounts (Email / Password):
          </p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1 font-mono">
            <div>Admin: <span className="text-blue-300">admin@task.com</span></div>
            <div>Pass: <span className="text-blue-300">admin123</span></div>
            <div>Manager: <span className="text-blue-300">manager@task.com</span></div>
            <div>Pass: <span className="text-blue-300">manager123</span></div>
            <div>User: <span className="text-blue-300">user@task.com</span></div>
            <div>Pass: <span className="text-blue-300">user123</span></div>
          </div>
          {/* <p className="text-[10px] text-slate-500 mt-1 italic">
            *You can also click the Google button to instantly log in as a Manager.
          </p> */}
        </div>

      </div>
    </div>
  );
};

export default Login;
