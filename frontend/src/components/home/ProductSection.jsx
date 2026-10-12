import { Link } from 'react-router-dom'
import ProductGrid from '../product/ProductGrid'
import { ErrorState } from '../common/StateMessage'
import { getErrorMessage } from '../../utils/getErrorMessage'

export default function ProductSection({
    id,
    title,
    subtitle,
    viewAllTo,
    products,
    isLoading,
    error,
    onRetry,
    hideWhenEmpty = false,
    accent = false,
}) {
    if (!isLoading && !error && products.length === 0 && hideWhenEmpty) return null

    return (
        <section id={id} aria-labelledby={`${id}-title`} className={accent ? 'rounded-2xl bg-orange-50 p-4 md:p-6' : ''}>
            <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                    <h2 id={`${id}-title`} className="text-xl font-bold md:text-2xl">
                        {title}
                    </h2>
                    {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
                </div>
                {viewAllTo && (
                    <Link to={viewAllTo} className="shrink-0 text-sm font-semibold text-orange-600 hover:underline">
                        View all
                    </Link>
                )}
            </div>
            {error ? (
                <ErrorState message={getErrorMessage(error)} onRetry={onRetry} />
            ) : products.length === 0 && !isLoading ? (
                <p className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-600">
                    Nothing here yet.
                </p>
            ) : (
                <ProductGrid products={products} isLoading={isLoading} skeletonCount={4} />
            )}
        </section>
    )
}