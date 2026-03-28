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
        className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150 group"
        style={{
          color: active ? '#e8f4f3' : 'var(--text-muted)',
          background: active ? 'rgba(45,212,191,0.07)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!active) {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)';
          }
        }}
        onMouseLeave={(e) => {
          if (!active) {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)';
            (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
          }
        }}
      >
        <span style={{ color: active ? '#2dd4bf' : 'inherit', opacity: active ? 1 : 0.5 }}>
          {icon}
        </span>
        {label}
        {active && (
          <span
            className="absolute inset-x-3 bottom-0.5 h-px rounded-full"
            style={{ background: 'linear-gradient(90deg,rgba(45,212,191,0.8),rgba(6,182,212,0.4))' }}
          />
        )}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50"
        style={{
          height: '56px',
          background: 'rgba(8,11,20,0.92)',
          backdropFilter: 'blur(28px) saturate(180%)',
          WebkitBackdropFilter: 'blur(28px) saturate(180%)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Top accent hairline */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              'linear-gradient(90deg,transparent 0%,rgba(45,212,191,0.45) 35%,rgba(99,102,241,0.35) 65%,transparent 100%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-5 lg:px-8 h-full flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 group select-none"
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg,#2dd4bf,#6366f1)' }}
              />
              <div
                className="relative p-1.5 rounded-xl transition-transform duration-200 group-hover:scale-[1.06]"
                style={{
                  background: 'linear-gradient(135deg,#2dd4bf 0%,#06b6d4 55%,#6366f1 100%)',
                }}
              >
                <Camera className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <span
              className="text-[15px] font-bold tracking-tight"
              style={{ color: '#eef2ff', letterSpacing: '-0.025em' }}
            >
              Taleshot
            </span>
          </button>

          {/* Nav */}
          <nav className="flex items-center gap-0.5">
            {navLink('/explore', <Compass className="w-3.5 h-3.5" />, 'Explore')}
            {navLink('/stories', <Book className="w-3.5 h-3.5" />, 'Stories')}
            {navLink('/search', <Search className="w-3.5 h-3.5" />, 'Search')}

            <div
              className="w-px h-4 mx-2"
              style={{ background: 'rgba(255,255,255,0.07)' }}
            />

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[13px] font-semibold transition-all duration-150"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = '#fca5a5';
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.07)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-10">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
        <div
          className="max-w-7xl mx-auto px-5 lg:px-8 h-11 flex items-center justify-between"
          style={{ background: 'transparent' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="p-1 rounded-md"
              style={{ background: 'linear-gradient(135deg,#2dd4bf,#06b6d4)' }}
            >
              <Camera className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[12px] font-semibold" style={{ color: 'var(--text-muted)' }}>
              Taleshot
            </span>
          </div>
          <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
            © {new Date().getFullYear()} · Capturing memories, one story at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}
