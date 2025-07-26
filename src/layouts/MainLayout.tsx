import React, { useEffect, useState, useRef } from 'react';
import { Camera, Menu, X, Plus, SlidersHorizontal, Tag, User } from 'lucide-react';
import { PhotoGallery } from '../components/PhotoGallery';
import { UserSearch } from '../components/UserSearch';
import { createClient } from '@supabase/supabase-js';
import type { ViewMode, Category } from '../types';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function MainLayout() {
  const [viewMode, setViewMode] = useState<ViewMode>('flip');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const newCategoryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isAddingCategory && newCategoryInputRef.current) {
      newCategoryInputRef.current.focus();
    }
  }, [isAddingCategory]);

  const fetchCategories = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error in fetchCategories:', error);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setIsCategoryDropdownOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
          name: newCategory.trim(), 
          user_id: user.id 
        }])
        .select()
        .single();

      if (error) {
        console.error('Error adding category:', error);
        return;
      }

      setCategories(prev => [...prev, data]);
      setNewCategory('');
      setIsAddingCategory(false);
    } catch (error) {
      console.error('Error in handleAddCategory:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50">
      <header className="bg-gradient-to-r from-gray-800/90 via-gray-700/90 to-green-800/90 backdrop-blur-lg shadow-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between h-12">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-gradient-to-br from-green-400 to-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-200/50">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-base font-bold text-white">Memory</h1>
              </div>

              <UserSearch />
            </div>
            
            <div className="hidden md:flex items-center gap-3">
              <div ref={categoryDropdownRef} className="category-dropdown">
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 transition-all duration-200 rounded-lg text-white text-xs ${
                    selectedCategory === 'all' 
                      ? 'bg-white/10 hover:bg-white/20' 
                      : 'bg-green-500/20 hover:bg-green-500/30'
                  }`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span className="font-medium">
                    {selectedCategory === 'all' ? 'All Categories' : selectedCategory}
                  </span>
                </button>
                {isCategoryDropdownOpen && (
                  <div className="dropdown-menu w-64 p-2">
                    <div className="space-y-1">
                      <button
                        onClick={() => handleCategorySelect('all')}
                        className={`flex items-center w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === 'all'
                            ? 'bg-green-50 text-green-700'
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        All Categories
                      </button>
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category.name)}
                          className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedCategory === category.name
                              ? 'bg-green-50 text-green-700'
                              : 'hover:bg-gray-50 text-gray-700'
                          }`}
                        >
                          {category.name}
                          {selectedCategory === category.name && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                          )}
                        </button>
                      ))}
                    </div>

                    {isAddingCategory ? (
                      <form onSubmit={handleAddCategory} className="mt-2 pt-2 border-t">
                        <div className="flex gap-1">
                          <input
                            ref={newCategoryInputRef}
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category name"
                            className="flex-1 px-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAddingCategory(true);
                        }}
                        className="flex items-center gap-2 w-full mt-2 pt-2 px-3 py-2 text-green-600 hover:text-green-700 border-t border-gray-100 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        Add Category
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setViewMode(prev => prev === 'flip' ? 'slide' : 'flip')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-500/20 hover:bg-green-500/30 transition-colors rounded-lg text-green-100 text-xs"
                title={`Switch to ${viewMode === 'flip' ? 'slide' : 'flip'} view`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="font-medium">{viewMode === 'flip' ? 'Slide' : 'Flip'}</span>
              </button>

              <button
                onClick={async () => {
                  try {
                    console.log('Attempting to sign out...');
                    await supabase.auth.signOut();
                    console.log('Sign out successful');
                    window.location.reload();
                  } catch (error) {
                    console.error('Error signing out:', error);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 transition-colors rounded-lg text-red-100 text-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div 
              ref={mobileMenuRef}
              className="md:hidden py-3 border-t border-white/10 space-y-2"
            >
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-white/60">Category</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => handleCategorySelect('all')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-green-500/20 text-white'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    All Categories
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category.name)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedCategory === category.name
                          ? 'bg-green-500/20 text-white'
                          : 'bg-white/10 text-white/80 hover:bg-white/20'
                      }`}
                    >
                      {category.name}
                      {selectedCategory === category.name && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                    </button>
                  ))}
                </div>

                {isAddingCategory ? (
                  <form onSubmit={handleAddCategory} className="mt-2">
                    <div className="flex gap-1.5">
                      <input
                        ref={newCategoryInputRef}
                        type="text"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="New category name"
                        className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1.5 bg-green-500 text-white rounded-lg text-xs"
                      >
                        Add
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    onClick={() => setIsAddingCategory(true)}
                    className="w-full mt-2 px-2.5 py-1.5 bg-white/10 text-white/80 hover:bg-white/20 rounded-lg text-xs text-left flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Category
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-medium text-white/60">View Mode</p>
                <button
                  onClick={() => setViewMode(prev => prev === 'flip' ? 'slide' : 'flip')}
                  className="w-full px-2.5 py-1.5 bg-green-500/20 text-white rounded-lg text-xs text-left flex items-center gap-1.5"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Switch to {viewMode === 'flip' ? 'Slide' : 'Flip'} View
                </button>
              </div>

              <div className="pt-2 border-t border-white/10">
                <button
                  onClick={async () => {
                    try {
                      console.log('Mobile sign out clicked...');
                      await supabase.auth.signOut();
                      console.log('Mobile sign out successful');
                      window.location.reload();
                    } catch (error) {
                      console.error('Error signing out:', error);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 transition-colors rounded-lg text-red-100 text-sm"
                >
                  <User className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="py-8 px-4">
        <PhotoGallery selectedCategory={selectedCategory} viewMode={viewMode} />
      </main>

      <footer className="mt-auto py-6 bg-gradient-to-r from-gray-800/90 via-gray-700/90 to-green-800/90 backdrop-blur-lg border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-gray-300 text-sm">© 2024 Memory. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}