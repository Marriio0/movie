import { useState } from 'react';
import { CheckCircle2, KeyRound, Lock, Sparkles, X } from 'lucide-react';
import { Dialog } from 'radix-ui';
import { useActivation } from '../lib/useActivation';
import { Button } from '@/shared/ui/Button';
import { IconButton } from '@/shared/ui/IconButton';
import { useLanguage } from '@/shared/i18n/language-context';

export interface ActivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function ActivationModal({ open, onOpenChange, onSuccess }: ActivationModalProps) {
  const { isUnlocked, unlock, lock } = useActivation();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const { language } = useLanguage();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = unlock(code);
    if (result.success) {
      setJustUnlocked(true);
      setError(null);
      setTimeout(() => {
        setJustUnlocked(false);
        onOpenChange(false);
        setCode('');
        onSuccess?.();
      }, 1200);
    } else {
      setError(result.error || 'Invalid activation code');
    }
  };

  const handleRelock = () => {
    lock();
    setCode('');
    setJustUnlocked(false);
    setError(null);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-(--z-overlay) bg-black/80 backdrop-blur-md animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-(--z-overlay) w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-surface-1 p-6 shadow-2xl animate-in zoom-in-95 duration-200 outline-none">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2 text-accent">
              <KeyRound className="size-5" />
              <Dialog.Title className="text-base font-bold text-fg">
                {isUnlocked ? 'VIP Cinema Access' : 'VIP Cinema Activation'}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close">
                <X className="size-4" />
              </IconButton>
            </Dialog.Close>
          </div>

          <Dialog.Description className="text-xs text-fg-muted">
            {isUnlocked
              ? 'Your device currently has full access to 5 streaming servers and direct downloads.'
              : 'Enter your VIP activation code to unlock direct 4K cinema streaming and download servers.'}
          </Dialog.Description>

          {isUnlocked ? (
            <div className="mt-5 space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
                <CheckCircle2 className="size-5 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-300">VIP Cinema Mode Active</p>
                  <p className="text-fg-muted mt-0.5">
                    Ad-free servers & 4K playback unlocked on this device.
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={handleRelock}>
                  <Lock className="size-3.5 mr-1" />
                  {language === 'ar' ? 'إعادة القفل (Review Mode)' : 'Relock (Review Mode)'}
                </Button>
                <Button variant="primary" size="sm" onClick={() => onOpenChange(false)}>
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="mt-5 space-y-4">
              {justUnlocked ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/20 p-4 text-center text-sm font-bold text-emerald-400 border border-emerald-500/30 animate-in zoom-in">
                  <Sparkles className="size-5 shrink-0 animate-spin" />
                  <span>VIP Cinema Access Unlocked! Welcome to Netfarjo.</span>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label htmlFor="activation-code" className="text-xs font-semibold text-fg">
                      Activation / Subscription Code
                    </label>
                    <div className="relative">
                      <input
                        id="activation-code"
                        type="text"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck="false"
                        value={code}
                        onChange={(e) => {
                          setCode(e.target.value);
                          if (error) setError(null);
                        }}
                        placeholder="e.g. netfarjo01"
                        className="w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm font-mono tracking-wider text-fg placeholder:text-fg-subtle placeholder:font-sans focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    {error && (
                      <p className="text-xs font-medium text-red-400 animate-in fade-in">{error}</p>
                    )}
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenChange(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" className="font-bold">
                      <Sparkles className="size-3.5 fill-current" />
                      Unlock Cinema
                    </Button>
                  </div>
                </>
              )}
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
