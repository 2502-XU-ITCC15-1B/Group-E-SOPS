import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  Shield, 
  LogOut,
  User,
  Bell,
  BookOpen
} from 'lucide-react';
import { collection, query, orderBy, limit, where, deleteDoc, doc, onSnapshot } from 'firebase/firestore';

import { db } from '../../firebase/config';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { currentUser, userRole, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleDeleteNotification = async (notificationId) => {
    try {
      await deleteDoc(doc(db, 'notifications', notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    if (!currentUser || ['/', '/login', '/register'].includes(location.pathname)) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setNotifications(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => console.warn('Notifications listener error', err)
    );

    return unsubscribe;
  }, [currentUser, location.pathname]);


  // Don't show navigation on landing page, login, or register
  if (!currentUser || ['/', '/login', '/register'].includes(location.pathname)) return null;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg dark:border-b dark:border-gray-700 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex-shrink-0 flex items-center text-gray-900 dark:text-gray-100">
              <span className="ml-2 text-lg font-semibold text-gray-900">
                
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/dashboard')
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
              }`}
            >
              <Home className="inline h-4 w-4 mr-1" />
              Dashboard
            </Link>

            <Link
              to="/profile"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/profile')
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
              }`}
            >
              <User className="inline h-4 w-4 mr-1" />
              Profile
            </Link>

            <Link
              to="/directory"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                isActive('/directory')
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
              }`}
            >
              <BookOpen className="inline h-4 w-4 mr-1" />
              Directory
            </Link>

            {userRole === 'executive' && (
              <Link
                to="/executive"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/executive')
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
                }`}
              >
                <Users className="inline h-4 w-4 mr-1" />
                Executive
              </Link>
            )}

            {userRole === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  isActive('/admin')
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
                }`}
              >
                <Shield className="inline h-4 w-4 mr-1" />
                Admin
              </Link>
            )}

            <div className="flex items-center space-x-4 relative">
              <button
                onClick={() => setShowNotifications((p) => !p)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Bell className="h-5 w-5 text-gray-600" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-72 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-100 dark:border-gray-700 z-50">
                  <div className="px-4 py-2 border-b dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-gray-100">Notifications</div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                    )}
                    {notifications.map((n) => (
                      <div key={n.id} className={`px-4 py-3 border-b dark:border-gray-700 last:border-b-0 ${!n.read ? 'bg-blue-50 dark:bg-blue-900/50' : ''} relative`}>
                        <div className="pr-12">
                          <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{n.title}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{n.content}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleString() : ''}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(n.id)}
                          className="absolute top-2 right-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded opacity-100"
                          title="Delete notification"
                        >
                          <X className="h-3 w-3 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/50"
              >
                <LogOut className="inline h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white dark:bg-gray-900 border-t dark:border-gray-700">
            <Link
              to="/dashboard"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/dashboard')
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <Home className="inline h-4 w-4 mr-2" />
              Dashboard
            </Link>

            <Link
              to="/profile"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/profile')
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <User className="inline h-4 w-4 mr-2" />
              Profile
            </Link>

            <Link
              to="/directory"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/directory')
                  ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                  : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <BookOpen className="inline h-4 w-4 mr-2" />
              Directory
            </Link>

            {userRole === 'executive' && (
              <Link
                to="/executive"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/executive')
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Users className="inline h-4 w-4 mr-2" />
                Executive
              </Link>
            )}

            {userRole === 'admin' && (
              <Link
                to="/admin"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/admin')
                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/50'
                    : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/50'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Shield className="inline h-4 w-4 mr-2" />
                Admin
              </Link>
            )}

            <div className="border-t dark:border-gray-700 pt-4 mt-4">
              <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
                {currentUser.displayName || currentUser.email}
              </div>
              <div className="px-3 py-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  userRole === 'admin' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    : userRole === 'executive'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                    : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                }`}>
                  {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
