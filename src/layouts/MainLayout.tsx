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
      <header className="bg-white/95 backdrop-blur-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                Taleshot
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link
                to="/search"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                  !isHomePage
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-300"
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
        <div className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-indigo-600 rounded">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold text-gray-900">Taleshot</span>
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