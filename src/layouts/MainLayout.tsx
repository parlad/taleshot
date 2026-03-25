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
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          active
            ? 'bg-slate-900 text-white'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-14 flex items-center justify-between">
          {/* Logo */}
          <button onClick={handleLogoClick} className="flex items-center gap-2 group">
            <div className="p-1.5 bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
              <Camera className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Taleshot</span>
          </button>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navLink('/explore', <Compass className="w-3.5 h-3.5" />, 'Explore')}
            {navLink('/stories', <Book className="w-3.5 h-3.5" />, 'Stories')}
            {navLink('/search', <Search className="w-3.5 h-3.5" />, 'Search')}

            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 px-3 py-1.5 ml-2 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-12 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-gradient-to-r from-teal-400 to-blue-500 rounded-md">
              <Camera className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Taleshot</span>
          </div>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} Taleshot. Capturing memories, one story at a time.
          </p>
        </div>
      </footer>
    </div>
  );
}