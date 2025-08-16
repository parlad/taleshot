export interface Photo {
  id: string;
  imageUrl?: string;
  image_url?: string;
  title: string;
  date_taken?: string;
  reason: string;
  tags?: string[];
  user_id?: string;
  is_public?: boolean;
  batch_id?: string;
  gallery_photos?: Photo[];
  is_gallery_tile?: boolean;
}

export type ViewMode = 'flip' | 'slide';

export interface PhotoCardProps {
  photo: Photo;
  isFlipped: boolean;
  onFlip: () => void;
  onDelete: (id: string) => void;
  onUpdate?: (updatedPhoto: Photo) => void;
  viewMode?: ViewMode;
  isPublicView?: boolean;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}