import React, { useState } from 'react';
import { Search, Grid, Layers, LogOut, ChevronDown } from 'lucide-react';
import { supabase } from '../utils/supabase';

type ViewMode = 'flip' | 'slide';

interface MainLayoutProps {
  children: React.ReactNode;
  showSearch?: boolean;
  onSearchToggle?: () => void;
  onSearchChange?: (query: string) => void;
}

export function MainLayout({ children, showSearch, onSearchToggle, onSearchChange }: MainLayoutProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('flip');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);

  const categories = [
    { id: 'all', name: 'All Photos' },
    { id: 'family', name: 'Family' },
    { id: 'vacation', name: 'Vacation' },
    { id: 'celebration', name: 'Celebration' },
    { id: 'nature', name: 'Nature' },
    { id: 'food', name: 'Food' },
    { id: 'pets', name: 'Pets' }
  ];

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">T</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Taleshot
              </h1>
            </div>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              {/* Search Bar */}
              <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    onChange={(e) => onSearchChange?.(e.target.value)}
                  />
                </div>
              </div>

              <button
                onClick={() => onSearchToggle?.()}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                  showSearch 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4" />
                <span className="font-medium">Search Users</span>
              </button>

              {/* Category Dropdown */}
              {!showSearch && (
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Grid className="w-4 h-4" />
                    <span className="font-medium">
                      {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => {
                            setSelectedCategory(category.id);
                            setShowCategoryDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                            selectedCategory === category.id ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* View Mode Dropdown */}
              {!showSearch && (
                <div className="relative">
                  <button
                    onClick={() => setShowViewDropdown(!showViewDropdown)}
                    className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Layers className="w-4 h-4" />
                    <span className="font-medium capitalize">{viewMode}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showViewDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setViewMode('flip');
                          setShowViewDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          viewMode === 'flip' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        Flip
                      </button>
                      <button
                        onClick={() => {
                          setViewMode('slide');
                          setShowViewDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          viewMode === 'slide' ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                        }`}
                      >
                        Slide
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sign Out</span>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {React.cloneElement(children as React.ReactElement, { 
            selectedCategory, 
            viewMode 
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-md flex items-center justify-center">
                <span className="text-white font-bold text-xs">T</span>
              </div>
              <span className="text-gray-600 text-sm">
                © 2025 Taleshot. Capturing memories, one story at a time.
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Made with ❤️ for preserving precious moments
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}