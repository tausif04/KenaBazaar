import { Link, NavLink } from 'react-router-dom'
import { Heart, ShoppingCart, User, Search } from 'lucide-react'

const iconLink = 'flex size-10 items-center justify-center rounded-md hover:bg-surface'

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link to="/" className="text-xl font-extrabold tracking-tight text-brand-500">KenaBazaar</Link>

        <form role="search" className="relative hidden flex-1 md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search products"
            placeholder="Search products"
            className="h-10 w-full rounded-md border border-line bg-surface pl-9 pr-3 text-sm"
          />
        </form>

        <nav aria-label="Primary" className="ml-auto flex items-center gap-1">
          <NavLink to="/products" className="hidden px-3 text-sm font-medium hover:text-brand-600 sm:block">Shop</NavLink>
          <Link to="/wishlist" aria-label="Wishlist" className={iconLink}><Heart className="size-5" /></Link>
          <Link to="/cart" aria-label="Cart" className={iconLink}><ShoppingCart className="size-5" /></Link>
          <Link to="/account" aria-label="Account" className={iconLink}><User className="size-5" /></Link>
        </nav>
      </div>
    </header>
  )
}
