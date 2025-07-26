import React from 'react';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { Auth } from './components/Auth';
import { PhotoGallery } from './PhotoGallery';

export default function App() {
  const { user, loading } = useSupabaseAuth();

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

  return <PhotoGallery />;
}