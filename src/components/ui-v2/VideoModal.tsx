import { X, Play, ExternalLink } from 'lucide-react';
import { useEffect } from 'react';

export type VideoContent = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  tool_link: string | null;
  tool_label: string | null;
  is_active: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  video: VideoContent | null;
  onTryNow?: (toolLink: string) => void;
};

export default function VideoModal({ open, onClose, video, onTryNow }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !video) return null;

  const isYouTube = video.video_url.includes('youtube.com') || video.video_url.includes('youtu.be');
  const embedUrl = isYouTube
    ? video.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
    : video.video_url;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-elev-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-600 shadow-elev-1 transition-colors hover:bg-white hover:text-slate-900"
          aria-label="إغلاق"
        >
          <X size={18} />
        </button>

        <div className="aspect-video w-full bg-slate-900">
          {isYouTube ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video src={video.video_url} controls className="h-full w-full" />
          )}
        </div>

        <div className="p-6">
          <h3 className="text-xl font-bold text-slate-800">{video.title}</h3>
          {video.description && (
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{video.description}</p>
          )}

          {video.tool_link && (
            <button
              onClick={() => {
                if (onTryNow) {
                  onTryNow(video.tool_link!);
                } else {
                  window.open(video.tool_link!, '_blank');
                }
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-l from-brand-500 to-accent-600 px-5 py-2.5 text-sm font-bold text-white shadow-elev-2 shadow-brand-500/30 transition-all hover:shadow-xl active:scale-[0.98]"
            >
              <Play size={16} />
              {video.tool_label || 'جرب الآن'}
              <ExternalLink size={14} className="opacity-70" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
