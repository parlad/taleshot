import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Search, LogOut, Compass, Book } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface MainLayoutProps {
  children: React.ReactNode;
  onLogoClick?: () => void;
}

export function MainLayout({ children, onLogoClick }: MainLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (location.pathname === '/') {
      onLogoClick?.();
    } else {
      navigate('/');
    }
  };

  const navLink = (to: string, icon: React.ReactNode, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
          active
            ? 'text-[#2dd4bf] bg-[rgba(45,212,191,0.08)]'
            : 'text-[#7b8db0] hover:text-[#c8d6f0] hover:bg-white/[0.04]'
        }`}
      >
        <span className={`transition-colors ${active ? 'text-[#2dd4bf]' : 'text-[#3d4f6e] group-hover:text-[#7b8db0]'}`}>
          {icon}
        </span>
        {label}
        {active && (
          <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-[#2dd4bf] shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 h-14"
        style={{
          background: 'rgba(9,13,24,0.9)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.4) 40%, rgba(99,102,241,0.4) 70%, transparent 100%)' }}
        />

        <div className="max-w-7xl mx-auto px-5 lg:px-10 h-full flex items-center justify-between">
          {/* Logo */}
          <button onClick={handleLogoClick} className="flex items-center gap-2.5 group select-none">
            <div className="relative">
              {/* Glow halo */}
              <div
                className="absolute inset-0 rounded-xl blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)' }}
              />
              <div
                className="relative p-1.5 rounded-xl transition-transform duration-200 group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #2dd4bf 0%, #06b6d4 60%, #6366f1 100%)' }}
              >
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="text-base font-bold tracking-tight"
                style={{ color: '#f0f4ff', letterSpacing: '-0.02em' }}
              >
                Taleshot
              </span>
            </div>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-0.5">
            {navLink('/explore', <Compass className="w-3.5 h-3.5" />, 'Explore')}
            {navLink('/stories', <Book className="w-3.5 h-3.5" />, 'Stories')}
            {navLink('/search',  <Search className="w-3.5 h-3.5" />, 'Search')}

            <div className="w-px h-5 mx-2" style={{ background: 'rgba(255,255,255,0.08)' }} />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              style={{ color: '#3d4f6e' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#f87171';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(248,113,113,0.08)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = '#3d4f6e';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-5 lg:px-10 py-8">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-7xl mx-auto px-5 lg:px-10 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-md"
              style={{ background: 'linear-gradient(135deg, #2dd4bf, #06b6d4)' }}
            >
              <Camera className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Taleshot
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            © {new Date().getFullYear()} Taleshot · Capturing memories, one story at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
