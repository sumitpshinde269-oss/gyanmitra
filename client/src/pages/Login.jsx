import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
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
      setError(t('enterCredentials'));
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setError(t('validEmail'));
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      const user = await login(email, password);
      const redirectPath = getDashboardRoute(user?.role);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err || t('loginError'));
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
        <div className="flex justify-end mb-4">
          <label className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-600">
            <span>{t('language')}</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700 outline-none"
              aria-label={t('selectLanguage')}
            >
              {supportedLanguages.map((item) => (
                <option key={item.code} value={item.code}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-lg font-bold tracking-tight text-slate-900">{t('appTitle')}</h1>
          <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-semibold">{t('portalSubtitle')}</p>
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
              {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('loginEmail')}
              className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-950 text-sm placeholder:text-slate-300"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('enterPassword')}
              className="w-full px-4 py-3 border border-slate-200 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-950 text-sm placeholder:text-slate-300"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3.5 rounded transition duration-200 disabled:opacity-50 text-xs uppercase tracking-wider"
          >
            {submitting ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-xs text-slate-500">
            {t('noAccount')}{' '}
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="font-semibold text-slate-900 underline underline-offset-2"
            >
              {t('createOne')}
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
              {t('quickDemoAccess')}
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
              <p className="text-sm font-semibold text-slate-850">{t('coordinatorPortal')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('demoCoordinator')}</p>
            </div>
            <span className="text-[10px] border border-slate-200 text-slate-500 px-2.5 py-1 rounded font-semibold uppercase tracking-wider bg-slate-50">{t('tryDemo')}</span>
          </button>

          <button
            onClick={() => handleDemoLogin('tutor1')}
            disabled={submitting}
            className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-4 py-3.5 rounded transition duration-150 text-left disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-850">{t('tutorPanel')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('demoTutor')}</p>
            </div>
            <span className="text-[10px] border border-slate-200 text-slate-500 px-2.5 py-1 rounded font-semibold uppercase tracking-wider bg-slate-50">{t('tryDemo')}</span>
          </button>

          <button
            onClick={() => handleDemoLogin('parent1')}
            disabled={submitting}
            className="flex items-center justify-between bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-4 py-3.5 rounded transition duration-150 text-left disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-semibold text-slate-850">{t('parentCheckIn')}</p>
              <p className="text-xs text-slate-400 mt-0.5">{t('demoParent')}</p>
            </div>
            <span className="text-[10px] border border-slate-200 text-slate-500 px-2.5 py-1 rounded font-semibold uppercase tracking-wider bg-slate-50">{t('tryDemo')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

