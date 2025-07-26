import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Photo, Category } from '../types';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (photo: Omit<Photo, 'id' | 'imageUrl'>) => void;
  fileCount: number;
  selectedFiles: File[];
  categories: Category[];
}

export function AddPhotoModal({ isOpen, onClose, onAdd, fileCount, selectedFiles }: AddPhotoModalProps) {
  const [details, setDetails] = useState({
    title: '',
    dateTaken: new Date().toISOString().split('T')[0],
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedDate = new Date(details.dateTaken).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    onAdd({
      title: details.title,
      dateTaken: formattedDate,
      reason: details.reason
    });

    setDetails({
      title: '',
      dateTaken: new Date().toISOString().split('T')[0],
      reason: ''
    });
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