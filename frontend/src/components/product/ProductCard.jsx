import { Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import ProductPrice from './ProductPrice';
import { useAddToCart } from '../../features/cart/hooks';
import {
    useAddToWishlist, useRemoveFromWishlist, useWishlistLookup,
} from '../../features/wishlist/hooks';
import { isOnSale, primaryImage, totalStock } from '../../utils/format';
import { buttonClasses } from '../../utils/ui';

export default function ProductCard({ product }) {
    const addToCart = useAddToCart();
    const addWish = useAddToWishlist();
    const removeWish = useRemoveFromWishlist();
    const { map } = useWishlistLookup();

    const image = primaryImage(product);
    const variants = product.variants ?? [];
    const stock = totalStock(product);
    const available = product.is_active !== false && stock > 0;
    const singleVariant = variants.length === 1 ? variants[0] : null;
    const wishlistItemId = map.get(product.id);
    const inWishlist = wishlistItemId !== undefined;
    const wishBusy = addWish.isPending || removeWish.isPending;
    const discount = isOnSale(product)
        ? Math.round((1 - Number(product.sale_price) / Number(product.regular_price)) * 100)
        : 0;

    const toggleWishlist = () =>
        inWishlist ? removeWish.mutate(wishlistItemId) : addWish.mutate(product.id);

    return (
        <article className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md">
            <div className="relative">
                <Link to={`/products/${product.id}`} aria-label={product.name}>
                    <div className="aspect-square bg-gray-100">
                        {image ? (
                            <img
                                src={image.image}
                                alt={image.alt_text || product.name}
                                loading="lazy"
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-gray-400">No image</div>
                        )}
                    </div>
                </Link>

                {discount > 0 && (
                    <span className="absolute left-2 top-2 rounded-md bg-orange-600 px-2 py-0.5 text-xs font-bold text-white">
                        -{discount}%
                    </span>
                )}

                <button
                    type="button"
                    onClick={toggleWishlist}
                    disabled={wishBusy}
                    aria-pressed={inWishlist}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    className="absolute right-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 disabled:opacity-50"
                >
                    <Heart
                        className={`h-5 w-5 ${inWishlist ? 'fill-orange-600 text-orange-600' : 'text-gray-700'}`}
                        aria-hidden="true"
                    />
                </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-3">
                <Link to={`/products/${product.id}`} className="line-clamp-2 min-h-[2.5rem] text-sm font-medium text-gray-900 hover:text-orange-600">
                    {product.name}
                </Link>
                <ProductPrice product={product} />
                <p className={`text-xs font-medium ${available ? 'text-green-700' : 'text-red-600'}`}>
                    {available ? 'In stock' : 'Out of stock'}
                </p>

                <div className="mt-auto pt-1">
                    {!available ? (
                        <button type="button" disabled className={`${buttonClasses('primary', 'sm')} w-full`}>
                            Out of stock
                        </button>
                    ) : singleVariant ? (
                        <button
                            type="button"
                            disabled={addToCart.isPending}
                            onClick={() => addToCart.mutate({ variantId: singleVariant.id, quantity: 1 })}
                            className={`${buttonClasses('primary', 'sm')} w-full`}
                        >
                            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                            {addToCart.isPending ? 'Adding…' : 'Add to cart'}
                        </button>
                    ) : (
                        <Link to={`/products/${product.id}`} className={`${buttonClasses('outline', 'sm')} w-full`}>
                            Select options
                        </Link>
                    )}
                </div>
            </div>
        </article>
    );
}