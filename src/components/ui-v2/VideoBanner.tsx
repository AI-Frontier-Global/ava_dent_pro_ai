import { useState, useEffect } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { VideoContent } from './VideoModal';

type Props = {
  onPlay: (video: VideoContent) => void;
};

export default function VideoBanner({ onPlay }: Props) {
  const [video, setVideo] = useState<VideoContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('video_content')
          .select('id, title, description, video_url, thumbnail_url, tool_link, tool_label, is_active')
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!cancelled && !error && data) {
          setVideo(data as VideoContent);
        }
      } catch {
        // silent fail — banner is optional
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-44 animate-pulse rounded-2xl bg-slate-100" dir="rtl" />
    );
  }

  if (!video) return null;

  return (
    <button
      onClick={() => onPlay(video)}
      className="group relative block w-full overflow-hidden rounded-2xl bg-gradient-to-l from-slate-800 to-slate-900 text-right shadow-elev-2 transition-all hover:shadow-elev-3"
      dir="rtl"
    >
      {video.thumbnail_url && (
        <div className="absolute inset-0">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="h-full w-full object-cover opacity-60 transition-opacity group-hover:opacity-50"
          />
        </div>
      )}
      <div className="relative flex items-center gap-4 p-5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform group-hover:scale-110">
          <Play size={24} className="fill-white text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles size={13} className="text-brand-300" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-200">فيديو تعريفي</span>
          </div>
          <h3 className="truncate text-base font-bold text-white">{video.title}</h3>
          {video.description && (
            <p className="mt-0.5 truncate text-xs text-slate-300">{video.description}</p>
          )}
        </div>
      </div>
    </button>
  );
}
