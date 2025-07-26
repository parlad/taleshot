import React from 'react';
import { PhotoGallery } from '../components/PhotoGallery';

interface HomePageProps {
  selectedCategory?: string;
  viewMode?: 'flip' | 'slide';
}

export function HomePage({ selectedCategory = 'all', viewMode = 'flip' }: HomePageProps) {
  return (
    <PhotoGallery 
      selectedCategory={selectedCategory} 
      viewMode={viewMode}
    />
  );
}