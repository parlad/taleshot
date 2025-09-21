import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Search, LogOut } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass-effect sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="p-2 bg-indigo-600 rounded-xl">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Taleshot
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              <Link
                to="/search"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  !isHomePage
                    ? 'bg-indigo-600 text-white font-medium shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50 backdrop-blur-sm'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 backdrop-blur-sm rounded-xl transition-all duration-300"
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-effect border-t border-white/20">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">Taleshot</span>
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