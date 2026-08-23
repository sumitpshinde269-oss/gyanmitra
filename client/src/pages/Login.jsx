import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async (demoUsername) => {
    try {
      setError('');
      setSubmitting(true);
      await login(demoUsername, 'password123');
      navigate('/');
    } catch (err) {
      setError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-slate-50 to-slate-100/60">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200/60 overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="bg-indigo-600 p-6 text-center text-white">
          <h1 className="text-2xl font-extrabold tracking-tight">GyanMitra</h1>
          <p className="text-indigo-100 text-xs mt-1">Village Peer-Tutoring Portal</p>
        </div>

        <div className="p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg mb-4 border border-red-200">
              Error: {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition duration-200 shadow-sm disabled:opacity-50 text-sm"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider text-[10px]">
                Quick Demo Login
              </span>
            </div>
          </div>

          {/* Quick Demo Access Buttons */}
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleDemoLogin('coordinator')}
              disabled={submitting}
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl transition duration-150 text-left font-medium disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-sm font-bold leading-none text-slate-800">Coordinator Portal</p>
                  <p className="text-xs text-slate-500 mt-1">Amit Patel (Manage & Level-Up)</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Try</span>
            </button>

            <button
              onClick={() => handleDemoLogin('tutor1')}
              disabled={submitting}
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl transition duration-150 text-left font-medium disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-sm font-bold leading-none text-slate-800">Tutor Panel (Senior Student)</p>
                  <p className="text-xs text-slate-500 mt-1">Priya Sharma (Submit logs)</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Try</span>
            </button>

            <button
              onClick={() => handleDemoLogin('parent1')}
              disabled={submitting}
              className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/80 text-slate-700 border border-slate-200 px-4 py-2.5 rounded-xl transition duration-150 text-left font-medium disabled:opacity-50"
            >
              <div className="flex items-center space-x-2">
                <div>
                  <p className="text-sm font-bold leading-none text-slate-800">Parent Check-in Portal</p>
                  <p className="text-xs text-slate-500 mt-1">Rajesh Kumar (Consent & Check-in)</p>
                </div>
              </div>
              <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Try</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

