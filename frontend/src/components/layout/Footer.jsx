import { Link } from 'react-router-dom'
import { CreditCard, Mail, MapPin, Phone, ShieldCheck, Store } from 'lucide-react'
import { SITE } from '../../config/site'

// Only link to pages that exist. Add Returns / Privacy / Terms here once those pages are built.
const SHOP_LINKS = [
  { label: 'All products', to: '/products' },
  { label: 'New arrivals', to: '/products?ordering=-created_at' },
  { label: 'Lowest price first', to: '/products?ordering=regular_price' },
  { label: 'Cart', to: '/cart' },
  { label: 'Wishlist', to: '/wishlist' },
]

const ACCOUNT_LINKS = [
  { label: 'My orders', to: '/orders' },
  { label: 'My account', to: '/account' },
  { label: 'Log in', to: '/login' },
  { label: 'Create an account', to: '/register' },
  { label: 'Reset password', to: '/forgot-password' },
]

const linkClass = 'text-gray-700 hover:text-orange-600 focus:outline-none focus-visible:underline'

function LinkColumn({ title, links }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.label}><Link to={l.to} className={linkClass}>{l.label}</Link></li>
        ))}
      </ul>
    </nav>
  )
}

function ContactLine({ icon: Icon, children }) {
  return (
    <li className="flex items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
      <span>{children}</span>
    </li>
  )
}

export default function Footer() {
  const { email, phone, address, hours } = SITE
  const hasContact = email || phone || address

  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-600" aria-hidden="true" />
            <span className="text-lg font-extrabold text-gray-900">
              Kena<span className="text-orange-600">Bazaar</span>
            </span>
          </Link>
          <p className="mt-2 text-sm text-gray-600">{SITE.tagline}</p>
          {hasContact && (
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {address && <ContactLine icon={MapPin}>{address}</ContactLine>}
              {phone && (
                <ContactLine icon={Phone}>
                  <a href={`tel:${phone.replace(/\s/g, '')}`} className={linkClass}>{phone}</a>
                  {hours && <span className="block text-xs text-gray-600">{hours}</span>}
                </ContactLine>
              )}
              {email && (
                <ContactLine icon={Mail}>
                  <a href={`mailto:${email}`} className={linkClass}>{email}</a>
                </ContactLine>
              )}
            </ul>
          )}
        </div>

        <LinkColumn title="Shop" links={SHOP_LINKS} />
        <LinkColumn title="Your account" links={ACCOUNT_LINKS} />

        <div>
          <h2 className="text-base font-bold text-gray-900">Payments</h2>
          <ul className="mt-3 space-y-2 text-sm text-gray-700">
            <li className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-500" aria-hidden="true" /> Credit and debit cards
            </li>
            <li className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-green-700" aria-hidden="true" /> Secure checkout by Stripe
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-600">
        &copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.
      </div>
    </footer>
  )
}
