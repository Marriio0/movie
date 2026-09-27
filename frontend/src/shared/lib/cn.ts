import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Registers the custom scales from styles/theme.css. Without this, tailwind-merge would treat
// `text-display-lg` as a text color and drop it when combined with `text-fg`.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display-sm', 'display-md', 'display-lg'] }],
      shadow: [{ shadow: ['card', 'pop'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
