// Hero banners. Text-on-gradient for now. To use real artwork later, add
// `image: '/banners/new-arrivals.jpg'` (file in /public) and it is drawn behind the text.
// Keep copy truthful: only promise what the store actually offers.
export const HERO_SLIDES = [
  {
    id: 'new',
    eyebrow: 'Just in',
    title: 'Fresh arrivals, every week',
    text: 'See what has landed in the store lately.',
    cta: 'Shop new arrivals',
    to: '/products?ordering=-created_at',
    bg: 'from-orange-700 to-red-700',
  },
  {
    id: 'price',
    eyebrow: 'Budget friendly',
    title: 'Great finds at low prices',
    text: 'Sort the whole store from the lowest price up.',
    cta: 'Lowest prices first',
    to: '/products?ordering=regular_price',
    bg: 'from-green-700 to-emerald-800',
  },
  {
    id: 'all',
    eyebrow: 'KenaBazaar',
    title: 'Everything in one place',
    text: 'Browse every category and check out securely.',
    cta: 'Browse all products',
    to: '/products',
    bg: 'from-gray-900 to-gray-700',
  },
]
