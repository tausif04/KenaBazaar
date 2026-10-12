import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Heart, SearchX, ShoppingCart } from 'lucide-react';
import { useCategories, useProduct } from '../features/products/hooks';
import { useAddToCart } from '../features/cart/hooks';
import { useAddToWishlist, useRemoveFromWishlist, useWishlistLookup } from '../features/wishlist/hooks';
import ProductImageGallery from '../components/product/ProductImageGallery';
import ProductPrice from '../components/product/ProductPrice';
import ProductVariantSelector from '../components/product/ProductVariantSelector';
import QuantitySelector from '../components/cart/QuantitySelector';
import { EmptyState, ErrorState } from '../components/common/StateMessage';
import { getErrorMessage } from '../utils/getErrorMessage';
import { buttonClasses } from '../utils/ui';

function DetailsSkeleton() {
    return (
        <div className="grid animate-pulse gap-8 md:grid-cols-2" aria-busy="true">
            <div className="aspect-square rounded-xl bg-gray-200" />
            <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-gray-200" />
                <div className="h-6 w-1/4 rounded bg-gray-200" />
                <div className="h-24 rounded bg-gray-200" />
                <div className="h-12 rounded bg-gray-200" />
            </div>
        </div>
    );
}

export default function ProductDetailsPage() {
    const { id } = useParams();
    const { data: product, isLoading, isError, error, refetch } = useProduct(id);
    const { data: allCategories } = useCategories();
    const addToCart = useAddToCart();
    const addWish = useAddToWishlist();
    const removeWish = useRemoveFromWishlist();
    const { map } = useWishlistLookup();

    const [variantId, setVariantId] = useState(null);
    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (!product) return;
        const firstAvailable = product.variants.find((v) => v.stock > 0) ?? product.variants[0];
        setVariantId(firstAvailable?.id ?? null);
        setQuantity(1);
    }, [product]);

    if (isLoading) return <DetailsSkeleton />;

    if (isError) {
        if (error?.response?.status === 404) {
            return (
                <EmptyState icon={SearchX} title="Product not found" message="It may have been removed."
                    action={<Link to="/products" className={buttonClasses('primary')}>Browse products</Link>} />
            );
        }
        return <ErrorState message={getErrorMessage(error)} onRetry={refetch} />;
    }

    const variants = product.variants ?? [];
    const variant = variants.find((v) => v.id === variantId) ?? null;
    const stock = variant?.stock ?? 0;
    const canBuy = product.is_active !== false && variant && stock > 0;
    const productCategories = (allCategories ?? []).filter((c) => product.categories.includes(c.id));
    const wishlistItemId = map.get(product.id);
    const inWishlist = wishlistItemId !== undefined;
    const wishBusy = addWish.isPending || removeWish.isPending;

    const selectVariant = (vid) => { setVariantId(vid); setQuantity(1); };

    return (
        <div>
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-gray-600">
                <Link to="/products" className="hover:text-orange-600">Products</Link> <span aria-hidden="true">/</span>{' '}
                <span className="text-gray-900">{product.name}</span>
            </nav>

            <div className="grid gap-8 md:grid-cols-2">
                <ProductImageGallery images={product.images} name={product.name} />

                <div className="space-y-5">
                    <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
                    <ProductPrice product={product} size="lg" />

                    {productCategories.length > 0 && (
                        <p className="text-sm text-gray-600">
                            Category:{' '}
                            {productCategories.map((c, i) => (
                                <span key={c.id}>
                                    {i > 0 && ', '}
                                    {c.slug ? <Link className="font-medium text-orange-600 hover:underline" to={`/products?category=${encodeURIComponent(c.slug)}`}>{c.name}</Link> : c.name}
                                </span>
                            ))}
                        </p>
                    )}

                    {product.description && <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">{product.description}</p>}

                    <ProductVariantSelector variants={variants} selectedId={variantId} onSelect={selectVariant} />

                    <p className={`text-sm font-medium ${canBuy ? 'text-green-700' : 'text-red-600'}`} aria-live="polite">
                        {variants.length === 0 ? 'Currently unavailable' : canBuy ? `In stock (${stock} available)` : 'Out of stock'}
                    </p>

                    <div className="flex items-center gap-4">
                        <QuantitySelector value={quantity} onChange={setQuantity} max={stock || 1} disabled={!canBuy} />
                    </div>

                    <div className="flex gap-3">
                        <button
                            type="button"
                            disabled={!canBuy || addToCart.isPending}
                            onClick={() => addToCart.mutate({ variantId: variant.id, quantity })}
                            className={`${buttonClasses('primary', 'lg')} flex-1`}
                        >
                            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
                            {addToCart.isPending ? 'Adding…' : 'Add to cart'}
                        </button>
                        <button
                            type="button"
                            disabled={wishBusy}
                            aria-pressed={inWishlist}
                            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                            onClick={() => (inWishlist ? removeWish.mutate(wishlistItemId) : addWish.mutate(product.id))}
                            className={`${buttonClasses('outline', 'lg')} px-4`}
                        >
                            <Heart className={`h-5 w-5 ${inWishlist ? 'fill-orange-600 text-orange-600' : ''}`} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}