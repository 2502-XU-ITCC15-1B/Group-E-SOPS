import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, X } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';


const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAssistance, setShowAssistance] = useState(false);
  const [assistanceEmail, setAssistanceEmail] = useState('');
  const [assistanceReason, setAssistanceReason] = useState('');
  const [assistanceLoading, setAssistanceLoading] = useState(false);
  const [assistanceSuccess, setAssistanceSuccess] = useState(false);
  const { login, signInWithGoogle, requestPasswordAssistance } = useAuth();

  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();



  const onSubmit = async (data) => {
    try {
      setLoading(true);
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

  const handleAssistanceSubmit = async (e) => {
    e.preventDefault();
    if (!assistanceEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    try {
      setAssistanceLoading(true);
      await requestPasswordAssistance({
        email: assistanceEmail.trim(),
        reason: assistanceReason.trim()
      });
      setAssistanceSuccess(true);
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setAssistanceLoading(false);
    }
  };
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
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

  return (
    <div className="min-h-screen bg-[#241f1f] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Login — XCITeS SOPS</title>
        <meta name="description" content="Sign in to the XCITeS Student Organization Profiling System." />
      </Helmet>
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
                  <div className="flex items-center space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowAssistance(true)}
                      className="text-sm text-gray-400 hover:text-[#f04b4b] transition"
                    >
                      Forgot password?
                    </button>

                  </div>
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
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="h-12 w-full md:w-1/2 rounded-2xl bg-[#f9ddda] flex items-center justify-center hover:bg-[#f6c7c2] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <img 
                    src="/images/google-icon.png" 
                    alt="Google" 
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
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-gray-700 font-semibold underline underline-offset-2 decoration-dotted hover:text-[#f04b4b] transition"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
      {showAssistance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative p-8">
            <button
              onClick={() => {
                setShowAssistance(false);
                setAssistanceSuccess(false);
                setAssistanceEmail('');
                setAssistanceReason('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            {assistanceSuccess ? (
              <div className="text-center py-4">
                <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Your password assistance request has been sent to the administrator. 
                  You will receive a password reset email once your request is reviewed. 
                  Please check your inbox after the admin responds.
                </p>
                <button
                  onClick={() => {
                    setShowAssistance(false);
                    setAssistanceSuccess(false);
                    setAssistanceEmail('');
                    setAssistanceReason('');
                  }}
                  className="mt-6 w-full h-12 rounded-2xl bg-[#f04b4b] text-white font-semibold hover:bg-[#e43a3a] transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Password Assistance</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  Submit a request and an administrator will send a password reset link to your email. 
                  Your password is never visible to anyone.
                </p>
                <form onSubmit={handleAssistanceSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={assistanceEmail}
                      onChange={(e) => setAssistanceEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">
                      Reason <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={assistanceReason}
                      onChange={(e) => setAssistanceReason(e.target.value)}
                      placeholder="Briefly describe your issue..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-800 focus:border-[#f04b4b] focus:ring-2 focus:ring-[#f04b4b]/30 transition resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssistance(false);
                        setAssistanceEmail('');
                        setAssistanceReason('');
                      }}
                      className="flex-1 h-12 rounded-2xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={assistanceLoading}
                      className="flex-1 h-12 rounded-2xl bg-[#f04b4b] text-white font-semibold hover:bg-[#e43a3a] transition disabled:opacity-60"
                    >
                      {assistanceLoading ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;
