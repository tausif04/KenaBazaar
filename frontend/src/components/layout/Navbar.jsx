import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, Heart, Menu, Search, ShoppingCart, Store, X } from 'lucide-react'
import SearchBar from './SearchBar'
import CategoryMenu from './CategoryMenu'
import NavIconButton from './NavIconButton'
import AccountMenu from './AccountMenu'
import { useCartCount } from '../../features/cart/hooks'
import { useWishlistLookup } from '../../features/wishlist/hooks'

export default function Navbar() {
  const cartCount = useCartCount()
  const { count: wishlistCount } = useWishlistLookup()
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [catOpen, setCatOpen] = useState(false)
  const catRef = useRef(null)

  useEffect(() => {
    if (!catOpen) return undefined
    const onClick = (e) => {
      if (!catRef.current?.contains(e.target)) setCatOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setCatOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [catOpen])

  const closeAll = () => {
    setMenuOpen(false)
    setSearchOpen(false)
    setCatOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link
          to="/"
          onClick={closeAll}
          className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
        >
          <Store className="h-7 w-7 text-orange-600" aria-hidden="true" />
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            Kena<span className="text-orange-600">Bazaar</span>
          </span>
        </Link>

        {/* Desktop */}
        <div ref={catRef} className="relative ml-4 hidden lg:block">
          <button
            type="button"
            aria-expanded={catOpen}
            aria-haspopup="true"
            onClick={() => setCatOpen((o) => !o)}
            className="flex h-11 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            Categories{' '}
            <ChevronDown className={`h-4 w-4 transition-transform ${catOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
          {catOpen && (
            <div className="absolute left-0 top-12 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
              <CategoryMenu onNavigate={closeAll} />
            </div>
          )}
        </div>

        <SearchBar className="mx-4 hidden max-w-xl flex-1 lg:flex" />

        <nav className="ml-auto hidden items-center gap-1 lg:flex" aria-label="Primary">
          <NavIconButton to="/wishlist" icon={Heart} label="Wishlist" count={wishlistCount} showLabel />
          <NavIconButton to="/cart" icon={ShoppingCart} label="Cart" count={cartCount} showLabel />
          <AccountMenu />
        </nav>

        {/* Mobile */}
        <div className="ml-auto flex items-center lg:hidden">
          <button
            type="button"
            aria-label="Search"
            aria-expanded={searchOpen}
            onClick={() => setSearchOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <Search className="h-6 w-6" aria-hidden="true" />
          </button>
          <NavIconButton to="/cart" icon={ShoppingCart} label="Cart" count={cartCount} />
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-gray-100 px-4 py-3 lg:hidden">
          <SearchBar autoFocus onSubmitted={closeAll} />
        </div>
      )}

      {menuOpen && (
        <nav aria-label="Mobile" className="max-h-[70vh] overflow-y-auto border-t border-gray-100 bg-white px-4 py-3 lg:hidden">
          <div className="mb-3 flex gap-2">
            <Link
              to="/wishlist"
              onClick={closeAll}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-800"
            >
              <Heart className="h-5 w-5" aria-hidden="true" /> Wishlist{wishlistCount > 0 && ` (${wishlistCount})`}
            </Link>
            <AccountMenu mobile onNavigate={closeAll} />
          </div>
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">Categories</p>
          <CategoryMenu onNavigate={closeAll} />
        </nav>
      )}
    </header>
  )
}