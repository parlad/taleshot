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
              <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">
                Taleshot
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              <Link
                to="/search"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  !isHomePage
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium shadow-lg'
                    : 'text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm rounded-xl transition-all duration-300"
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
              <div className="p-1.5 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">Taleshot</span>
            </div>
            <p className="text-white/70 text-sm">
              © 2025 Taleshot. Capturing memories, one story at a time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}