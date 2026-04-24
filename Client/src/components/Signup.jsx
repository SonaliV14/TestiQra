import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { BACKEND_URL } from '../utils/DB';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [Userdetail, setUserdetail] = useState({ firstname: '', email: '', password: '' });

  const handleclick = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const UserResponse = await axios.post(`${BACKEND_URL}/api/v1/user/signup`, Userdetail);
      if (UserResponse.data.message) {
        toast.success(UserResponse.data.message);
        localStorage.setItem('token', UserResponse.data.token);
        setTimeout(() => navigate('/dashboard'), 1000);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
      setUserdetail({ firstname: '', email: '', password: '' });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-900/10 rounded-full blur-3xl" />
        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs><pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)" />
        </svg>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles size={18} className="text-white" />
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">TestiQra</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-gray-400 text-sm">Start collecting testimonials that convert</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-8 shadow-2xl">
          {/* Google Button */}
          <button
            onClick={() => toast('Google signup coming soon!')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 text-gray-800 rounded-xl font-medium text-sm transition-all mb-6 shadow-sm"
          >
            <img className="w-5 h-5" src="https://www.google.com/favicon.ico" alt="Google" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700/60" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-gray-900/80 text-gray-500 text-xs">or sign up with email</span></div>
          </div>

          <form onSubmit={handleclick} className="space-y-4">
            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text" required value={Userdetail.firstname}
                  onChange={(e) => setUserdetail({ ...Userdetail, firstname: e.target.value })}
                  placeholder="John Doe"
                  className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-gray-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email" required value={Userdetail.email}
                  onChange={(e) => setUserdetail({ ...Userdetail, email: e.target.value })}
                  placeholder="you@company.com"
                  className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-gray-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-xs font-medium block mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'} required value={Userdetail.password}
                  onChange={(e) => setUserdetail({ ...Userdetail, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  className="w-full bg-gray-800/60 border border-gray-700/60 rounded-xl pl-10 pr-12 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-violet-500/60 focus:bg-gray-800 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-violet-500/20 mt-2">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <><span>Create Account</span><ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{' '}
            <button onClick={() => navigate('/signin')} className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign in
            </button>
          </p>
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">
          By signing up, you agree to our Terms of Service & Privacy Policy
        </p>
      </div>
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' } }} />
    </div>
  );
};

export default Signup;