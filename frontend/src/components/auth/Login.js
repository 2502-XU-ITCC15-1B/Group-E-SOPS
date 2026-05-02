import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const { login, signInWithGoogle, signInWithFacebook, signInWithGithub, resetPassword } = useAuth();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const ACCESS_TOKEN = 'SOPS_Member2526';
  
  const validateAccessToken = () => {
    if (accessToken.trim() !== ACCESS_TOKEN) {
      toast.error('Invalid access token. Please contact your administrator.');
      return false;
    }
    return true;
  };

  const handleForgotPassword = async () => {
    if (!forgotPasswordEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(forgotPasswordEmail);
      toast.success('Password reset email sent! Check your inbox.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    if (!validateAccessToken()) {
      return;
    }
    
    try {
      setLoading(true);
      await login(data.email, data.password, accessToken);
      await login(data.email, data.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!validateAccessToken()) {
      return;
    }
    
    try {
      setLoading(true);
      await signInWithGoogle(accessToken);
      toast.success('Signed in with Google!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email. Please use email/password login.');
      } else {
        toast.error(error.message || 'Failed to sign in with Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    if (!validateAccessToken()) {
      return;
    }
    
    try {
      setLoading(true);
      await signInWithFacebook(accessToken);
      toast.success('Signed in with Facebook!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Facebook sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email. Please use email/password login.');
      } else {
        toast.error(error.message || 'Failed to sign in with Facebook');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGithubSignIn = async () => {
    if (!validateAccessToken()) {
      return;
    }
    
    try {
      setLoading(true);
      await signInWithGithub(accessToken);
      toast.success('Signed in with GitHub!');
      navigate('/dashboard');
    } catch (error) {
      console.error('GitHub sign in error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Sign in cancelled');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        toast.error('An account already exists with this email. Please use email/password login.');
      } else {
        toast.error(error.message || 'Failed to sign in with GitHub');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#241f1f] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-5xl bg-white rounded-[36px] shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        {/* Intro panel */}
        <div className="relative lg:w-1/2 bg-gradient-to-br from-[#f04b4b] via-[#f36e6e] to-[#f7b1ab] text-white p-10 lg:p-12 flex flex-col justify-center rounded-tr-[180px] rounded-br-[180px] overflow-hidden">
          <div className="absolute inset-y-0 right-0 w-24 bg-white/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 space-y-6">
            <h1 className="text-4xl lg:text-5xl font-bold leading-tight drop-shadow">
              Hello, Friend!
            </h1>
            <p className="text-lg font-medium text-white/90 leading-relaxed max-w-xs">
              Enter your personal details and start your journey with us!
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 bg-white p-8 sm:p-10 lg:p-12">
          <div className="flex items-start justify-between mb-8">
            <div>
              <div className="flex items-center space-x-3">
                <img
                  src="/images/strucsure-icon.png"
                  alt="Organization logo"
                  className="h-12 w-12 rounded-full object-cover border-4 border-gray-100 shadow"
                />
                <div>
                  <p className="text-xs uppercase tracking-[0.35rem] text-gray-400">
                    STUDENT ORGANIZATION PROFILING SYSTEM
                  </p>
                  <h2 className="text-2xl font-semibold text-gray-900 tracking-wide">
                    Student Organization Profiling System
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Xavier Circle of Information Technology Students (XCITeS)
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Access Token <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-300" />
                  </div>
                  <input
                    type="text"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30 transition"
                    placeholder="Enter access token"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Contact your administrator to obtain the access token
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-300" />
                  </div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full h-14 pl-12 pr-4 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30 transition"
                    placeholder="Email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-2 text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-sm text-gray-400 hover:text-[#f04b4b] transition"
                    >
                      Forgot password?
                    </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-300" />
                  </div>
                  <input
                    {...register('password', { required: 'Password is required' })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full h-14 pl-12 pr-14 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder:text-gray-400 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30 transition"
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="h-12 rounded-2xl bg-[#f9ddda] flex items-center justify-center hover:bg-[#f6c7c2] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <img 
                    src="/images/google-icon.png" 
                    alt="Google" 
                    className="h-6 w-6 object-contain"
                  />
                </button>
                <button
                  type="button"
                  onClick={handleFacebookSignIn}
                  disabled={loading}
                  className="h-12 rounded-2xl bg-[#f9ddda] flex items-center justify-center hover:bg-[#f6c7c2] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <img 
                    src="/images/facebook-icon.png" 
                    alt="Facebook" 
                    className="h-6 w-6 object-contain"
                  />
                </button>
                <button
                  type="button"
                  onClick={handleGithubSignIn}
                  disabled={loading}
                  className="h-12 rounded-2xl bg-[#f9ddda] flex items-center justify-center hover:bg-[#f6c7c2] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <img 
                    src="/images/github-icon.png" 
                    alt="GitHub" 
                    className="h-6 w-6 object-contain"
                  />
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-[#f04b4b] text-white text-lg font-semibold tracking-wide shadow-lg shadow-[#f04b4b]/40 hover:bg-[#e43a3a] transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Don&apos;t have an acc?{' '}
            <Link
              to="/register"
              className="text-gray-700 font-semibold underline underline-offset-2 decoration-dotted hover:text-[#f04b4b] transition"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
