import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const getDashboardRoute = (role) => {
    switch (role) {
      case 'coordinator':
      case 'school_admin':
        return '/coordinator';
      case 'tutor':
        return '/tutor';
      case 'parent':
        return '/check-in';
      default:
        return '/login';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email and password.');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const user = await login(email, password);
      const redirectPath = getDashboardRoute(user?.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err || 'Unable to sign in. Please check your credentials and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoUsername) => {
    try {
      setError('');
      setSubmitting(true);
      const user = await login(demoUsername, 'password123');
      const redirectPath = getDashboardRoute(user?.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err || 'Unable to sign in with the demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-6 bg-slate-50/50">
      <div className="max-w-md w-full bg-white border border-slate-200 p-8 sm:p-10 rounded shadow-sm animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">GYANMITRA</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">Village Peer-Tutoring Portal</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded mb-6 border border-red-200">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-950 text-sm placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-950 text-sm placeholder:text-slate-300"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded transition duration-200 disabled:opacity-50 text-xs uppercase tracking-wider"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-slate-900 underline underline-offset-2"
            >
              Create one
            </button>
          </p>
        </div>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-slate-400 font-semibold tracking-widest text-[9px]">
              Quick Demo Access
            </span>
          </div>
        </div>

        {/* Quick Demo Access Buttons */}
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => handleDemoLogin('coordinator')}
            disabled={submitting}
            className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-4 py-3.5 rounded transition duration-150 text-left disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-850">Coordinator Portal</p>
              <p className="text-xs text-slate-400 mt-0.5">Amit Patel (Manage & Level-Up)</p>
            </div>
            <span className="text-[10px] border border-slate-200 text-slate-500 px-2.5 py-1 rounded font-semibold uppercase tracking-wider bg-slate-50">Try</span>
          </button>

          <button
            onClick={() => handleDemoLogin('tutor1')}
            disabled={submitting}
            className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-4 py-3.5 rounded transition duration-150 text-left disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-850">Tutor Panel</p>
              <p className="text-xs text-slate-400 mt-0.5">Priya Sharma (Senior Student)</p>
            </div>
            <span className="text-[10px] border border-slate-200 text-slate-500 px-2.5 py-1 rounded font-semibold uppercase tracking-wider bg-slate-50">Try</span>
          </button>

          <button
            onClick={() => handleDemoLogin('parent1')}
            disabled={submitting}
            className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-4 py-3.5 rounded transition duration-150 text-left disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-850">Parent Check-in</p>
              <p className="text-xs text-slate-400 mt-0.5">Rajesh Kumar (Consent & Quiz)</p>
            </div>
            <span className="text-[10px] border border-slate-200 text-slate-500 px-2.5 py-1 rounded font-semibold uppercase tracking-wider bg-slate-50">Try</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

