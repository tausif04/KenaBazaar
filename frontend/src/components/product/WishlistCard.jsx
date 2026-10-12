import { Link } from 'react-router-dom';
import { ShoppingCart, Trash2 } from 'lucide-react';
import ProductPrice from './ProductPrice';
import { useAddToCart } from '../../features/cart/hooks';
import { useRemoveFromWishlist } from '../../features/wishlist/hooks';
import { primaryImage, totalStock } from '../../utils/format';
import { buttonClasses } from '../../utils/ui';

export default function WishlistCard({ item }) {
    const { product } = item;
    const addToCart = useAddToCart();
    const remove = useRemoveFromWishlist();

    const image = primaryImage(product);
    const variants = product.variants ?? [];
    const available = product.is_active !== false && totalStock(product) > 0;
    const single = variants.length === 1 ? variants[0] : null;

    return (
        <article className={`flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white ${remove.isPending ? 'opacity-60' : ''}`}>
            <Link to={`/products/${product.id}`} aria-label={product.name}>
                <div className="aspect-square bg-gray-100">
                    {image ? (
                        <img src={image.image} alt={image.alt_text || product.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                    )}
                </div>
            </Link>
            <div className="flex flex-1 flex-col gap-2 p-3">
                <Link to={`/products/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-medium hover:text-orange-600">
                    {product.name}
                </Link>
                <ProductPrice product={product} />
                <p className={`text-xs font-medium ${available ? 'text-green-700' : 'text-red-600'}`}>
                    {available ? 'In stock' : 'Out of stock'}
                </p>

                <div className="mt-auto space-y-2 pt-1">
                    {!available ? (
                        <button type="button" disabled className={`${buttonClasses('primary', 'sm')} w-full`}>Out of stock</button>
                    ) : single ? (
                        <button
                            type="button"
                            disabled={addToCart.isPending}
                            onClick={() => addToCart.mutate({ variantId: single.id, quantity: 1 })}
                            className={`${buttonClasses('primary', 'sm')} w-full`}
                        >
                            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                            {addToCart.isPending ? 'Adding…' : 'Add to cart'}
                        </button>
                    ) : (
                        <Link to={`/products/${product.id}`} className={`${buttonClasses('outline', 'sm')} w-full`}>Select options</Link>
                    )}
                    <button
                        type="button"
                        disabled={remove.isPending}
                        onClick={() => remove.mutate(item.id)}
                        className={`${buttonClasses('ghost', 'sm')} w-full text-gray-600`}
                    >
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                    </button>
                </div>
            </div>
        </article>
    );
}