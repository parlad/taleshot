import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { UserPublicProfile } from './components/UserPublicProfile';
import { Auth } from './components/Auth';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { supabase } from './utils/supabase';

export default function App() {
  const { user, loading } = useSupabaseAuth();

  // Add global logout handler
  React.useEffect(() => {
    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = '/';
      } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if there's an error
        window.location.href = '/';
      }
    };

    // Listen for custom logout event
    window.addEventListener('logout', handleLogout);
    return () => window.removeEventListener('logout', handleLogout);
  }, []);

  if (loading) {
    return null;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />} />
        <Route path="/user/:userId" element={<UserPublicProfile />} />
      </Routes>
    </BrowserRouter>
  );
}