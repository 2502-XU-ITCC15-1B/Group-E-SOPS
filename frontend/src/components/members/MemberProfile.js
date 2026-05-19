import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Helmet } from 'react-helmet-async';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Edit, 
  Save, 
  X,
  Phone,
  MapPin,
  Briefcase,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

const MemberProfile = () => {
  const { currentUser, userRole, logout, deleteSelf, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
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
  const handleChangePassword = async () => {
    try {
      setChangingPassword(true);
      await resetPassword(currentUser.email);
      toast.success('Password reset email sent! Check your inbox.');
      setShowPasswordChange(false);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setProfile(userData);
          reset(userData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [currentUser.uid, reset]);

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      const normalizedData = {
        ...data,
        phone: data.phone ? data.phone.replace(/^(0|(\+63)|63)/, '') : ''
      };
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...normalizedData,
        updatedAt: serverTimestamp()
      });
      
      setProfile({ ...profile, ...normalizedData });
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setSaving(true);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        isActive: false,
        deactivatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setProfile({ ...profile, isActive: false });
      toast.success('Profile deactivated successfully!');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deactivating profile:', error);
      toast.error('Failed to deactivate profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteSelf();
      toast.success('Profile deleted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100 dark:text-red-300 dark:bg-red-900/50';
      case 'executive': return 'text-yellow-600 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/50';
      case 'member': return 'text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900/50';
      default: return 'text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-gray-700';
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Profile — XCITeS SOPS</title>
        <meta name="description" content="Manage your XCITeS member profile." />
      </Helmet>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your personal information and account settings
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(userRole)}`}>
              {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
            </span>
            {!isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 rounded-md shadow-sm text-sm font-medium text-red-700 dark:text-red-300 bg-white dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete/Deactivate
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    reset(profile);
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </button>
                <button
                  form="profile-form"
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form id="profile-form" onSubmit={handleSubmit(onSubmit)}>
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg transition-colors duration-300">
          {/* Basic Information */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Basic Information</h3>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  First Name
                </label>
                {isEditing ? (
                  <input
                    {...register('firstName', { required: 'First name is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">{profile?.firstName || 'Not provided'}</p>
                )}
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Name
                </label>
                {isEditing ? (
                  <input
                    {...register('lastName', { required: 'Last name is required' })}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">{profile?.lastName || 'Not provided'}</p>
                )}
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <p className="text-gray-900 dark:text-gray-100">{currentUser.email}</p>
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">(Cannot be changed)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-300 text-sm">
                        +63
                      </span>
                      <input
                        {...register('phone', {
                          pattern: {
                            value: /^9\d{9}$/,
                            message: 'Enter a valid Philippine mobile number (e.g. 9171234567)'
                          }
                        })}
                        type="tel"
                        maxLength={10}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        placeholder="9171234567"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">
                    {profile?.phone ? `+63 ${profile.phone}` : 'Not provided'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Birthday
                </label>
                {isEditing ? (
                  <input
                    {...register('birthday')}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">
                    {profile?.birthday ? new Date(profile.birthday).toLocaleDateString() : 'Not provided'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Organizational Position
                </label>
                {isEditing ? (
                  <select
                    {...register('organizationPosition')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Position</option>
                    <option value="Member">Member</option>
                    <option value="Volunteer">Volunteer</option>
                    <option value="Committee Member">Committee Member</option>
                    <option value="Events Staff">Events Staff</option>
                    <option value="Auditor">Auditor</option>
                    <option value="Secretary">Secretary</option>
                    <option value="Treasurer">Treasurer</option>
                    <option value="Vice President">Vice President</option>
                    <option value="President">President</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">{profile?.organizationPosition || 'Not provided'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Department
                </label>
                {isEditing ? (
                  <select
                    {...register('department')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Department</option>
                    <option value="Media Relations & Creatives">Media Relations & Creatives</option>
                    <option value="Events & Logistics">Events & Logistics</option>
                    <option value="Student Services & Academics">Student Services & Academics</option>
                    <option value="Social Engagement & External Affairs">Social Engagement & External Affairs</option>
                    <option value="Recreation & Sports">Recreation & Sports</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-gray-100">{profile?.department || 'Not provided'}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              {isEditing ? (
                <input
                  {...register('location')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="City, State/Province"
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100">{profile?.location || 'Not provided'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  {...register('bio')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900 dark:text-gray-100">{profile?.bio || 'No bio provided'}</p>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Account Information</h3>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role
                </label>
                <div className="flex items-center">
                  <Shield className="h-5 w-5 text-gray-400 mr-2" />
                  <span className={`px-2 py-1 rounded-full text-sm font-medium ${getRoleColor(userRole)}`}>
                    {userRole?.charAt(0).toUpperCase() + userRole?.slice(1)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">(Cannot be changed)</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Member Since
                </label>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                  <p className="text-gray-900 dark:text-gray-100">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {profile?.lastLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Last Login
                </label>
                <p className="text-gray-900 dark:text-gray-100">
                  {profile.lastLogin?.toDate
                    ? profile.lastLogin.toDate().toLocaleString()
                    : 'Never'}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowPasswordChange(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Password Change Modal */}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Change Password</h3>
                <button
                  onClick={() => setShowPasswordChange(false)}
                  className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  We'll send a password reset link to your email address: <strong>{currentUser.email}</strong>
                </p>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowPasswordChange(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
                >
                  {changingPassword ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete/Deactivate Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/50">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 text-center mb-2">
                Delete or Deactivate Profile
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
                Choose an option below. Deactivating will disable your account temporarily, 
                while deleting will permanently remove your profile.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleDeactivate}
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-yellow-300 dark:border-yellow-700 rounded-md shadow-sm text-sm font-medium text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-900/50 hover:bg-yellow-100 dark:hover:bg-yellow-800/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {saving ? 'Deactivating...' : 'Deactivate Profile'}
                </button>
                
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-800"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Profile Permanently'}
                </button>
                
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberProfile;
