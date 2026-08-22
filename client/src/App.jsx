import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import ConsentForm from './pages/ConsentForm';
import CoordinatorDashboard from './pages/CoordinatorDashboard';
import ParentCheckIn from './pages/ParentCheckIn';
import TutorPanel from './pages/TutorPanel';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-amber-50/20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home if they don't have access
    return <Navigate to="/" replace />;
  }

  return children;
};

// Base App Layout Component
const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();

  return (
    <div class="min-h-screen flex flex-col bg-slate-50">
      {/* Top Header Navigation */}
      <header class="bg-gradient-to-r from-amber-500 to-amber-600 shadow-md text-white border-b border-amber-700/20 sticky top-0 z-50">
        <div class="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" class="flex items-center space-x-2">
            <span class="text-2xl font-bold tracking-wide flex items-center">
              📙 GyanMitra
            </span>
          </Link>

          {user && (
            <div class="flex items-center space-x-4">
              <div class="hidden sm:block text-right">
                <p class="text-sm font-semibold leading-tight">{user.name}</p>
                <p class="text-xs text-amber-100 capitalize">
                  {user.role === 'coordinator' ? 'Coordinator' : user.role === 'school_admin' ? 'School Admin' : user.role} • {user.schoolName}
                </p>
              </div>
              <button
                onClick={logout}
                class="bg-amber-700/40 hover:bg-amber-700/70 transition px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-400/20"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main class="flex-grow max-w-6xl w-full mx-auto p-4 sm:p-6 pb-20">
        {children}
      </main>

      {/* Bottom Footer Accent */}
      <footer class="bg-slate-100 border-t border-slate-200 py-3 text-center text-xs text-slate-500">
        <div class="flex justify-center space-x-2 items-center">
          <span>🇮🇳 Peer-Tutoring Portal</span>
          <span>•</span>
          <span>Made for Village Schools</span>
        </div>
      </footer>
    </div>
  );
};

// Main Router Page Dispatcher (Home redirection based on roles)
const HomeRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-amber-50/20">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to their specific dashboard based on their role
  switch (user.role) {
    case 'coordinator':
    case 'school_admin':
      return <Navigate to="/coordinator" replace />;
    case 'tutor':
      return <Navigate to="/tutor" replace />;
    case 'parent':
      return <Navigate to="/check-in" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            path="/coordinator"
            element={
              <ProtectedRoute allowedRoles={['coordinator', 'school_admin']}>
                <AppLayout>
                  <CoordinatorDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor"
            element={
              <ProtectedRoute allowedRoles={['tutor']}>
                <AppLayout>
                  <TutorPanel />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/check-in"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <AppLayout>
                  <ParentCheckIn />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/consent"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <AppLayout>
                  <ConsentForm />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Home Dispatcher / Fallback */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
