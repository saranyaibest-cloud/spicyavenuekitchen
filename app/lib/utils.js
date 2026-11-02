import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* tailwind-merge must know the custom font sizes, otherwise it treats
   `text-hero` as a colour and drops it next to `text-cream`. */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['label', 'body', 'title', 'section', 'hero'] }],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
