import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'coordinator'
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  return minLength && hasNumber && hasLetter && hasSpecial;
};

function Register() {
  const [formData, setFormData] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const { t, language, setLanguage, supportedLanguages } = useLanguage();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = `${t('name')} is required.`;
    }

    if (!formData.email.trim()) {
      nextErrors.email = `${t('email')} is required.`;
    } else if (!validateEmail(formData.email)) {
      nextErrors.email = t('validEmail');
    }

    if (!formData.password) {
      nextErrors.password = `${t('password')} is required.`;
    } else if (!validatePassword(formData.password)) {
      nextErrors.password = t('passwordHint');
    }

    if (!formData.role) {
      nextErrors.role = `${t('role')} is required.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        username: formData.email,
        password: formData.password,
        role: formData.role,
        name: formData.name
      };

      const response = await axios.post('/api/auth/register', payload);

      if (response.data?.token) {
        localStorage.setItem('token', response.data.token);
      }

      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed. Please try again.';
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-end">
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

        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('createAccount')}</h1>
          <p className="mt-2 text-sm text-slate-500">{t('joinApp')}</p>
        </div>

        {apiError && (
          <div className="mb-5 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('name')}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder={t('registerName')}
            />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('email')}
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder={t('registerEmail')}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('password')}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder={t('registerPassword')}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('role')}
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <option value="coordinator">{t('coordinator')}</option>
              <option value="tutor">{t('tutor')}</option>
              <option value="parent">{t('parent')}</option>
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-600">{errors.role}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? t('registering') : t('register')}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          {t('alreadyHaveAccount')}{' '}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="font-semibold text-slate-900 underline underline-offset-2"
          >
            {t('signInLink')}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Register;
