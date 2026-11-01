// Public store details. Set these in .env (VITE_*); anything left empty is simply not shown.
const env = import.meta.env

export const SITE = {
  name: 'KenaBazaar',
  tagline: 'Your everyday online marketplace.',
  email: env.VITE_SUPPORT_EMAIL ?? '',
  phone: env.VITE_SUPPORT_PHONE ?? '',
  address: env.VITE_STORE_ADDRESS ?? '',
  hours: env.VITE_SUPPORT_HOURS ?? '',
}

// Optional end of the current sale, e.g. VITE_SALE_ENDS_AT=2026-11-30T23:59:00+06:00.
// Not set (or in the past) = no countdown is shown. Never fake a timer: a real one
// needs a sale end date from the backend.
const parsed = env.VITE_SALE_ENDS_AT ? Date.parse(env.VITE_SALE_ENDS_AT) : NaN
export const SALE_ENDS_AT = Number.isNaN(parsed) ? null : parsed
