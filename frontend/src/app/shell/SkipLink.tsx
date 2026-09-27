import { MAIN_CONTENT_ID } from './useFocusMainOnNavigate';

/** First focusable element on every page. Jumps keyboard users past the navigation. */
export function SkipLink() {
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      onClick={(event) => {
        event.preventDefault(); // avoid adding #main to the URL
        document.getElementById(MAIN_CONTENT_ID)?.focus();
      }}
      className="fixed top-3 left-3 z-(--z-toast) -translate-y-20 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-fg shadow-pop transition-transform duration-(--dur-2) focus:translate-y-0"
    >
      Skip to content
    </a>
  );
}
