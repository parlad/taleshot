import React, { useState } from 'react';
import { Download, FileArchive, Video, FileText, Loader2 } from 'lucide-react';
import type { Photo } from '../types';

interface AlbumExportOptionsProps {
  albumName: string;
  photos: Photo[];
}

export function AlbumExportOptions({ albumName, photos }: AlbumExportOptionsProps) {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportAsZip = async () => {
    setExporting('zip');
    try {
      const urls = photos.map(p => p.image_url || p.imageUrl);
      const message = `Preparing to download ${photos.length} photos as ZIP.\n\nNote: ZIP download requires a server-side implementation. This demo creates a download manifest.`;

      const manifest = {
        albumName,
        photoCount: photos.length,
        photos: photos.map((p, i) => ({
          filename: `${i + 1}-${p.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.jpg`,
          url: p.image_url || p.imageUrl,
          title: p.title
        }))
      };

      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${albumName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-manifest.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert(message);
    } catch (error) {
      console.error('Error exporting ZIP:', error);
      alert('Failed to export ZIP');
    } finally {
      setExporting(null);
    }
  };

  const exportAsSlideshow = async () => {
    setExporting('slideshow');
    try {
      const message = `Slideshow video generation initiated!\n\nThis would:\n- Create a ${photos.length}-photo slideshow\n- Add transitions and effects\n- Include background music\n- Export as MP4 video\n\nNote: Video generation requires server-side processing. This demo shows the concept.`;

      alert(message);
    } catch (error) {
      console.error('Error generating slideshow:', error);
      alert('Failed to generate slideshow');
    } finally {
      setExporting(null);
    }
  };

  const exportAsPDF = async () => {
    setExporting('pdf');
    try {
      const message = `PDF Photo Book generation initiated!\n\nThis would:\n- Create a professional photo book layout\n- Include titles and descriptions\n- Add page numbers and styling\n- Export as high-quality PDF\n\nNote: PDF generation requires a library like jsPDF. This demo shows the concept.`;

      alert(message);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    } finally {
      setExporting(null);
    }
  };

  const exportOptions = [
    {
      id: 'zip',
      icon: FileArchive,
      label: 'Download as ZIP',
      description: 'Download all photos in a compressed archive',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      onClick: exportAsZip
    },
    {
      id: 'slideshow',
      icon: Video,
      label: 'Generate Slideshow',
      description: 'Create an MP4 video with transitions and music',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      onClick: exportAsSlideshow
    },
    {
      id: 'pdf',
      icon: FileText,
      label: 'Create PDF Book',
      description: 'Generate a printable photo book',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      onClick: exportAsPDF
    }
  ];

  if (photos.length === 0) {
    return (
      <div className="card-glass p-6 text-center">
        <Download className="w-12 h-12 mx-auto mb-3 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400">
          Add photos to enable export options
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <Download className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Export Options
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {photos.length} photo{photos.length !== 1 ? 's' : ''} ready
        </span>
      </div>

      <div className="space-y-3">
        {exportOptions.map((option) => {
          const Icon = option.icon;
          const isExporting = exporting === option.id;

          return (
            <button
              key={option.id}
              onClick={option.onClick}
              disabled={isExporting}
              className={`w-full ${option.bgColor} rounded-xl p-4 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group`}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                  {isExporting ? (
                    <Loader2 className={`w-6 h-6 ${option.color} animate-spin`} />
                  ) : (
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                    {option.label}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {option.description}
                  </p>
                </div>
                <div className={`px-3 py-1 ${option.bgColor} rounded-full`}>
                  <span className={`text-xs font-semibold ${option.color}`}>
                    {photos.length} items
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="card-glass p-4 border-l-4 border-teal-500">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold text-gray-900 dark:text-white">Note:</span> Export features generate files based on your album content. Processing time depends on the number of photos.
        </p>
      </div>
    </div>
  );
}
