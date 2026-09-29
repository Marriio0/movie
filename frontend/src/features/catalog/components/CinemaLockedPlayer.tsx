import { useState } from 'react';
import { KeyRound, Lock, Sparkles } from 'lucide-react';
import type { MediaDetails } from '../catalog.types';
import { useTitleTrailer } from '../catalog.hooks';
import { youtubeEmbedUrl } from '../lib/youtube';
import { useActivation } from '../lib/useActivation';
import { Button } from '@/shared/ui/Button';
import { useLanguage } from '@/shared/i18n/language-context';

export interface CinemaLockedPlayerProps {
  details: MediaDetails;
}

export function CinemaLockedPlayer({ details }: CinemaLockedPlayerProps) {
  const { unlock } = useActivation();
  const trailerQuery = useTitleTrailer(details.mediaType, details.id);
  const trailer = trailerQuery.data;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const result = unlock(code);
    if (!result.success) {
      setError(result.error || 'Invalid code');
    } else {
      setError(null);
    }
  };

  return (
    <section id="watch-player" aria-label={`Cinema Guide: ${details.title}`} className="space-y-4">
      {/* Official Media Player / Trailer Frame */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black shadow-2xl">
        {trailer?.youtubeKey ? (
          <iframe
            src={youtubeEmbedUrl(trailer.youtubeKey)}
            title={`${details.title} Official Trailer`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="size-full border-0"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center p-6 text-center">
            {details.backdropPath && (
              <img
                src={details.backdropPath}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-20 filter blur-xs"
              />
            )}
            <div className="relative z-10 space-y-2">
              <Lock className="mx-auto size-10 text-accent/80" />
              <h3 className="text-base font-bold text-fg">
                {language === 'ar' ? 'وضع المشاهدة VIP مقفل' : 'VIP Cinema Streaming'}
              </h3>
              <p className="max-w-md text-xs text-fg-muted">
                {language === 'ar'
                  ? 'أدخل كود التفعيل لفتح سيرفرات المشاهدة المباشرة والتحميل.'
                  : 'Enter your activation code below to unlock high-speed direct streaming and download servers.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Activation Gate Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-line/80 bg-surface-2/90 p-4 backdrop-blur-sm shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent border border-accent/20">
            <KeyRound className="size-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-fg">
              {language === 'ar' ? 'تفعيل المشاهدة السينمائية (VIP Code)' : 'VIP Cinema Stream Access'}
            </h4>
            <p className="text-[11px] text-fg-muted">
              {language === 'ar'
                ? 'أدخل كود الاشتراك netfarjo01 لمشاهدة الفيلم كاملاً بدون إعلانات.'
                : 'Enter activation code netfarjo01 to unlock all 5 streaming servers.'}
            </p>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="flex w-full sm:w-auto items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Code (e.g. netfarjo01)"
            className="w-full sm:w-48 rounded-lg border border-line bg-surface-1 px-3 py-1.5 text-xs font-mono text-fg placeholder:text-fg-subtle placeholder:font-sans focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <Button type="submit" size="sm" variant="primary" className="shrink-0 font-bold">
            <Sparkles className="size-3.5 fill-current" />
            {language === 'ar' ? 'تفعيل' : 'Unlock'}
          </Button>
        </form>
      </div>
      {error && <p className="text-xs text-red-400 font-medium px-1">{error}</p>}
    </section>
  );
}
