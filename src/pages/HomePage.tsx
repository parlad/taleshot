import React from 'react';
import { PhotoGallery } from '../components/PhotoGallery';
import type { Category } from '../types';

interface HomePageProps {
  selectedCategory?: string;
  selectedTag?: string;
  viewMode?: 'flip' | 'slide';
  categories?: Category[];
}

export function HomePage({ selectedCategory, selectedTag, viewMode, categories }: HomePageProps) {
  return (
    <PhotoGallery 
      selectedCategory={selectedCategory || 'all'} 
      selectedTag={selectedTag || 'all'}
      viewMode={viewMode || 'flip'}
      categories={categories || []}
    />
  );
}