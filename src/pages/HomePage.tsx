import React from 'react';
import { PhotoGallery } from '../components/PhotoGallery';
import type { Category } from '../types';

interface HomePageProps {
  selectedCategory?: string;
  viewMode?: 'flip' | 'slide';
  categories?: Category[];
}

export function HomePage({ selectedCategory, viewMode, categories }: HomePageProps) {
  return (
    <PhotoGallery 
      selectedCategory={selectedCategory || 'all'} 
      viewMode={viewMode || 'flip'}
      categories={categories || []}
    />
  );
}