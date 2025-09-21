import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { Auth } from './components/Auth';
import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';

function AppContent() {
  const { user, loading } = useSupabaseAuth();
  const [reloadTrigger, setReloadTrigger] = React.useState(0);

  const handleLogoClick = () => {
    setReloadTrigger(prev => prev + 1);
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
    <MainLayout onLogoClick={handleLogoClick}>
      <Routes>
        <Route path="/" element={<HomePage key={reloadTrigger} />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </MainLayout>
  );
}

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}