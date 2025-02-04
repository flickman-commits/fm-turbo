import { useState, useEffect } from 'react';
import { Video } from '@/types/forms';
import { getRelevantVideos } from '@/services/db';

interface PortfolioVideoSelectorProps {
  projectType: string;
  userId: string;
  onSelect: (videos: Video[]) => void;
}

export function PortfolioVideoSelector({ projectType, userId, onSelect }: PortfolioVideoSelectorProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      if (!projectType || !userId) return;

      setLoading(true);
      setError(null);

      try {
        const relevantVideos = await getRelevantVideos(userId, projectType);
        setVideos(relevantVideos);
        onSelect(relevantVideos);
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        setError('Failed to fetch videos');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [projectType, userId, onSelect]);

  if (loading) {
    return <div className="text-center py-6 text-black/60">Loading videos...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500">{error}</div>;
  }

  if (videos.length === 0) {
    return <div className="text-center py-6 text-black/60">No relevant videos found</div>;
  }

  return (
    <div className="space-y-4">
      {videos.map((video) => (
        <div key={video.id} className="flex items-center gap-4 p-4 bg-black/5 rounded-lg">
          {video.thumbnail && (
            <img 
              src={video.thumbnail} 
              alt={video.title} 
              className="w-24 h-16 object-cover rounded"
            />
          )}
          <div className="flex-1">
            <h3 className="font-medium text-black">{video.title}</h3>
            {video.description && (
              <p className="text-sm text-black/60">{video.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 