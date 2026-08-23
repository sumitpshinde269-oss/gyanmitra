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
      <div className="min-h-screen flex items-center justify-center bg-slate-50/20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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
    <div className="min-h-screen flex flex-col bg-slate-50/40">
      {/* Top Header Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm text-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight text-indigo-600 hover:text-indigo-700 transition-colors">
              GyanMitra
            </span>
          </Link>

          {user && (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-semibold leading-tight text-slate-700">{user.name}</p>
                <p className="text-[10px] text-slate-400 capitalize mt-0.5">
                  {user.role === 'coordinator' ? 'Coordinator' : user.role === 'school_admin' ? 'School Admin' : user.role} &bull; {user.schoolName}
                </p>
              </div>
              <button
                onClick={logout}
                className="bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-700 transition px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-6xl w-full mx-auto p-4 sm:p-6 pb-20 animate-fade-in">
        {children}
      </main>

      {/* Bottom Footer Accent */}
      <footer className="bg-white border-t border-slate-100 py-4 text-center text-xs text-slate-400">
        <div className="flex justify-center space-x-2 items-center">
          <span>Peer-Tutoring Portal</span>
          <span>&bull;</span>
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50/20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
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

