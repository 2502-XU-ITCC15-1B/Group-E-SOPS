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
import './App.css';

// Protected Route Component with enhanced RBAC
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Require authentication token (currentUser) for all protected routes
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check role-based access if specific roles are required
  if (allowedRoles.length > 0 && (!userRole || !allowedRoles.includes(userRole))) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  // Apply dark mode class to html element
  React.useEffect(() => {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Listen for theme changes
    const handleStorageChange = () => {
      const newIsDarkMode = localStorage.getItem('theme') === 'dark';
      if (newIsDarkMode) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50">
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
                  <main className="min-h-screen bg-gray-50">
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
                  <main className="min-h-screen bg-gray-50">
                    <Directory />
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50">
                    <AdminPanel />
                  </main>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/executive" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'executive']}>
                  <Navigation />
                  <main className="min-h-screen bg-gray-50">
                    <ExecutivePanel />
                  </main>
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
