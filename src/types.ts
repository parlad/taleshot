export interface Photo {
  id: string;
  imageUrl?: string;
  image_url?: string;
  title: string;
  dateTaken?: string;
  date_taken?: string;
  reason: string;
  categories?: string[];
  user_id?: string;
  is_public?: boolean;
}

export type ViewMode = 'flip' | 'slide';

export interface PhotoCardProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (id: string) => void;
  onUpdate: (updatedPhoto: Photo) => void;
  viewMode: ViewMode;
  isPublicView?: boolean;
}

export interface Category {
  id: string;
  name: string;
  user_id?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface SearchResult {
  user_id: string;
  user_email: string;
  photo_count: number;
  sample_photos: {
    id: string;
    title: string;
    image_url: string;
    date_taken: string;
  }[];
}