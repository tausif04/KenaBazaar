import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-orange-600" aria-hidden="true" />
            <span className="text-lg font-extrabold text-gray-900">
              Kena<span className="text-orange-600">Bazaar</span>
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-600">Your everyday online marketplace.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
          <Link to="/products" className="hover:text-orange-600">All products</Link>
          <Link to="/cart" className="hover:text-orange-600">Cart</Link>
          <Link to="/wishlist" className="hover:text-orange-600">Wishlist</Link>
        </nav>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} KenaBazaar. All rights reserved.
      </div>
    </footer>
  );
}