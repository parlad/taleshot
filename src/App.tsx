import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { UserPublicProfile } from './components/UserPublicProfile';
import { Auth } from './components/Auth';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';

export default function App() {
  const { user, loading } = useSupabaseAuth();

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