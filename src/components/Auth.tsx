import React, { useState } from 'react';
import { Camera, Mail, Lock, Eye, EyeOff, ImageIcon, Sparkles, Users } from 'lucide-react';
import { supabase } from '../utils/supabase';

export function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          }
        });

        if (error) throw error;

        if (data?.user && data?.session) {
          // auto-confirmed
        } else if (data?.user && !data?.session) {
          setError('Please check your email to confirm your account before signing in.');
          setLoading(false);
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error("Invalid email or password. Please check your credentials or sign up if you don't have an account.");
          }
          throw error;
        }

        console.log('Signed in:', data.user?.email);
      }
    } catch (error) {
      console.error('Auth error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex-col justify-between p-12">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute top-1/3 -right-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-cyan-500 rounded-xl blur-md opacity-50" />
            <div className="relative p-2.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 rounded-xl shadow-lg">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Taleshot</span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold text-white leading-tight tracking-tight">
              Capture memories.<br />
              <span className="bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">Tell stories.</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm">
              Your personal photo journal. Every image holds a story — preserve it forever.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3">
            {[
              { icon: ImageIcon, text: 'Organize photos by memory & story' },
              { icon: Sparkles, text: 'AI-powered tags & descriptions' },
              { icon: Users, text: 'Share publicly or keep private' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-teal-400" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-slate-600 text-sm">© {new Date().getFullYear()} Taleshot</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="p-2 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 rounded-xl shadow-lg">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-teal-500 to-blue-600 bg-clip-text text-transparent">Taleshot</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-gray-500 text-sm">
              {isSignUp ? 'Start your photo journey today.' : 'Sign in to your account to continue.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <p className="text-red-700 text-sm leading-relaxed">{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 focus:bg-white transition-all placeholder:text-gray-400"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 focus:bg-white transition-all placeholder:text-gray-400"
                  placeholder={isSignUp ? 'Min. 6 characters' : 'Enter your password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-400 focus:bg-white transition-all placeholder:text-gray-400"
                    placeholder="Repeat your password"
                    required
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white text-sm font-semibold rounded-xl shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </span>
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="font-semibold text-teal-600 hover:text-teal-700 transition-colors"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}