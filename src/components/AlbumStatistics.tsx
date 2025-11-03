import React from 'react';
import { Eye, Heart, Image as ImageIcon, Calendar, MapPin, Users } from 'lucide-react';

interface AlbumStatisticsProps {
  photoCount: number;
  viewCount: number;
  likeCount: number;
  isPublic: boolean;
  location?: string | null;
  dateRange?: {
    start: string | null;
    end: string | null;
  };
  collaboratorCount?: number;
}

export function AlbumStatistics({
  photoCount,
  viewCount,
  likeCount,
  isPublic,
  location,
  dateRange,
  collaboratorCount = 0
}: AlbumStatisticsProps) {
  const stats = [
    {
      icon: ImageIcon,
      label: 'Photos',
      value: photoCount,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    ...(isPublic ? [
      {
        icon: Eye,
        label: 'Views',
        value: viewCount,
        color: 'text-teal-600 dark:text-teal-400',
        bgColor: 'bg-teal-50 dark:bg-teal-900/20'
      },
      {
        icon: Heart,
        label: 'Likes',
        value: likeCount,
        color: 'text-pink-600 dark:text-pink-400',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20'
      }
    ] : [])
  ];

  const metadata = [
    ...(location ? [{
      icon: MapPin,
      label: 'Location',
      value: location,
      color: 'text-orange-600 dark:text-orange-400'
    }] : []),
    ...(dateRange?.start ? [{
      icon: Calendar,
      label: 'Date Range',
      value: formatDateRange(dateRange.start, dateRange.end),
      color: 'text-purple-600 dark:text-purple-400'
    }] : []),
    ...(collaboratorCount > 0 ? [{
      icon: Users,
      label: 'Collaborators',
      value: collaboratorCount.toString(),
      color: 'text-green-600 dark:text-green-400'
    }] : [])
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Album Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`${stat.bgColor} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      {stat.label}
                    </p>
                    <p className={`text-2xl font-bold ${stat.color}`}>
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {metadata.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Album Details
          </h3>
          <div className="card-glass p-4 space-y-3">
            {metadata.map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <div className="flex-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.label}:
                    </span>
                    <span className="ml-2 text-sm font-medium text-gray-900 dark:text-white">
                      {item.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {isPublic && (
        <div className="card-glass p-4 border-l-4 border-blue-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                Public Album
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This album is visible to anyone with the link. Views and likes are being tracked.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start) return 'Not set';

  const startDate = new Date(start);
  const startStr = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  if (!end || start === end) return startStr;

  const endDate = new Date(end);
  const endStr = endDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return `${startStr} - ${endStr}`;
}
