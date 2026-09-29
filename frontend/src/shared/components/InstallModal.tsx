import { Check, Download, Smartphone, X } from 'lucide-react';
import { APP_NAME } from '@/shared/config/app';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';

export interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstallNative?: () => Promise<boolean | void>;
  canPromptNative?: boolean;
}

export function InstallModal({
  isOpen,
  onClose,
  onInstallNative,
  canPromptNative,
}: InstallModalProps) {
  if (!isOpen) return null;

  const apkDownloadUrl =
    'https://github.com/Marriio0/movie/releases/download/v1.0.0-apk/Netfarjo-v1.0.apk';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-line/80 bg-surface-1 p-6 shadow-2xl space-y-5 text-center"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <IconButton label="Close" onClick={onClose} className="text-fg-muted hover:text-fg">
            <X className="size-4" />
          </IconButton>
        </div>

        {/* Brand App Icon (Yacine TV Style) */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-amber-500/15 border-2 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-500/10">
            <span className="font-black text-3xl tracking-tighter">N</span>
          </div>
          <div>
            <h3 id="install-modal-title" className="text-lg font-bold text-fg">
              تطبيق <bdi className="text-amber-400">{APP_NAME}</bdi> للأندرويد
            </h3>
            <p className="text-xs text-fg-muted">
              النسخة الأصلية v1.0 • مشاهدة سريعة بدون تقطيع
            </p>
          </div>
        </div>

        {/* Big Primary Action: Direct APK Download (Yacine TV Style) */}
        <div className="space-y-3">
          <a
            href={apkDownloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 py-3.5 px-4 font-bold text-sm text-black shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Download className="size-5" />
            <span>تحميل التطبيق مباشر (APK)</span>
          </a>

          {/* Quick PWA option for browsers that support it */}
          {canPromptNative && onInstallNative && (
            <Button
              variant="secondary"
              size="md"
              onClick={async () => {
                await onInstallNative();
                onClose();
              }}
              className="w-full text-xs font-semibold h-10 border border-line"
            >
              <Smartphone className="size-4 text-accent" />
              <span>أو التثبيت الفوري عبر المتصفح (PWA)</span>
            </Button>
          )}
        </div>

        {/* Minimal Feature Badges - Yacine TV style */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-fg-muted border-t border-line/60 pt-3">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <Check className="size-3.5" />
            مجاني 100%
          </span>
          <span>•</span>
          <span>حجم خفيف 3.4 MB</span>
          <span>•</span>
          <span>يعمل على التلفاز والهاتف</span>
        </div>
      </div>
    </div>
  );
}
