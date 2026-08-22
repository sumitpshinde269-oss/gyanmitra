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
    <div class="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-amber-50 to-amber-100">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div class="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center text-white">
          <span class="text-4xl">📙</span>
          <h1 class="text-3xl font-extrabold tracking-tight mt-2">GyanMitra</h1>
          <p class="text-amber-100 text-sm mt-1">Village Peer-Tutoring Portal</p>
        </div>

        <div class="p-6 sm:p-8">
          {error && (
            <div class="bg-red-50 text-red-700 text-sm p-3 rounded-lg mb-4 border border-red-200">
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-600 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                class="w-full px-4 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-xs uppercase">
              <span class="bg-white px-3 text-slate-500 font-semibold">
                Quick Demo Login
              </span>
            </div>
          </div>

          {/* Quick Demo Access Buttons */}
          <div class="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleDemoLogin('coordinator')}
              disabled={submitting}
              class="flex items-center justify-between bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-4 py-2.5 rounded-xl transition duration-150 text-left font-medium disabled:opacity-50"
            >
              <div class="flex items-center space-x-2">
                <span>🔑</span>
                <div>
                  <p class="text-sm font-bold leading-none">Coordinator Portal</p>
                  <p class="text-xs text-amber-700/80 mt-0.5">Amit Patel (Manage / Level-Up)</p>
                </div>
              </div>
              <span class="text-xs bg-amber-200/60 px-2 py-0.5 rounded font-bold">Try</span>
            </button>

            <button
              onClick={() => handleDemoLogin('tutor1')}
              disabled={submitting}
              class="flex items-center justify-between bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 px-4 py-2.5 rounded-xl transition duration-150 text-left font-medium disabled:opacity-50"
            >
              <div class="flex items-center space-x-2">
                <span>✍️</span>
                <div>
                  <p class="text-sm font-bold leading-none">Tutor Panel (Senior Student)</p>
                  <p class="text-xs text-teal-700/80 mt-0.5">Priya Sharma (Submit logs)</p>
                </div>
              </div>
              <span class="text-xs bg-teal-200/60 px-2 py-0.5 rounded font-bold">Try</span>
            </button>

            <button
              onClick={() => handleDemoLogin('parent1')}
              disabled={submitting}
              class="flex items-center justify-between bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 px-4 py-2.5 rounded-xl transition duration-150 text-left font-medium disabled:opacity-50"
            >
              <div class="flex items-center space-x-2">
                <span>👨‍👩‍👦</span>
                <div>
                  <p class="text-sm font-bold leading-none">Parent Check-in Portal</p>
                  <p class="text-xs text-sky-700/80 mt-0.5">Rajesh Kumar (Consent & Check-in)</p>
                </div>
              </div>
              <span class="text-xs bg-sky-200/60 px-2 py-0.5 rounded font-bold">Try</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
