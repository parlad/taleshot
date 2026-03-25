export interface Photo {
  id: string;
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
  upload_type?: 'individual' | 'group';
  ai_description?: string;
  ai_tags?: string[];
  color_palette?: string[];
  color_tone?: string;
  ai_analyzed?: boolean;
  ai_analyzed_at?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  capture_date?: string;
  created_at: string;
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
  onTogglePublic?: () => void;
}

export interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}