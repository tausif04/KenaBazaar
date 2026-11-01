import { Link } from 'react-router-dom'
import { BadgePercent, LayoutGrid, ShoppingBag, Sparkles, Tag, Zap } from 'lucide-react'

// `to` = another page (router link). `hash` = a section further down this home page.
const SHORTCUTS = [
  { label: 'Lowest price', icon: Tag, to: '/products?ordering=regular_price' },
  { label: 'Latest drops', icon: Sparkles, to: '/products?ordering=-created_at' },
  { label: 'Deals', icon: BadgePercent, hash: '#deals' },
  { label: 'Featured', icon: Zap, hash: '#featured' },
  { label: 'Categories', icon: LayoutGrid, hash: '#categories' },
  { label: 'All products', icon: ShoppingBag, to: '/products' },
]

const tile =
  'flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-900 ' +
  'transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500'

function Inner({ icon: Icon, label }) {
  return (
    <>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span>{label}</span>
    </>
  )
}

export default function ShortcutTiles() {
  return (
    <nav aria-label="Shortcuts">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {SHORTCUTS.map((s) => (
          <li key={s.label}>
            {s.to ? (
              <Link to={s.to} className={tile}><Inner {...s} /></Link>
            ) : (
              <a href={s.hash} className={tile}><Inner {...s} /></a>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
