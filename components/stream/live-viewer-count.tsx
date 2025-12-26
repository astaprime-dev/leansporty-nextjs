'use client';

import { useState, useEffect } from 'react';
import { Users, Eye } from 'lucide-react';

interface LiveViewerCountProps {
  streamId: string;
  /** Show detailed viewer list (instructor only) */
  showDetails?: boolean;
  /** Refresh interval in milliseconds (default: 10 seconds) */
  refreshInterval?: number;
  /** Display variant */
  variant?: 'compact' | 'full' | 'badge';
  className?: string;
}

interface ViewerData {
  user_id: string;
  display_name: string;
  username: string;
  profile_photo_url: string | null;
  started_watching_at: string;
  watch_duration_seconds: number;
}

interface ViewerResponse {
  success: boolean;
  streamId: string;
  activeViewers: number;
  viewers?: ViewerData[];
  timestamp: string;
}

/**
 * Live Viewer Count Component
 * Shows real-time count of active viewers watching a stream
 * Polls the API every 10 seconds to update the count
 */
export function LiveViewerCount({
  streamId,
  showDetails = false,
  refreshInterval = 10000,
  variant = 'compact',
  className = '',
}: LiveViewerCountProps) {
  const [viewerCount, setViewerCount] = useState<number>(0);
  const [viewers, setViewers] = useState<ViewerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchViewerCount = async () => {
      try {
        const url = showDetails
          ? `/api/streams/${streamId}/viewers?details=true`
          : `/api/streams/${streamId}/viewers`;

        const response = await fetch(url);
        const data: ViewerResponse = await response.json();

        if (data.success) {
          setViewerCount(data.activeViewers);
          if (data.viewers) {
            setViewers(data.viewers);
          }
        }
      } catch (error) {
        console.error('Failed to fetch viewer count:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchViewerCount();

    // Poll for updates
    const interval = setInterval(fetchViewerCount, refreshInterval);

    return () => clearInterval(interval);
  }, [streamId, showDetails, refreshInterval]);

  if (isLoading) {
    return null; // Don't show anything while loading
  }

  // Badge variant (minimal)
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 text-red-600 rounded-full text-sm font-medium ${className}`}
      >
        <Eye className="w-4 h-4" />
        <span>{viewerCount}</span>
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg ${className}`}
      >
        <Users className="w-5 h-5 text-pink-500" />
        <div>
          <div className="text-2xl font-bold text-gray-900">{viewerCount}</div>
          <div className="text-xs text-gray-500">
            {viewerCount === 1 ? 'viewer' : 'viewers'} online
          </div>
        </div>
      </div>
    );
  }

  // Full variant with viewer list
  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-pink-500" />
        <h3 className="font-semibold text-gray-900">
          {viewerCount} {viewerCount === 1 ? 'Viewer' : 'Viewers'} Watching
        </h3>
      </div>

      {showDetails && viewers.length > 0 && (
        <div className="space-y-2 mt-3 pt-3 border-t max-h-64 overflow-y-auto">
          {viewers.map((viewer) => (
            <div
              key={viewer.user_id}
              className="flex items-center gap-3 py-2 hover:bg-gray-50 rounded px-2"
            >
              {viewer.profile_photo_url ? (
                <img
                  src={viewer.profile_photo_url}
                  alt={viewer.display_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center">
                  <span className="text-pink-600 font-semibold text-xs">
                    {viewer.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {viewer.display_name}
                </p>
                <p className="text-xs text-gray-500">@{viewer.username}</p>
              </div>
              <div className="text-xs text-gray-400">
                {Math.floor(viewer.watch_duration_seconds / 60)}m
              </div>
            </div>
          ))}
        </div>
      )}

      {showDetails && viewers.length === 0 && viewerCount > 0 && (
        <p className="text-sm text-gray-500 mt-2">Loading viewer details...</p>
      )}
    </div>
  );
}
