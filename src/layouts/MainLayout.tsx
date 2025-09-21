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
      <header className="bg-white/90 backdrop-blur-xl sticky top-0 z-50 border-b border-gray-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur-sm opacity-30"></div>
                <div className="relative p-2 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Taleshot
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <Link
                to="/search"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                  !isHomePage
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200'
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
        <div className="max-w-6xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-xl border-t border-gray-100/50">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg">
                <Camera className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Taleshot</span>
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