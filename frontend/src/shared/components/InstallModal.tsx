import { Check, Download, Monitor, Smartphone, X } from 'lucide-react';
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-line bg-surface-1 p-6 shadow-2xl space-y-5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-accent/20 text-accent font-black text-lg">
              N
            </div>
            <div>
              <h3 id="install-modal-title" className="text-base font-bold text-fg">
                تثبيت تطبيق {APP_NAME} على جهازك
              </h3>
              <p className="text-xs text-fg-muted">
                مشاهدة وتحميل الأفلام والمسلسلات مباشرة بدون متصفح وبأقصى سرعة
              </p>
            </div>
          </div>
          <IconButton label="Close" onClick={onClose} className="-mr-2 text-fg-muted hover:text-fg">
            <X className="size-4" />
          </IconButton>
        </div>

        {/* Quick Native Install Button if browser supports it */}
        {canPromptNative && onInstallNative && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Download className="size-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-fg">تثبيت فوري بنقرة واحدة</p>
                <p className="text-[11px] text-fg-muted">متصفحك يدعم التثبيت المباشر الآن</p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={async () => {
                await onInstallNative();
                onClose();
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4 shrink-0 shadow-sm"
            >
              تثبيت الآن
            </Button>
          </div>
        )}

        {/* Step-by-Step Guides per device */}
        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          {/* iOS / iPhone / iPad */}
          <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-fg">
              <Smartphone className="size-4 text-accent" />
              <span>هواتف آيفون وآيباد (Safari)</span>
            </div>
            <ol className="space-y-1.5 text-fg-muted list-decimal list-inside leading-relaxed text-[11px]">
              <li>
                اضغط على زر <strong className="text-fg">المشاركة ⎋ (Share)</strong> أسفل الشاشة.
              </li>
              <li>
                مرر للأسفل واضغط <strong className="text-fg">إضافة إلى الشاشة الرئيسية ➕ (Add to Home Screen)</strong>.
              </li>
              <li>
                اضغط <strong className="text-emerald-400">إضافة (Add)</strong> وسيظهر التطبيق على شاشتك.
              </li>
            </ol>
          </div>

          {/* Android / Samsung / Chrome */}
          <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-fg">
              <Smartphone className="size-4 text-emerald-400" />
              <span>أندرويد (Chrome / سامسونج)</span>
            </div>
            <ol className="space-y-1.5 text-fg-muted list-decimal list-inside leading-relaxed text-[11px]">
              <li>
                اضغط على <strong className="text-fg">القائمة ⋮</strong> في أعلى يمين المتصفح.
              </li>
              <li>
                اختر <strong className="text-fg">تثبيت التطبيق (Install App)</strong> أو إضافة للشاشة.
              </li>
              <li>
                اضغط <strong className="text-emerald-400">تثبيت</strong> للاستخدام بدون متصفح.
              </li>
            </ol>
          </div>

          {/* Desktop Mac / Safari */}
          <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-fg">
              <Monitor className="size-4 text-blue-400" />
              <span>ماك (Safari macOS)</span>
            </div>
            <ol className="space-y-1.5 text-fg-muted list-decimal list-inside leading-relaxed text-[11px]">
              <li>
                من القائمة العلوية اضغط على <strong className="text-fg">File (ملف)</strong>.
              </li>
              <li>
                اختر <strong className="text-fg">Add to Dock (إضافة إلى Dock)</strong>.
              </li>
              <li>
                سيعمل {APP_NAME} كتطبيق Mac أصلي فائق السرعة.
              </li>
            </ol>
          </div>

          {/* Desktop PC / Mac (Chrome / Brave / Edge) */}
          <div className="rounded-xl border border-line bg-surface-2 p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-fg">
              <Monitor className="size-4 text-purple-400" />
              <span>الحاسوب (Chrome / Brave)</span>
            </div>
            <ol className="space-y-1.5 text-fg-muted list-decimal list-inside leading-relaxed text-[11px]">
              <li>
                اضغط على أيقونة التثبيت <strong className="text-fg">(⊕)</strong> في شريط العناوين بالأعلى.
              </li>
              <li>
                أو افتح القائمة ⋮ واختر <strong className="text-fg">حفظ وتثبيت &gt; تثبيت {APP_NAME}</strong>.
              </li>
              <li>
                استمتع بمشاهدة سينمائية في نافذة مستقلة.
              </li>
            </ol>
          </div>
        </div>

        {/* Features footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3 text-[11px] text-fg-subtle">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <Check className="size-3.5" />
            <span>تنزيل وتشغيل فوري، بدون إعلانات وبدون برامج خارجية</span>
          </div>
          <Button size="sm" variant="secondary" onClick={onClose} className="h-7 text-xs">
            حسناً، فهمت
          </Button>
        </div>
      </div>
    </div>
  );
}
