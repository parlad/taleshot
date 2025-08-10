import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Search, LogOut, ChevronDown, Grid, LayoutGrid } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Category } from '../types';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'flip' | 'slide'>('flip');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;


    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const handleCategoryChange = (categoryName: string) => {
    console.log('🔄 Category changed to:', categoryName);
    setSelectedCategory(categoryName);
    setShowCategoryDropdown(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Camera className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
                Taleshot
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6">
              <Link
                to="/search"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  !isHomePage
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Search className="w-4 h-4" />
                Search
              </Link>

              {/* Category Dropdown - Only show on home page */}
              {isHomePage && (
                <div className="relative">
                  <button
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <span>
                      {selectedCategory === 'all' 
                        ? 'All Photos' 
                        : categories.find(c => c.name === selectedCategory)?.name || 'All Photos'
                      }
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          handleCategoryChange('all');
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          selectedCategory === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        All Photos
                      </button>
                      {categories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => {
                            handleCategoryChange(category.name);
                          }}
                          className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                            selectedCategory.toLowerCase() === category.name.toLowerCase() 
                              ? 'bg-blue-50 text-blue-700' 
                              : 'text-gray-700'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* View Mode Dropdown - Only show on home page */}
              {isHomePage && (
                <div className="relative">
                  <button
                    onClick={() => setShowViewDropdown(!showViewDropdown)}
                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {viewMode === 'flip' ? <Grid className="w-4 h-4" /> : <LayoutGrid className="w-4 h-4" />}
                    <span className="capitalize">{viewMode}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {showViewDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                      <button
                        onClick={() => {
                          setViewMode('flip');
                          setShowViewDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          viewMode === 'flip' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
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
                          viewMode === 'slide' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                        }`}
                      >
                        Slide
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {React.cloneElement(children as React.ReactElement, {
            selectedCategory,
            viewMode,
            categories
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-6 h-6 text-blue-600" />
              <span className="text-lg font-semibold text-gray-800">Taleshot</span>
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