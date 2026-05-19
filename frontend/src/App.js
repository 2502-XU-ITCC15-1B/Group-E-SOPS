import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './components/landing/LandingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import MemberProfile from './components/members/MemberProfile';
import AdminPanel from './components/admin/AdminPanel';
import ExecutivePanel from './components/executive/ExecutivePanel';
import Directory from './components/directory/Directory';
import Navigation from './components/layout/Navigation';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AdminRoute } from './components/auth/AdminRoute';
import { ExecutiveRoute } from './components/auth/ExecutiveRoute';
import './App.css';

/**
 * PublicRoute: if the user is already authenticated, log them out first
 * then render the public page. Uses a ref so it only fires once per mount,
 * preventing interference with the login / Google SSO flows.
 */
function PublicRoute({ children }) {
  const { currentUser, logout, loading } = useAuth();
  const [ready, setReady] = React.useState(false);
  const didRun = React.useRef(false);

  React.useEffect(() => {
    if (loading) return;

    if (didRun.current) return;
    didRun.current = true;

    if (currentUser) {
      // A session is active — the user navigated back, so end it.
      logout()
        .catch((err) => console.error('PublicRoute logout error:', err))
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, [loading, currentUser, logout]);

  if (loading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#241f1f]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-600 border-t-[#f04b4b]" />
      </div>
    );
  }

  return children;
}

function App() {
  // Apply dark mode class to html element (source of truth)
  React.useEffect(() => {
    const applyTheme = () => {
      const isDark = localStorage.getItem('theme') === 'dark';
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    window.addEventListener('theme-change', applyTheme);
    window.addEventListener('storage', applyTheme);

    return () => {
      window.removeEventListener('theme-change', applyTheme);
      window.removeEventListener('storage', applyTheme);
    };
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes — terminate any active session on arrival */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            {/* Register keeps its own flow (no auto-logout needed) */}
            <Route path="/register" element={<Register />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                    <Dashboard />
                  </main>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                    <MemberProfile />
                  </main>
                </ProtectedRoute>
              }
            />
            <Route
              path="/directory"
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                    <Directory />
                  </main>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                    <AdminPanel />
                  </main>
                </AdminRoute>
              }
            />
            <Route
              path="/executive"
              element={
                <ExecutiveRoute>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                    <ExecutivePanel />
                  </main>
                </ExecutiveRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;