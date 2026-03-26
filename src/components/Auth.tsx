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

  const inputClass = `w-full rounded-xl text-sm outline-none transition-all duration-200 py-3`;

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left panel — immersive branding ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #060a14 0%, #0d1525 50%, #111c32 100%)' }}
      >
        {/* Ambient glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(45,212,191,0.12) 0%, transparent 60%)' }} />
          <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 60%)' }} />
          <div className="absolute -bottom-32 left-1/3 w-[450px] h-[450px] rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 60%)' }} />
          {/* Subtle dot grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="relative">
            <div
              className="absolute inset-0 rounded-xl blur-lg opacity-50"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)' }}
            />
            <div
              className="relative p-2.5 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 60%, #6366f1 100%)' }}
            >
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ color: '#f0f4ff', letterSpacing: '-0.03em' }}
          >
            Taleshot
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-5">
            <h2
              className="text-5xl font-extrabold leading-tight"
              style={{ color: '#f0f4ff', letterSpacing: '-0.04em' }}
            >
              Capture memories.
              <br />
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(135deg, #2dd4bf 0%, #22d3ee 50%, #818cf8 100%)' }}
              >
                Tell stories.
              </span>
            </h2>
            <p className="text-lg leading-relaxed max-w-sm" style={{ color: '#4b6280' }}>
              Your personal photo journal. Every image holds a story — preserve it forever with AI‑powered organization.
            </p>
          </div>

          {/* Feature list */}
          <div className="flex flex-col gap-3">
            {[
              { icon: ImageIcon, text: 'Organize photos by memory & story', accent: '#2dd4bf' },
              { icon: Sparkles,  text: 'AI-powered tags & descriptions',     accent: '#818cf8' },
              { icon: Users,     text: 'Share publicly or keep private',      accent: '#06b6d4' },
            ].map(({ icon: Icon, text, accent }) => (
              <div key={text} className="flex items-center gap-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accent}14`, border: `1px solid ${accent}28` }}
                >
                  <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
                <span className="text-sm font-medium" style={{ color: '#5a7090' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: '#1e2d3f' }}>© {new Date().getFullYear()} Taleshot</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 sm:p-12"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div
              className="p-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)' }}
            >
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-xl font-bold"
              style={{ backgroundImage: 'linear-gradient(135deg, #2dd4bf, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em' }}
            >
              Taleshot
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold mb-2"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
            >
              {isSignUp ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isSignUp ? 'Start your photo journey today.' : 'Sign in to continue your story.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {error && (
              <div
                className="rounded-xl p-3.5 flex items-start gap-2.5"
                style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: '#f87171' }} />
                <p className="text-sm leading-relaxed" style={{ color: '#fca5a5' }}>{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={`${inputClass} pl-10 pr-4`}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.45)';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)';
                    (e.target as HTMLInputElement).style.background = 'var(--bg-overlay)';
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                    (e.target as HTMLInputElement).style.background = 'var(--bg-elevated)';
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? 'Min. 6 characters' : 'Enter your password'}
                  required
                  className={`${inputClass} pl-10 pr-11`}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                  onFocus={e => {
                    (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.45)';
                    (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)';
                    (e.target as HTMLInputElement).style.background = 'var(--bg-overlay)';
                  }}
                  onBlur={e => {
                    (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                    (e.target as HTMLInputElement).style.boxShadow = 'none';
                    (e.target as HTMLInputElement).style.background = 'var(--bg-elevated)';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            {isSignUp && (
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className={`${inputClass} pl-10 pr-4`}
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                    onFocus={e => {
                      (e.target as HTMLInputElement).style.borderColor = 'rgba(45,212,191,0.45)';
                      (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(45,212,191,0.08)';
                      (e.target as HTMLInputElement).style.background = 'var(--bg-overlay)';
                    }}
                    onBlur={e => {
                      (e.target as HTMLInputElement).style.borderColor = 'var(--border)';
                      (e.target as HTMLInputElement).style.boxShadow = 'none';
                      (e.target as HTMLInputElement).style.background = 'var(--bg-elevated)';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-55 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 100%)',
                color: '#060a14',
                boxShadow: '0 4px 20px rgba(45,212,191,0.3)',
              }}
              onMouseEnter={e => !loading && ((e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 32px rgba(45,212,191,0.45)', (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)')}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(45,212,191,0.3)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span
                    className="w-4 h-4 border-2 rounded-full animate-spin"
                    style={{ borderColor: 'rgba(6,10,20,0.3)', borderTopColor: '#060a14' }}
                  />
                  {isSignUp ? 'Creating account…' : 'Signing in…'}
                </span>
              ) : (
                isSignUp ? 'Create account' : 'Sign in'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="font-bold transition-colors"
              style={{ color: '#2dd4bf' }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = '#5eead4'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = '#2dd4bf'}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
