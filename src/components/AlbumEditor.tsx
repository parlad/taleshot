import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, Edit2, Save, Trash2, Image as ImageIcon, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabase';
import type { Photo } from '../types';

interface AlbumPhoto extends Photo {
  order_index: number;
  collection_photo_id: string;
}

interface AlbumEditorProps {
  albumId: string;
  onUpdate: () => void;
}

interface SortableItemProps {
  photo: AlbumPhoto;
  isEditing: boolean;
  editForm: { title: string; reason: string };
  loading: boolean;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onSetCover: () => void;
  onRemove: () => void;
  onEditFormChange: (field: 'title' | 'reason', value: string) => void;
}

function SortableItem({
  photo,
  isEditing,
  editForm,
  loading,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onSetCover,
  onRemove,
  onEditFormChange
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-glass p-4 transition-all ${
        isDragging ? 'shadow-2xl scale-105 z-50' : ''
      }`}
    >
      <div className="flex gap-4">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        <img
          src={photo.image_url || photo.imageUrl}
          alt={photo.title}
          className="w-24 h-24 object-cover rounded-lg"
        />

        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => onEditFormChange('title', e.target.value)}
                className="w-full px-3 py-2 border-2 border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Photo title"
              />
              <textarea
                value={editForm.reason}
                onChange={(e) => onEditFormChange('reason', e.target.value)}
                className="w-full px-3 py-2 border-2 border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                rows={2}
                placeholder="Photo description"
              />
            </div>
          ) : (
            <>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1 truncate">
                {photo.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {photo.reason}
              </p>
            </>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {isEditing ? (
            <>
              <button
                onClick={onSaveEdit}
                disabled={loading}
                className="p-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
                title="Save changes"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={onCancelEdit}
                className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onStartEdit}
                className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Edit photo"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={onSetCover}
                className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                title="Set as cover photo"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={onRemove}
                className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Remove from album"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function AlbumEditor({ albumId, onUpdate }: AlbumEditorProps) {
  const [photos, setPhotos] = useState<AlbumPhoto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchAlbumPhotos();
  }, [albumId]);

  const fetchAlbumPhotos = async () => {
    try {
      const { data: collectionPhotos, error } = await supabase
        .from('collection_photos')
        .select('id, photo_id, order_index')
        .eq('collection_id', albumId)
        .order('order_index');

      if (error) throw error;

      const photosWithDetails = await Promise.all(
        (collectionPhotos || []).map(async (cp) => {
          const { data: photo } = await supabase
            .from('photos')
            .select('*')
            .eq('id', cp.photo_id)
            .single();

          if (!photo) return null;

          const { data: tags } = await supabase
            .from('photo_tags')
            .select('tag_name')
            .eq('photo_id', photo.id);

          return {
            ...photo,
            tags: tags?.map(t => t.tag_name) || [],
            order_index: cp.order_index,
            collection_photo_id: cp.id
          };
        })
      );

      setPhotos(photosWithDetails.filter(p => p !== null) as AlbumPhoto[]);
    } catch (error) {
      console.error('Error fetching album photos:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = photos.findIndex((p) => p.id === active.id);
    const newIndex = photos.findIndex((p) => p.id === over.id);

    const reorderedPhotos = arrayMove(photos, oldIndex, newIndex);
    const updatedPhotos = reorderedPhotos.map((photo, index) => ({
      ...photo,
      order_index: index
    }));

    setPhotos(updatedPhotos);

    try {
      const updates = updatedPhotos.map((item) =>
        supabase
          .from('collection_photos')
          .update({ order_index: item.order_index })
          .eq('id', item.collection_photo_id)
      );

      await Promise.all(updates);
      onUpdate();
    } catch (error) {
      console.error('Error updating photo order:', error);
      fetchAlbumPhotos();
    }
  };

  const startEditing = (photo: AlbumPhoto) => {
    setEditingId(photo.id);
    setEditForm({
      title: photo.title,
      reason: photo.reason
    });
  };

  const saveEdit = async (photoId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('photos')
        .update({
          title: editForm.title,
          reason: editForm.reason
        })
        .eq('id', photoId);

      if (error) throw error;

      setPhotos(photos.map(p =>
        p.id === photoId
          ? { ...p, title: editForm.title, reason: editForm.reason }
          : p
      ));

      setEditingId(null);
      onUpdate();
    } catch (error) {
      console.error('Error updating photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromAlbum = async (collectionPhotoId: string) => {
    if (!confirm('Remove this photo from the album?')) return;

    try {
      const { error } = await supabase
        .from('collection_photos')
        .delete()
        .eq('id', collectionPhotoId);

      if (error) throw error;

      setPhotos(photos.filter(p => p.collection_photo_id !== collectionPhotoId));
      onUpdate();
    } catch (error) {
      console.error('Error removing photo:', error);
    }
  };

  const setCoverPhoto = async (photoId: string) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ cover_photo_id: photoId, auto_cover: false })
        .eq('id', albumId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error setting cover photo:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Album Photos ({photos.length})
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Drag to reorder • Click to edit
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={photos.map(p => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {photos.map((photo) => (
              <SortableItem
                key={photo.id}
                photo={photo}
                isEditing={editingId === photo.id}
                editForm={editForm}
                loading={loading}
                onStartEdit={() => startEditing(photo)}
                onSaveEdit={() => saveEdit(photo.id)}
                onCancelEdit={() => setEditingId(null)}
                onSetCover={() => setCoverPhoto(photo.id)}
                onRemove={() => removeFromAlbum(photo.collection_photo_id)}
                onEditFormChange={(field, value) =>
                  setEditForm({ ...editForm, [field]: value })
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {photos.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            No photos in this album yet
          </p>
        </div>
      )}
    </div>
  );
}
