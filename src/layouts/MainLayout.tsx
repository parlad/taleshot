import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Camera, Search, LogOut } from 'lucide-react';
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
      // If already on home page, trigger photo reload
      onLogoClick?.();
    } else {
      // Navigate to home page
      navigate('/');
    }
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-10 lg:px-16 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <button onClick={handleLogoClick} className="flex items-center gap-2 hover:scale-105 transition-transform duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-sm opacity-30"></div>
                <div className="relative p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Taleshot
              </span>
            </button>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Link
                to="/search"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  !isHomePage
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 hover:border-blue-200'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl border border-gray-200 hover:border-red-200 font-medium transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-10 lg:px-16 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-xl border-t border-gray-100/50">
        <div className="max-w-7xl mx-auto px-10 lg:px-16 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Taleshot</span>
            </div>
            <p className="text-gray-600 text-sm">
              © 2025 Taleshot. Capturing memories, one story at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}