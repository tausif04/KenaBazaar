import ProductCard from './ProductCard';
import ProductCardSkeleton from './ProductCardSkeleton';

const GRID = 'grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4';

export default function ProductGrid({ products = [], isLoading = false, skeletonCount = 8 }) {
    if (isLoading) {
        return (
            <div className={GRID} aria-busy="true" aria-label="Loading products">
                {Array.from({ length: skeletonCount }, (_, i) => <ProductCardSkeleton key={i} />)}
            </div>
        );
    }
    return (
        <div className={GRID}>
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
    );
}