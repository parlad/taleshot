import React, { useState } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';
import type { Photo, Category } from '../types';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (photo: Omit<Photo, 'id' | 'imageUrl' | 'image_url'>) => void;
  fileCount: number;
  selectedFiles: File[];
  categories: Category[];
}

export function AddPhotoModal({ isOpen, onClose, onAdd, fileCount, selectedFiles, categories }: AddPhotoModalProps) {
  const [details, setDetails] = useState({
    title: '',
    date_taken: new Date().toISOString().split('T')[0],
    reason: '',
    is_public: false,
    categories: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedDate = new Date(details.date_taken).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    onAdd({
      title: details.title,
      date_taken: formattedDate,
      reason: details.reason,
      is_public: details.is_public,
      categories: details.categories
    });

    setDetails({
      title: '',
      date_taken: new Date().toISOString().split('T')[0],
      reason: '',
      is_public: false,
      categories: []
    });
  };

  const handleCategoryToggle = (categoryName: string) => {
    setDetails(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-6xl mx-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 z-10"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="p-6 flex gap-6">
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
                value={details.date_taken}
                onChange={e => setDetails(prev => ({ ...prev, date_taken: e.target.value }))}
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

              {/* Privacy Setting */}
              <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-2">
                  {details.is_public ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={details.is_public}
                      onChange={e => setDetails(prev => ({ ...prev, is_public: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="font-medium">
                      {details.is_public ? 'Public' : 'Private'}
                    </span>
                  </label>
                </div>
                <p className="text-sm text-gray-600">
                  {details.is_public 
                    ? 'Others can discover and view these photos'
                    : 'Only you can see these photos'
                  }
                </p>
              </div>

              {/* Categories */}
              {categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleCategoryToggle(category.name)}
                        className={`px-3 py-1 rounded-full text-sm transition-colors ${
                          details.categories.includes(category.name)
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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