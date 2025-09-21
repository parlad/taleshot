import React from 'react';
import { PhotoGallery } from '../components/PhotoGallery';

interface HomePageProps {
  onReload?: () => void;
}

export function HomePage({ onReload }: HomePageProps) {
  return <PhotoGallery onReload={onReload} />;
}