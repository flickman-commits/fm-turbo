import { useState, useEffect } from 'react';
import { getRelevantVideos } from '@/services/db';

interface Video {
  id: string;
  title: string;
  description: string | null;
  url: string;
  thumbnail: string | null;
  views: number;
  likes: number;
}

interface PortfolioVideoSelectorProps {
  projectType: string;
  userId: string;
  onSelect: (videos: Video[]) => void;
}

export function PortfolioVideoSelector({ projectType, userId, onSelect }: PortfolioVideoSelectorProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setIsLoading(true);
        const relevantVideos = await getRelevantVideos(userId, projectType);
        setVideos(relevantVideos);
      } catch (error) {
        console.error('Failed to load portfolio videos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (projectType && userId) {
      loadVideos();
    }
  }, [projectType, userId]);

  const handleVideoToggle = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else if (newSelected.size < 3) {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
    onSelect(videos.filter(v => newSelected.has(v.id)));
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-black/5 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-6 text-black/60">
        No relevant portfolio videos found. Connect your Vimeo account to include examples in your proposals.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-black/60 mb-2">
        Select up to 3 relevant examples to include in your proposal
      </div>
      {videos.map(video => (
        <div
          key={video.id}
          className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-colors cursor-pointer ${
            selectedVideos.has(video.id)
              ? 'border-[#29ABE2] bg-[#29ABE2]/5'
              : 'border-black/10 hover:border-black/20'
          }`}
          onClick={() => handleVideoToggle(video.id)}
        >
          {video.thumbnail && (
            <div className="w-32 h-20 bg-black/5 rounded overflow-hidden flex-shrink-0">
              <img
                src={video.thumbnail}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-black truncate">{video.title}</h4>
            {video.description && (
              <p className="text-sm text-black/60 line-clamp-2">{video.description}</p>
            )}
            <div className="flex items-center gap-4 mt-1 text-sm text-black/40">
              <span>{video.views.toLocaleString()} views</span>
              <span>{video.likes.toLocaleString()} likes</span>
            </div>
          </div>
          <div className="w-6 h-6 rounded-full border-2 border-black/20 flex items-center justify-center flex-shrink-0">
            {selectedVideos.has(video.id) && (
              <div className="w-3 h-3 rounded-full bg-[#29ABE2]"></div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
} 