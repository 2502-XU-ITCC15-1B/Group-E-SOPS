import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection,
  query,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
  Users,
  Shield,
  Edit,
  Trash2,
  Eye,
  Search,
  FileText,
  Activity,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

const AdminPanel = () => {
  const { currentUser, updateUserRole, adminDeleteUser, logEvent, resolvePasswordRequest } = useAuth();
  const [users, setUsers] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [passwordRequests, setPasswordRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleThemeChange = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('theme-change', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    return () => {
      window.removeEventListener('theme-change', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('users');

  useEffect(() => {
    fetchUsers();
    fetchSystemLogs();
    fetchPasswordRequests();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      const systemLogsQuery = query(
        collection(db, 'systemLogs'),
        orderBy('timestamp', 'desc'),
        limit(200)
      );
      const systemLogsSnapshot = await getDocs(systemLogsQuery);
      const logs = systemLogsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSystemLogs(logs);
    } catch (error) {
      console.error('Error fetching system logs:', error);
      toast.error('Failed to fetch system logs');
    }
  };

  const fetchPasswordRequests = async () => {
    try {
      setRequestsLoading(true);
      const q = query(
        collection(db, 'passwordResetRequests'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      setPasswordRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error('Error fetching password requests:', error);
      toast.error('Failed to fetch password requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('User role updated successfully');
      await logEvent({ type: 'role_change', targetUserId: userId, newRole, performedBy: currentUser.uid, email: currentUser.email });
      fetchSystemLogs();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await adminDeleteUser(userId);
        setUsers(users.filter(user => user.id !== userId));
        toast.success('User deleted successfully');
        await logEvent({ type: 'user_deleted', targetUserId: userId, performedBy: currentUser.uid, email: currentUser.email });
        fetchSystemLogs();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Failed to delete user');
      }
    }
  };

  const handleToggleActive = async (user) => {
    try {
      await updateDoc(doc(db, 'users', user.id), {
        isActive: user.isActive === false ? true : false,
        updatedAt: new Date().toISOString()
      });
      setUsers(users.map(u => u.id === user.id ? { ...u, isActive: user.isActive === false ? true : false } : u));
      await logEvent({ type: 'status_change', targetUserId: user.id, isActive: user.isActive === false ? true : false, performedBy: currentUser.uid, email: currentUser.email });
      fetchSystemLogs();
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleResolveRequest = async (request, action) => {
    try {
      await resolvePasswordRequest({
        requestId: request.id,
        action,
        adminNote: adminNotes[request.id] || '',
        email: request.email
      });
      toast.success(
        action === 'resolved'
          ? `Password reset email sent to ${request.email}`
          : 'Request marked as rejected'
      );
      fetchPasswordRequests();
      fetchSystemLogs();
    } catch (error) {
      console.error('Error resolving request:', error);
      toast.error('Failed to process request');
    }
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'role_change': return 'bg-blue-100 text-blue-800';
      case 'announcement': return 'bg-green-100 text-green-800';
      case 'user_deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'role_change': return <Shield className="h-4 w-4" />;
      case 'announcement': return <FileText className="h-4 w-4" />;
      case 'user_deleted': return <Trash2 className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'executive': return 'text-yellow-600 bg-yellow-100';
      case 'member': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'executive': return <Users className="h-4 w-4" />;
      case 'member': return <Users className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      <Helmet>
        <title>Admin Panel — XCITeS SOPS</title>
        <meta name="description" content="XCITeS administrator control panel." />
      </Helmet>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage users, roles, system logs, and settings
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setSelectedTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="inline h-4 w-4 mr-2" />
            User Management
          </button>
          <button
            onClick={() => setSelectedTab('logs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'logs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText className="inline h-4 w-4 mr-2" />
            System Logs
          </button>
          <button
            onClick={() => setSelectedTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="inline h-4 w-4 mr-2" />
            Password Requests
          </button>
        </nav>
      </div>

      {/* ── USERS TAB ── */}
      {selectedTab === 'users' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{users.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Shield className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Executives</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter(u => u.role === 'executive').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Members</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {users.filter(u => u.role === 'member').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Management</h3>
            </div>
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="executive">Executive</option>
                    <option value="member">Member</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          disabled={user.id === currentUser.uid}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)} border-0 focus:ring-2 focus:ring-blue-500`}
                        >
                          <option value="member">Member</option>
                          <option value="executive">Executive</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${user.isActive === false ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'}`}
                        >
                          {user.isActive === false ? 'Inactive' : 'Active'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { setSelectedUser(user); setShowUserModal(true); }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { setEditingUser(user); setSelectedUser(user); setShowUserModal(true); }}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {user.id !== currentUser.uid && (
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No users found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria.</p>
              </div>
            )}
          </div>

          {/* User Detail / Edit Modal */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {editingUser ? 'Edit User' : 'User Details'}
                    </h3>
                    <button
                      onClick={() => { setShowUserModal(false); setEditingUser(null); setSelectedUser(null); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ×
                    </button>
                  </div>
                  {editingUser ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                        <select
                          value={selectedUser.department || ''}
                          onChange={async (e) => {
                            try {
                              await updateDoc(doc(db, 'users', selectedUser.id), {
                                department: e.target.value,
                                updatedAt: new Date().toISOString()
                              });
                              setSelectedUser({ ...selectedUser, department: e.target.value });
                              setUsers(users.map(u => u.id === selectedUser.id ? { ...u, department: e.target.value } : u));
                              await logEvent({
                                type: 'profile_update',
                                userId: selectedUser.id,
                                email: selectedUser.email,
                                action: `Department updated to ${e.target.value}`,
                                performedBy: currentUser.uid
                              });
                              fetchSystemLogs();
                              toast.success('Department updated successfully');
                            } catch (error) {
                              toast.error('Failed to update department');
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select Department</option>
                          <option value="Media Relations & Creatives">Media Relations & Creatives</option>
                          <option value="Events & Logistics">Events & Logistics</option>
                          <option value="Student Services & Academics">Student Services & Academics</option>
                          <option value="Social Engagement & External Affairs">Social Engagement & External Affairs</option>
                          <option value="Recreation & Sports">Recreation & Sports</option>
                        </select>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => { setShowUserModal(false); setEditingUser(null); setSelectedUser(null); }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                          {getRoleIcon(selectedUser.role)}
                          <span className="ml-1 capitalize">{selectedUser.role}</span>
                        </span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                        <p className="text-gray-900 dark:text-white">{selectedUser.department || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Member Since</label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => { setShowUserModal(false); setSelectedUser(null); }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── SYSTEM LOGS TAB ── */}
      {selectedTab === 'logs' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Activity Logs</h3>
            <button onClick={fetchSystemLogs} className="text-sm text-blue-600 hover:text-blue-800">
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {systemLogs.length > 0 ? systemLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLogTypeColor(log.type)}`}>
                        {getLogIcon(log.type)}
                        <span className="ml-1 capitalize">{log.type?.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.action || log.type || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.email || log.performedBy || log.userId || 'System'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                      {log.details || (log.newRole ? `New Role: ${log.newRole}` : 'No extra details')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                      No system logs available.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PASSWORD REQUESTS TAB ── */}
      {selectedTab === 'requests' && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Password Assistance Requests
            </h3>
            <button onClick={fetchPasswordRequests} className="text-sm text-blue-600 hover:text-blue-800">
              Refresh
            </button>
          </div>
          {requestsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : passwordRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm">No password assistance requests yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {passwordRequests.map((req) => (
                <div key={req.id} className="px-6 py-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {req.email}
                        </p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          req.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : req.status === 'resolved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                      {req.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          <span className="font-medium">Reason:</span> {req.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        Submitted: {req.createdAt?.toDate
                          ? new Date(req.createdAt.toDate()).toLocaleString()
                          : 'Unknown'}
                      </p>
                      {req.adminNote && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span className="font-medium">Note:</span> {req.adminNote}
                        </p>
                      )}
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex flex-col gap-2 min-w-[220px]">
                        <input
                          type="text"
                          placeholder="Admin note (optional)"
                          value={adminNotes[req.id] || ''}
                          onChange={(e) =>
                            setAdminNotes((prev) => ({ ...prev, [req.id]: e.target.value }))
                          }
                          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolveRequest(req, 'resolved')}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition"
                          >
                            Send Reset Email
                          </button>
                          <button
                            onClick={() => handleResolveRequest(req, 'rejected')}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;