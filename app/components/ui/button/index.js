import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

/* One button system for the whole site (shadcn-vue pattern: cva variants).
   44px high, 2px corners, 1px border, sentence case, 15px medium.
   Hover/focus: the label rolls up and a copy rises in; arrows nudge.
   No shimmer, glow, gradient, bounce or scale. Static for reduced motion. */
export const buttonVariants = cva(
  'group relative inline-flex h-11 select-none items-center justify-center gap-2 whitespace-nowrap rounded-sm border px-5 font-sans text-label font-medium transition-colors duration-200 ease-brand disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'border-chili bg-chili text-cream hover:border-chili-deep hover:bg-chili-deep',
        secondary: 'border-ink/60 bg-transparent text-ink hover:border-ink',
        'secondary-dark': 'border-cream/55 bg-transparent text-cream hover:border-cream',
      },
    },
    defaultVariants: { variant: 'primary' },
  },
)
