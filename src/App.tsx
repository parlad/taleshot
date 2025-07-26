import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { Auth } from './components/Auth';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { SearchResults } from './components/SearchResults';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import type { SearchResult } from './types';
import { supabase } from './utils/supabase';

export default function App() {
  const { user, loading } = useSupabaseAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_public_photos_with_profile', {
        search_query: query.trim()
      });

      if (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } else {
        setSearchResults(data || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: SearchResult) => {
    setSelectedUser(user);
  };

  const handleBackToSearch = () => {
    setSelectedUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-green-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
      <MainLayout 
        showSearch={showSearch}
        onSearchToggle={() => setShowSearch(!showSearch)}
        onSearchChange={handleSearchChange}
      >
        {showSearch ? (
          <SearchResults 
            searchQuery={searchQuery}
            searchResults={searchResults}
            isSearching={isSearching}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            onBackToSearch={handleBackToSearch}
          />
        ) : (
          <HomePage />
        )}
      </MainLayout>
  );
}