import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import QuantitySelector from './QuantitySelector'
import { formatPrice, variantLabel } from '../../utils/format'

export default function CartItem({ item, busy = false, onQuantity, onRemove }) {
    const { product, variant, quantity, subtotal } = item
    const overStock = quantity > variant.stock

    return (
        <li className={`flex gap-4 rounded-xl border border-gray-200 bg-white p-4 ${busy ? 'opacity-60' : ''}`}>
            <Link to={`/products/${product.id}`} className="shrink-0" aria-label={product.name}>
                <div className="h-20 w-20 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
                    {product.image ? (
                        <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-400">No image</div>
                    )}
                </div>
            </Link>

            <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <Link to={`/products/${product.id}`} className="line-clamp-2 font-semibold text-gray-900 hover:text-orange-600">
                        {product.name}
                    </Link>
                    <p className="text-xs text-gray-600">{variantLabel(variant)}</p>
                    <p className="mt-1 text-sm text-gray-900">{formatPrice(product.current_price)} each</p>
                    {variant.stock <= 0 ? (
                        <p className="mt-1 text-xs font-medium text-red-600">Currently out of stock</p>
                    ) : overStock ? (
                        <p className="mt-1 text-xs font-medium text-amber-600">Only {variant.stock} available. Please reduce the quantity.</p>
                    ) : null}
                </div>

                <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <QuantitySelector
                        value={quantity}
                        onChange={(q) => onQuantity(item.id, q)}
                        max={Math.max(variant.stock, 1)}
                        disabled={busy}
                        label={`Quantity for ${product.name}`}
                    />
                    <div className="w-24 text-right">
                        <p className="text-xs text-gray-500">Subtotal</p>
                        <p className="font-bold text-gray-900">{formatPrice(subtotal)}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onRemove(item.id)}
                        disabled={busy}
                        aria-label={`Remove ${product.name} from cart`}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-40"
                    >
                        <Trash2 className="h-5 w-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </li>
    )
}