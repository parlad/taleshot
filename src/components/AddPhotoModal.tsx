import React, { useState, useEffect } from 'react';
import { X, Plus, Globe } from 'lucide-react';
import type { Photo, Category } from '../types';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (photo: Omit<Photo, 'id' | 'imageUrl'>) => void;
  fileCount: number;
  selectedFiles: File[];
  categories: Category[];
}

export function AddPhotoModal({ isOpen, onClose, onAdd, fileCount, selectedFiles, categories }: AddPhotoModalProps) {
  const [details, setDetails] = useState({
    title: '',
    dateTaken: new Date().toISOString().split('T')[0],
    reason: '',
    categories: [] as string[],
    newCategory: '',
    isPublic: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure categories are unique before submitting
    const uniqueCategories = Array.from(new Set(details.categories));
    
    const formattedDate = new Date(details.dateTaken).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    onAdd({
      title: details.title,
      dateTaken: formattedDate,
      reason: details.reason,
      categories: uniqueCategories,
      is_public: details.isPublic
    });

    setDetails({
      title: '',
      dateTaken: new Date().toISOString().split('T')[0],
      reason: '',
      categories: [],
      newCategory: '',
      isPublic: false
    });
  };

  const addNewCategory = async () => {
    if (!details.newCategory.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: details.newCategory.trim(), user_id: user.id }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          alert('A category with this name already exists');
        } else {
          console.error('Error adding category:', error);
        }
        return;
      }

      // Ensure we don't add duplicate categories
      setDetails(prev => ({
        ...prev,
        categories: Array.from(new Set([...prev.categories, data.name])),
        newCategory: ''
      }));
    } catch (error) {
      console.error('Error in addNewCategory:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-6 flex gap-6">
          {/* Preview Section */}
          <div className="w-1/3">
            <h3 className="text-lg font-semibold mb-4">Selected Photos ({fileCount})</h3>
            <div className="grid grid-cols-2 gap-4 max-h-[600px] overflow-y-auto">
              {selectedFiles.map((file, index) => (
                <div key={index} className="aspect-square relative rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="flex-1">
            <h2 className="text-2xl font-bold mb-6">Add New Memories</h2>
            
            <div className="grid grid-cols-1 gap-6">
              <input
                type="text"
                placeholder="Title"
                value={details.title}
                onChange={e => setDetails(prev => ({ ...prev, title: e.target.value }))}
                className="input-field"
                required
              />
              
              <input
                type="date"
                value={details.dateTaken}
                onChange={e => setDetails(prev => ({ ...prev, dateTaken: e.target.value }))}
                className="input-field"
                required
                max={new Date().toISOString().split('T')[0]}
              />
              
              <textarea
                placeholder="What makes this memory special?"
                value={details.reason}
                onChange={e => setDetails(prev => ({ ...prev, reason: e.target.value }))}
                className="input-field min-h-[100px]"
                required
              />

              <div className="space-y-4">
                <h3 className="font-semibold">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-full cursor-pointer hover:bg-gray-200"
                    >
                      <input
                        type="checkbox"
                        checked={details.categories.includes(category.name)}
                        onChange={(e) => {
                          setDetails(prev => ({
                            ...prev,
                            categories: e.target.checked
                              ? [...prev.categories, category.name]
                              : prev.categories.filter(c => c !== category.name)
                          }));
                        }}
                        className="sr-only"
                      />
                      <span>{category.name}</span>
                      {details.categories.includes(category.name) && (
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                      )}
                    </label>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new category"
                    value={details.newCategory}
                    onChange={e => setDetails(prev => ({ ...prev, newCategory: e.target.value }))}
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={addNewCategory}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={details.isPublic}
                  onChange={(e) => setDetails(prev => ({ ...prev, isPublic: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  Make these photos public
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Memories
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}