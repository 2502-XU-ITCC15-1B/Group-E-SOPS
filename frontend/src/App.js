import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
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

    // Apply immediately on mount
    applyTheme();

    // Listen for same-tab changes from Dashboard toggle
    window.addEventListener('theme-change', applyTheme);
    // Listen for cross-tab changes
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
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
                  </main>                </AdminRoute>
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
