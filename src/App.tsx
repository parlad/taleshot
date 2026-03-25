import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { Auth } from './components/Auth';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ToastProvider } from './context/ToastContext';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ExplorePage } from './pages/ExplorePage';
import { ProfilePage } from './pages/ProfilePage';
import { StoriesPage } from './pages/StoriesPage';

function AppContent() {
  const { user, loading } = useSupabaseAuth();
  const [reloadTrigger, setReloadTrigger] = React.useState(0);

  const handleLogoClick = () => {
    setReloadTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <MainLayout onLogoClick={handleLogoClick}>
      <Routes>
        <Route path="/" element={<HomePage key={reloadTrigger} />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/stories" element={<StoriesPage />} />
        <Route path="/:username" element={<ProfilePage />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppContent />
      </Router>
    </ToastProvider>
  );
}